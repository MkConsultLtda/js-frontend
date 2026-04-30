import { backendApiHref, backendJson } from "@/lib/api/backend-client";
import { brDateToIsoDate, formatIsoDateToBR, toLocalDateString } from "@/lib/date-utils";
import type { AnamneseFormValues } from "@/lib/schemas/anamnese-form";
import type { EvolucaoFormValues } from "@/lib/schemas/evolucao-form";
import type { PatientCreateFormValues } from "@/lib/schemas/patient-form";
import type {
  Anamnese,
  Appointment,
  Evolucao,
  Holiday,
  Patient,
  PatientAttachment,
} from "@/lib/types";

export type SpringPageDto<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

/** Feriados: sem API no MVP — grade sem bloqueios nacionais. */
export function emptyHolidayList(): Holiday[] {
  return [];
}

/** JSON bruto vindos da API antes do mapper (camelCase Jackson). */
type PatientDto = Record<string, unknown>;

type AppointmentDto = Record<string, unknown>;

type AnamneseDto = Record<string, unknown>;

type EvolucaoDto = Record<string, unknown>;

export function mapPatientFromApi(raw: PatientDto): Patient {
  const address = raw.address as Record<string, unknown> | undefined;
  const lastIso =
    typeof raw.lastSession === "string"
      ? raw.lastSession.substring(0, 10)
      : "";
  const regIso =
    typeof raw.registeredAt === "string"
      ? raw.registeredAt.substring(0, 10)
      : "";
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ""),
    birthDate:
      typeof raw.birthDate === "string" ? raw.birthDate.substring(0, 10) : "",
    email: String(raw.email ?? ""),
    cpf: raw.cpf != null ? String(raw.cpf) : undefined,
    diagnosis: String(raw.diagnosis ?? ""),
    phone: String(raw.phone ?? ""),
    responsiblePhone:
      raw.responsiblePhone != null ? String(raw.responsiblePhone) : undefined,
    profession: raw.profession != null ? String(raw.profession) : undefined,
    educationLevel:
      raw.educationLevel != null ? String(raw.educationLevel) : undefined,
    referralSource:
      raw.referralSource != null ? String(raw.referralSource) : undefined,
    address: address
      ? {
          cep: String(address.cep ?? ""),
          logradouro: String(address.logradouro ?? ""),
          numero: String(address.numero ?? ""),
          complemento: String(address.complemento ?? ""),
          bairro: String(address.bairro ?? ""),
          cidade: String(address.cidade ?? ""),
          uf: String(address.uf ?? ""),
        }
      : {
          cep: "",
          logradouro: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
          uf: "",
        },
    lastSession: lastIso ? formatIsoDateToBR(lastIso) : "",
    status: raw.status === "inactive" ? "inactive" : "active",
    registeredAt: regIso ? formatIsoDateToBR(regIso) : "",
  };
}

export function mapAppointmentFromApi(raw: AppointmentDto): Appointment {
  const kind = raw.kind;
  const status = String(raw.status ?? "scheduled");
  return {
    id: Number(raw.id),
    kind:
      kind === "personal" || kind === "block" || kind === "session"
        ? kind
        : "session",
    patientId: Number(raw.patientId ?? 0),
    patientName: String(raw.patientName ?? ""),
    date: typeof raw.date === "string" ? raw.date.substring(0, 10) : "",
    time: String(raw.time ?? "00:00"),
    duration: Number(raw.duration ?? 50),
    type: String(raw.type ?? ""),
    status:
      status === "confirmed" ||
      status === "completed" ||
      status === "cancelled" ||
      status === "scheduled"
        ? status
        : "scheduled",
    notes: raw.notes != null ? String(raw.notes) : undefined,
    paymentStatus: raw.paymentStatus === "paid" ? "paid" : "pending",
  };
}

function isoDate(raw: unknown): string {
  if (typeof raw === "string") return raw.substring(0, 10);
  return "";
}

