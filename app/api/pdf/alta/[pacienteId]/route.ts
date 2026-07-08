import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { resolveAccessTokenForBackendProxy } from "@/lib/server/backend-access";
import { backendApiUrl } from "@/lib/server-auth";
import {
  mapAppointmentFromApi,
  mapPatientFromApi,
} from "@/lib/api/fisio-api";
import { buildAltaHtml } from "@/lib/pdf/alta-html";
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
  const year = new Date().getFullYear();
  const from = `${year - 2}-01-01`;
  const to = `${year}-12-31`;

  const get = (path: string) => fetch(`${base}/${path}`, { headers: auth, cache: "no-store" });

  let patientRes: Response;
  let meRes: Response;
  let aptRes: Response;
  try {
    [meRes, patientRes, aptRes] = await Promise.all([
      get("auth/me"),
      get(`patients/${id}`),
      get(`appointments?from=${from}&to=${to}&patientId=${id}`),
    ]);
  } catch {
    return NextResponse.json(
      { code: "UPSTREAM", message: "Falha ao consultar os dados da alta" },
      { status: 502 },
    );
  }

  if (patientRes.status === 404) {
    return NextResponse.json({ code: "NOT_FOUND", message: "Paciente nao encontrado" }, { status: 404 });
  }
  if (!patientRes.ok || !meRes.ok) {
    return NextResponse.json(
      { code: "UPSTREAM", message: "Falha ao consultar os dados da alta" },
      { status: 502 },
    );
  }

  const me = (await meRes.json()) as Record<string, unknown>;
  const patient = mapPatientFromApi(await patientRes.json());
  if (patient.status !== "discharged") {
    return NextResponse.json(
      {
        code: "PATIENT_NOT_DISCHARGED",
        message: "Registre a alta do paciente antes de gerar o PDF",
      },
      { status: 400 },
    );
  }

  const appointments = aptRes.ok
    ? ((await aptRes.json()) as Record<string, unknown>[]).map(mapAppointmentFromApi)
    : [];

  const contentHash = createHash("sha256")
    .update(JSON.stringify({ patient, appointments }))
    .digest("hex");

  const generatedAt = new Date().toLocaleString("pt-BR");
  const html = buildAltaHtml({
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
    appointments,
    contentHash,
    systemVersion: SYSTEM_VERSION,
  });

  let pdf: Uint8Array;
  try {
    pdf = await renderHtmlToPdf(html, `${BRAND_NAME} · Alta · ${generatedAt}`);
  } catch (e) {
    console.error("[pdf] falha ao renderizar alta", e);
    return NextResponse.json(
      { code: "PDF_RENDER", message: "Nao foi possivel gerar o PDF de alta" },
      { status: 500 },
    );
  }

  return new Response(pdf as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="alta-${slug(patient.name)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
