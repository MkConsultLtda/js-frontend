import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { resolveAccessTokenForBackendProxy } from "@/lib/server/backend-access";
import { backendApiUrl } from "@/lib/server-auth";
import {
  canonicalHistoryOrder,
  mapAnamneseFromApi,
  mapAppointmentFromApi,
  mapEvolucaoFromApi,
  mapPatientFromApi,
  mapPatientHistoryFromApi,
  mapSettledWithConcurrency,
  HISTORY_WINDOW_CONCURRENCY,
  CLINIC_ANAMNESES_LIMIT,
  patientHistoryWindows,
  type PatientHistory,
} from "@/lib/api/fisio-api";
import { buildProntuarioHtml } from "@/lib/pdf/prontuario-html";
import { renderHtmlToPdf } from "@/lib/pdf/browser";
import { BRAND_NAME } from "@/lib/brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SYSTEM_VERSION = "v1";

function slug(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
      .slice(0, 48) || "paciente"
  );
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ pacienteId: string }> },
) {
  const session = await resolveAccessTokenForBackendProxy();
  if (!session.ok) return session.response;

  const { pacienteId } = await ctx.params;
  const id = Number(pacienteId);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json(
      { code: "VALIDATION", message: "Identificador de paciente invalido" },
      { status: 400 },
    );
  }

  const base = backendApiUrl();
  const auth = { Authorization: `Bearer ${session.accessToken}`, Accept: "application/json" };

  const get = (path: string) => fetch(`${base}/${path}`, { headers: auth, cache: "no-store" });
  const upstreamFail = (what: string) =>
    NextResponse.json(
      {
        code: "UPSTREAM_INCOMPLETE",
        message: `Nao foi possivel gerar o prontuario: falha ao consultar ${what}. O PDF nao foi gerado para evitar um prontuario incompleto. Tente novamente.`,
      },
      { status: 502 },
    );
  const rateLimited = (res: Response) =>
    NextResponse.json(
      {
        code: "UPSTREAM_RATE_LIMITED",
        message: "Muitas requisicoes ao servidor. Aguarde alguns instantes e tente novamente.",
      },
      { status: 429, headers: { "Retry-After": res.headers.get("Retry-After") ?? "5" } },
    );

  /**
   * TEMPORARIO: fluxo por janelas anuais, usado so enquanto o backend nao tiver
   * `GET patients/{id}/history` (404 de rota com o paciente existente).
   */
  const loadLegacyHistory = async (
    registeredAt: string | undefined,
  ): Promise<PatientHistory | Response> => {
    const windows = patientHistoryWindows(registeredAt);
    const paths = [
      `patients/${id}/anamneses`,
      ...windows.flatMap((w) => [
        `patients/${id}/evolutions?from=${w.from}&to=${w.to}`,
        `appointments?from=${w.from}&to=${w.to}&patientId=${id}`,
      ]),
    ];
    const settled = await mapSettledWithConcurrency(paths, HISTORY_WINDOW_CONCURRENCY, get);
    if (settled.some((r) => r.status === "rejected")) {
      return upstreamFail("as anamneses, evolucoes e a agenda");
    }
    const responses = settled.map((r) => (r as PromiseFulfilledResult<Response>).value);
    const limited = responses.find((r) => r.status === 429);
    if (limited) return rateLimited(limited);
    if (responses.some((r) => !r.ok)) return upstreamFail("as anamneses, evolucoes e a agenda");
    try {
      const bodies = (await Promise.all(responses.map((r) => r.json()))) as Record<
        string,
        unknown
      >[][];
      const [anam, ...rest] = bodies;
      return {
        ...canonicalHistoryOrder({
          anamneses: anam.map(mapAnamneseFromApi),
          evolucoes: rest.filter((_, i) => i % 2 === 0).flat().map(mapEvolucaoFromApi),
          appointments: rest.filter((_, i) => i % 2 === 1).flat().map(mapAppointmentFromApi),
        }),
        // Lista legada sem sinal de truncamento: no teto, assume que pode haver mais.
        truncated: {
          anamneses: anam.length >= CLINIC_ANAMNESES_LIMIT,
          evolucoes: false,
          appointments: false,
        },
        limit: 0,
      };
    } catch {
      return upstreamFail("as anamneses, evolucoes e a agenda");
    }
  };

  let patientRes: Response;
  let meRes: Response;
  let historyRes: Response;
  try {
    [meRes, patientRes, historyRes] = await Promise.all([
      get("auth/me"),
      get(`patients/${id}`),
      get(`patients/${id}/history`),
    ]);
  } catch {
    return NextResponse.json(
      { code: "UPSTREAM", message: "Falha ao consultar os dados do prontuario" },
      { status: 502 },
    );
  }

  const limited = [meRes, patientRes, historyRes].find((r) => r.status === 429);
  if (limited) return rateLimited(limited);
  if (patientRes.status === 404) {
    return NextResponse.json({ code: "NOT_FOUND", message: "Paciente nao encontrado" }, { status: 404 });
  }
  if (!patientRes.ok || !meRes.ok) {
    return NextResponse.json(
      { code: "UPSTREAM", message: "Falha ao consultar os dados do prontuario" },
      { status: 502 },
    );
  }

  let me: Record<string, unknown>;
  let patient: ReturnType<typeof mapPatientFromApi>;
  try {
    me = (await meRes.json()) as Record<string, unknown>;
    patient = mapPatientFromApi(await patientRes.json());
  } catch {
    return upstreamFail("o paciente");
  }

  let history: PatientHistory;
  if (historyRes.status === 404) {
    // Paciente existe (nao deu 404 acima): a rota /history ainda nao foi publicada.
    const legacy = await loadLegacyHistory(patient.registeredAt);
    if (legacy instanceof Response) return legacy;
    history = legacy;
  } else {
    if (!historyRes.ok) return upstreamFail("o historico do paciente");
    let parsed: PatientHistory | null = null;
    try {
      parsed = mapPatientHistoryFromApi(await historyRes.json());
    } catch {
      parsed = null;
    }
    if (!parsed) return upstreamFail("o historico do paciente");
    history = parsed;
  }

  if (history.truncated.anamneses || history.truncated.evolucoes || history.truncated.appointments) {
    return NextResponse.json(
      {
        code: "PRONTUARIO_TRUNCATED",
        message:
          "O historico deste paciente excede o limite de registros. O PDF nao foi gerado para evitar um prontuario incompleto.",
      },
      { status: 422 },
    );
  }

  const { anamneses, evolucoes, appointments } = history;

  const contentHash = createHash("sha256")
    .update(JSON.stringify({ patient, anamneses, evolucoes, appointments }))
    .digest("hex");

  const generatedAt = new Date().toLocaleString("pt-BR");
  const html = buildProntuarioHtml({
    clinicTitle: BRAND_NAME,
    generatedAt,
    professional: {
      name: String(me.name ?? ""),
      title: String(me.professionalTitle ?? "Fisioterapeuta"),
      crefito: String(me.crefito ?? ""),
      signatureImage: String(me.signatureImage ?? ""),
      logoDataUrl: String(me.photoDataUrl ?? ""),
    },
    patient,
    anamneses,
    evolucoes,
    appointments,
    contentHash,
    systemVersion: SYSTEM_VERSION,
  });

  let pdf: Uint8Array;
  try {
    pdf = await renderHtmlToPdf(html, `${BRAND_NAME} · Gerado em ${generatedAt}`);
  } catch (e) {
    console.error("[pdf] falha ao renderizar prontuario", e);
    return NextResponse.json(
      { code: "PDF_RENDER", message: "Nao foi possivel gerar o PDF do prontuario" },
      { status: 500 },
    );
  }

  return new Response(pdf as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="prontuario-${slug(patient.name)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