export function mapAnamneseFromApi(raw: AnamneseDto): Anamnese {
  const d = isoDate(raw.dataColeta);
  return {
    id: Number(raw.id),
    patientId: Number(raw.patientId),
    patientName: String(raw.patientName ?? ""),
    dataColeta: d ? formatIsoDateToBR(d) : "",
    anamneseTexto: raw.anamneseTexto != null ? String(raw.anamneseTexto) : undefined,
    queixaPrincipal: String(raw.queixaPrincipal ?? ""),
    historiaDoenca: String(raw.historiaDoenca ?? ""),
    antecedentesFamiliares: String(raw.antecedentesFamiliares ?? ""),
    medicamentos: String(raw.medicamentos ?? ""),
    alergias: String(raw.alergias ?? ""),
    habitosVida: String(raw.habitosVida ?? ""),
    exameFisico: String(raw.exameFisico ?? ""),
    diagnosticoFisioterapico: String(raw.diagnosticoFisioterapico ?? ""),
    objetivosTratamento: String(raw.objetivosTratamento ?? ""),
  };
}

/** dataSessao em yyyy-MM-dd para comparações; exibição com formatIsoDateToBR. */
export function mapEvolucaoFromApi(raw: EvolucaoDto): Evolucao {
  return {
    id: Number(raw.id),
    patientId: Number(raw.patientId),
    patientName: String(raw.patientName ?? ""),
    dataSessao: isoDate(raw.dataSessao),
    tipoSessao: String(raw.tipoSessao ?? ""),
    sinaisVitaisInicio:
      raw.sinaisVitaisInicio != null ? String(raw.sinaisVitaisInicio) : undefined,
    sinaisVitaisFim:
      raw.sinaisVitaisFim != null ? String(raw.sinaisVitaisFim) : undefined,
    objetivosSessao: String(raw.objetivosSessao ?? ""),
    atividadesRealizadas: String(raw.atividadesRealizadas ?? ""),
    respostaPaciente: String(raw.respostaPaciente ?? ""),
    dorPre: Number(raw.dorPre ?? 0),
    dorPos: Number(raw.dorPos ?? 0),
    observacoes: String(raw.observacoes ?? ""),
    planoProximaSessao: String(raw.planoProximaSessao ?? ""),
  };
}

export function mapPatientAttachmentFromApi(raw: Record<string, unknown>): PatientAttachment {
  return {
    id: Number(raw.id),
    patientId: Number(raw.patientId),
    fileName: String(raw.fileName ?? ""),
    mimeType: String(raw.mimeType ?? ""),
    sizeBytes: Number(raw.sizeBytes ?? 0),
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
    /** URL pré-assinada (API); sem data URL local */
    downloadUrl:
      typeof raw.downloadUrl === "string" ? raw.downloadUrl : undefined,
    dataUrl: "",
  };
}

/** --- Lista paginada de pacientes (busca servidor) --- */

export async function fetchPatientPage(opts: {
  q?: string;
  page?: number;
  size?: number;
}): Promise<SpringPageDto<Patient>> {
  const href = backendApiHref("patients", {
    q: opts.q,
    page: opts.page ?? 0,
    size: opts.size ?? 50,
  });
  const page = await backendJson<SpringPageDto<PatientDto>>(href);
  return {
    ...page,
    content: page.content.map(mapPatientFromApi),
  };
}

export async function fetchPatientById(id: number): Promise<Patient> {
  const raw = await backendJson<PatientDto>(backendApiHref(`patients/${id}`));
  return mapPatientFromApi(raw);
}

export async function fetchPatientDetailBundle(pid: number) {
  const y = new Date().getFullYear();
  const from = `${y}-01-01`;
  const to = `${y}-12-31`;
  const patient = await fetchPatientById(pid);
  const [anamneses, evolucoes, appointments] = await Promise.all([
    fetchAnamnesesForPatient(pid),
    fetchEvolutionsForPatient(pid, from, to),
    fetchAppointmentsRange(from, to, pid),
  ]);
  return { patient, anamneses, evolucoes, appointments };
}

/** --- Agenda --- */

export async function fetchAppointmentsRange(from: string, to: string, patientId?: number) {
  const href = backendApiHref("appointments", { from, to, patientId });
  const list = await backendJson<AppointmentDto[]>(href);
  return list.map(mapAppointmentFromApi);
}

/** --- Anamnese / evolução por paciente --- */

export async function fetchAnamnesesForPatient(patientId: number) {
  const list = await backendJson<AnamneseDto[]>(
    backendApiHref(`patients/${patientId}/anamneses`),
  );
  return list.map(mapAnamneseFromApi);
}

export async function fetchEvolutionsForPatient(
  patientId: number,
  from: string,
  to: string,
) {
  const list = await backendJson<EvolucaoDto[]>(
    backendApiHref(`patients/${patientId}/evolutions`, { from, to }),
  );
  return list.map(mapEvolucaoFromApi);
}

const EVOLUTION_AGG_CONCURRENCY = 8;

export async function fetchAggregatedEvolutions(patients: { id: number }[], from: string, to: string) {
  if (patients.length === 0) return [];
  const out: Evolucao[] = [];
  let rejectedCount = 0;
  for (let i = 0; i < patients.length; i += EVOLUTION_AGG_CONCURRENCY) {
    const slice = patients.slice(i, i + EVOLUTION_AGG_CONCURRENCY);
    const chunks = await Promise.allSettled(
      slice.map((p) => fetchEvolutionsForPatient(p.id, from, to)),
    );
    for (const c of chunks) {
      if (c.status === "fulfilled") out.push(...c.value);
      else rejectedCount += 1;
    }
  }
  if (rejectedCount > 0) {
    console.warn(
      `[dashboard] ${rejectedCount} chamada(s) de evoluções falharam; mantendo métricas parciais.`,
    );
  }
  return out;
}

/** Compatível com APIs Spring sem `GET /v1/metrics/dashboard`. */
async function fetchDashboardBundleLegacy(
  from: string,
  to: string,
): Promise<{ patients: Patient[]; appointments: Appointment[]; evolucoes: Evolucao[] }> {
  const [patientPage, appointments] = await Promise.all([
    fetchPatientPage({ size: 500 }),
    fetchAppointmentsRange(from, to),
  ]);
  const patients = patientPage.content;
  const evolucoes = await fetchAggregatedEvolutions(patients, from, to);
  return { patients, appointments, evolucoes };
}

/**
 * Preferência: `GET /v1/metrics/dashboard?from=&to=`.
 * Se o upstream responder 404 (build antigo do backend local), faz o fluxo paralelo anterior.
 */
export async function fetchDashboardMetricsBundle(from: string, to: string): Promise<{
  patients: Patient[];
  appointments: Appointment[];
  evolucoes: Evolucao[];
}> {
  type BundleDto = {
    patients: PatientDto[];
    appointments: AppointmentDto[];
    evolucoes: EvolucaoDto[];
  };
  try {
    const raw = await backendJson<BundleDto>(backendApiHref("metrics/dashboard", { from, to }));
    return {
      patients: raw.patients.map(mapPatientFromApi),
      appointments: raw.appointments.map(mapAppointmentFromApi),
      evolucoes: raw.evolucoes.map(mapEvolucaoFromApi),
    };
  } catch (e) {
    const status = (e as Error & { status?: number }).status;
    if (status === 404) return fetchDashboardBundleLegacy(from, to);
    throw e;
  }
}

export async function fetchAggregatedAnamneses(patients: { id: number }[]) {
  if (patients.length === 0) return [];
  const chunks = await Promise.all(patients.map((p) => fetchAnamnesesForPatient(p.id)));
  return chunks.flat();
}

/** --- escritas (corpos alinhados ao Spring) --- */

export function patientCreateApiBody(values: Record<string, unknown>): Record<string, unknown> {
  return values;
}

export async function apiCreatePatient(body: Record<string, unknown>): Promise<Patient> {
  const raw = await backendJson<PatientDto>(
    backendApiHref("patients"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return mapPatientFromApi(raw);
}

export async function apiReplacePatient(id: number, body: Record<string, unknown>): Promise<Patient> {
  const raw = await backendJson<PatientDto>(backendApiHref(`patients/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return mapPatientFromApi(raw);
}

export async function apiPatchPatient(id: number, body: Record<string, unknown>): Promise<Patient> {
  const raw = await backendJson<PatientDto>(backendApiHref(`patients/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return mapPatientFromApi(raw);
}

export async function apiDeletePatient(id: number): Promise<void> {
  await backendJson<void>(backendApiHref(`patients/${id}`), { method: "DELETE" });
}

export async function apiCreateAppointment(body: Record<string, unknown>): Promise<Appointment> {
  const raw = await backendJson<AppointmentDto>(backendApiHref(`appointments`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return mapAppointmentFromApi(raw);
}

export async function apiReplaceAppointment(
  id: number,
  body: Record<string, unknown>,
): Promise<Appointment> {
  const raw = await backendJson<AppointmentDto>(backendApiHref(`appointments/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return mapAppointmentFromApi(raw);
}

export async function apiDeleteAppointment(id: number): Promise<void> {
  await backendJson<void>(backendApiHref(`appointments/${id}`), { method: "DELETE" });
}

export async function apiCreateAnamnese(body: Record<string, unknown>): Promise<Anamnese> {
  const raw = await backendJson<AnamneseDto>(backendApiHref(`anamneses`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return mapAnamneseFromApi(raw);
}

export async function apiReplaceAnamnese(id: number, body: Record<string, unknown>): Promise<Anamnese> {
  const raw = await backendJson<AnamneseDto>(backendApiHref(`anamneses/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return mapAnamneseFromApi(raw);
}

export async function apiDeleteAnamnese(id: number): Promise<void> {
  await backendJson<void>(backendApiHref(`anamneses/${id}`), { method: "DELETE" });
}

export async function apiCreateEvolution(body: Record<string, unknown>): Promise<Evolucao> {
  const raw = await backendJson<EvolucaoDto>(backendApiHref(`evolutions`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return mapEvolucaoFromApi(raw);
}

export async function apiReplaceEvolution(id: number, body: Record<string, unknown>): Promise<Evolucao> {
  const raw = await backendJson<EvolucaoDto>(backendApiHref(`evolutions/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return mapEvolucaoFromApi(raw);
}

export async function apiDeleteEvolution(id: number): Promise<void> {
  await backendJson<void>(backendApiHref(`evolutions/${id}`), { method: "DELETE" });
}

export async function fetchAttachmentsForPatient(patientId: number): Promise<PatientAttachment[]> {
  const list = await backendJson<Record<string, unknown>[]>(
    backendApiHref(`patients/${patientId}/attachments`),
  );
  return list.map(mapPatientAttachmentFromApi);
}

export async function apiUploadAttachment(patientId: number, file: File): Promise<PatientAttachment> {
  const form = new FormData();
  form.set("file", file);
  const raw = await backendJson<Record<string, unknown>>(backendApiHref(`patients/${patientId}/attachments`), {
    method: "POST",
    body: form,
  });
  return mapPatientAttachmentFromApi(raw);
}

export async function apiDeleteAttachment(id: number): Promise<void> {
  await backendJson<void>(backendApiHref(`attachments/${id}`), { method: "DELETE" });
}

/** Formulário de cadastro (`PatientCreateFormValues`) → JSON da API. */

export function dtoPatientCreateFromFormValues(data: PatientCreateFormValues): Record<string, unknown> {
  const today = toLocalDateString(new Date());
  return {
    name: data.name,
    birthDate: data.birthDate,
    email: data.email.trim() || "nao-informado@example.com",
    cpf: data.cpf.trim() || undefined,
    diagnosis: data.diagnosis,
    phone: data.phone.trim(),
    responsiblePhone: data.responsiblePhone.trim() || undefined,
    profession: data.profession.trim() || undefined,
    educationLevel: data.educationLevel.trim() || undefined,
    referralSource: data.referralSource.trim() || undefined,
    address: {
      cep: data.addressCep.replace(/\D/g, ""),
      logradouro: data.addressLogradouro,
      numero: data.addressNumero,
      complemento: data.addressComplemento?.trim() || "",
      bairro: data.addressBairro,
      cidade: data.addressCidade,
      uf: data.addressUf.toUpperCase().slice(0, 2),
    },
    lastSession: null,
    status: "active",
    registeredAt: today,
  };
}

export function isoFromDisplayDate(s: string): string | null {
  if (!s.trim()) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const fromBr = brDateToIsoDate(s);
  return fromBr;
}

const ANAMNESE_STRUCTURE_PLACEHOLDER = " ";

/** Corpo compatível com `AnamneseRequest` quando o formulário envia apenas HTML ricamente formatado. */
export function anamneseRequestBody(
  values: AnamneseFormValues,
  editing: Pick<Anamnese, "dataColeta"> | null,
): Record<string, unknown> {
  const dataColeta =
    (editing && isoFromDisplayDate(editing.dataColeta)) ??
    toLocalDateString(new Date());
  const html = values.anamneseTexto.trim();
  return {
    patientId: Number(values.patientId),
    dataColeta,
    anamneseTexto: html.length > 0 ? html : "",
    queixaPrincipal: ANAMNESE_STRUCTURE_PLACEHOLDER,
    historiaDoenca: ANAMNESE_STRUCTURE_PLACEHOLDER,
    antecedentesFamiliares: ANAMNESE_STRUCTURE_PLACEHOLDER,
    medicamentos: ANAMNESE_STRUCTURE_PLACEHOLDER,
    alergias: ANAMNESE_STRUCTURE_PLACEHOLDER,
    habitosVida: ANAMNESE_STRUCTURE_PLACEHOLDER,
    exameFisico: ANAMNESE_STRUCTURE_PLACEHOLDER,
    diagnosticoFisioterapico: ANAMNESE_STRUCTURE_PLACEHOLDER,
    objetivosTratamento: ANAMNESE_STRUCTURE_PLACEHOLDER,
  };
}

export function evolucaoRequestBody(values: EvolucaoFormValues): Record<string, unknown> {
  return {
    patientId: Number(values.patientId),
    dataSessao: values.dataSessao,
    tipoSessao: values.tipoSessao,
    sinaisVitaisInicio: values.sinaisVitaisInicio.trim() || "",
    sinaisVitaisFim: values.sinaisVitaisFim.trim() || "",
    objetivosSessao: values.objetivosSessao,
    atividadesRealizadas: values.atividadesRealizadas,
    respostaPaciente: values.respostaPaciente,
    dorPre: values.dorPre,
    dorPos: values.dorPos,
    observacoes: values.observacoes.trim() || "",
    planoProximaSessao: values.planoProximaSessao.trim() || "",
  };
}

export function patientToReplaceBodyFromDomain(p: Patient): Record<string, unknown> {
  const lastIso = isoFromDisplayDate(p.lastSession);
  const registeredIso =
    isoFromDisplayDate(p.registeredAt) ?? toLocalDateString(new Date());
  return {
    name: p.name,
    birthDate: p.birthDate,
    email: p.email.trim() || "nao-informado@example.com",
    cpf: p.cpf?.trim() || undefined,
    diagnosis: p.diagnosis,
    phone: p.phone.trim(),
    responsiblePhone: p.responsiblePhone?.trim() || undefined,
    profession: p.profession?.trim() || undefined,
    educationLevel: p.educationLevel?.trim() || undefined,
    referralSource: p.referralSource?.trim() || undefined,
    address: {
      cep: p.address.cep.replace(/\D/g, ""),
      logradouro: p.address.logradouro,
      numero: p.address.numero,
      complemento: p.address.complemento ?? "",
      bairro: p.address.bairro,
      cidade: p.address.cidade,
      uf: p.address.uf.toUpperCase().slice(0, 2),
    },
    lastSession: lastIso,
    status: p.status,
    registeredAt: registeredIso,
  };
}

export function dtoAgendaPayloadSession(input: {
  kind?: string;
  patientId: number;
  patientName: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  notes?: string;
  paymentStatus: string;
}): Record<string, unknown> {
  const kind =
    input.kind ?? (input.patientId > 0 ? "session" : "personal");
  return {
    kind,
    patientId: input.patientId || null,
    patientName: input.patientName,
    date: input.date,
    time: input.time,
    duration: input.duration,
    type: input.type,
    status: input.status,
    notes: input.notes ?? null,
    paymentStatus: input.paymentStatus,
  };
}
