import { backendApiHref, backendJson } from "@/lib/api/backend-client";
import {
  brDateToIsoDate,
  formatIsoDateToBR,
  isoDateFromJsonField,
  normalizeTimeForInput,
  toLocalDateString,
} from "@/lib/date-utils";
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

/** Feriados via API */
export async function fetchHolidays(year: number): Promise<Holiday[]> {
  type HolidayDto = { id: number; date: string; name: string };
  const raw = await backendJson<HolidayDto[]>(backendApiHref("holidays", { year }));
  return raw.map((h, i) => ({
    id: h.id > 0 ? h.id : -(i + 1),
    date: h.date,
    name: h.name,
  }));
}

/** @deprecated use fetchHolidays */
export function emptyHolidayList(): Holiday[] {
  return [];
}

/** JSON bruto vindos da API antes do mapper (camelCase Jackson). */
type PatientDto = Record<string, unknown>;

type AppointmentDto = Record<string, unknown>;

type AnamneseDto = Record<string, unknown>;

type EvolucaoDto = Record<string, unknown>;

function patientDtoDate(raw: PatientDto, camel: string, snake: string): string {
  const v = raw[camel] ?? raw[snake];
  return isoDateFromJsonField(v);
}

export function mapPatientFromApi(raw: PatientDto): Patient {
  const address = raw.address as Record<string, unknown> | undefined;
  const birthIso = patientDtoDate(raw, "birthDate", "birth_date");
  const lastIso = patientDtoDate(raw, "lastSession", "last_session");
  const regIso = patientDtoDate(raw, "registeredAt", "registered_at");
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ""),
    birthDate: birthIso,
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
    status:
      raw.status === "inactive"
        ? "inactive"
        : raw.status === "discharged"
          ? "discharged"
          : "active",
    registeredAt: regIso ? formatIsoDateToBR(regIso) : "",
    totalSessionsPlanned: Math.max(0, Number(raw.totalSessionsPlanned ?? 0)),
    dischargedAt: patientDtoDate(raw, "dischargedAt", "discharged_at") || undefined,
    dischargeSummary:
      raw.dischargeSummary != null ? String(raw.dischargeSummary) : undefined,
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
    time: normalizeAgendaTime(String(raw.time ?? "00:00")),
    duration: Number(raw.duration ?? 50),
    type: String(raw.type ?? ""),
    status:
      status === "confirmed" ||
      status === "completed" ||
      status === "cancelled" ||
      status === "scheduled" ||
      status === "no_show"
        ? status
        : "scheduled",
    notes: raw.notes != null ? String(raw.notes) : undefined,
    paymentStatus:
      raw.paymentStatus === "paid" || raw.pay === "paid" ? "paid" : "pending",
    sessionAmount:
      raw.sessionAmount != null ? Number(raw.sessionAmount) : undefined,
    paymentPlan:
      raw.paymentPlan === "upfront" || raw.paymentPlan === "installments"
        ? raw.paymentPlan
        : raw.paymentPlan === "per_session"
          ? "per_session"
          : undefined,
    packageAmount: raw.packageAmount != null ? Number(raw.packageAmount) : undefined,
    installmentCount:
      raw.installmentCount != null ? Number(raw.installmentCount) : undefined,
    seriesId: raw.seriesId != null ? String(raw.seriesId) : undefined,
  };
}

function normalizeAgendaTime(time: string): string {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/);
  if (!m) return time.length >= 5 ? time.slice(0, 5) : time;
  const h = String(Math.min(23, Math.max(0, Number.parseInt(m[1], 10)))).padStart(
    2,
    "0",
  );
  return `${h}:${m[2]}`;
}

export function mapAnamneseFromApi(raw: AnamneseDto): Anamnese {
  const d = isoDateFromJsonField(raw.dataColeta);
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
  const dataSessao = isoDateFromJsonField(raw.dataSessao);
  const horaRaw = raw.horaAtendimento;
  let horaNorm = "";
  if (horaRaw != null && horaRaw !== "") {
    if (Array.isArray(horaRaw) && horaRaw.length >= 2) {
      const h = Number(horaRaw[0]);
      const mi = Number(horaRaw[1]);
      if (Number.isFinite(h) && Number.isFinite(mi)) {
        horaNorm = normalizeTimeForInput(`${h}:${mi}`);
      }
    } else if (typeof horaRaw === "string") {
      horaNorm = normalizeTimeForInput(horaRaw);
    }
  }
  return {
    id: Number(raw.id),
    patientId: Number(raw.patientId),
    patientName: String(raw.patientName ?? ""),
    dataSessao,
    horaAtendimento: horaNorm || null,
    tipoSessao: String(raw.tipoSessao ?? ""),
    sinaisVitaisInicio:
      raw.sinaisVitaisInicio != null ? String(raw.sinaisVitaisInicio) : undefined,
    sinaisVitaisFim:
      raw.sinaisVitaisFim != null ? String(raw.sinaisVitaisFim) : undefined,
    objetivosSessao: String(raw.objetivosSessao ?? ""),
    atividadesRealizadas: String(raw.atividadesRealizadas ?? ""),
    respostaPaciente: String(raw.respostaPaciente ?? ""),
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
    urlExpiresInSeconds:
      raw.urlExpiresInSeconds != null ? Number(raw.urlExpiresInSeconds) : undefined,
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
    sort: "name,asc",
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

/** Máximo de chamadas simultâneas nas janelas anuais (evolução + agenda). */
export const HISTORY_WINDOW_CONCURRENCY = 6;

/**
 * Executa `fn` sobre `items` com no máximo `limit` chamadas simultâneas.
 * Mesma semântica de `Promise.allSettled` (nunca rejeita; preserva a ordem).
 */
export async function mapSettledWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next;
      next += 1;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i], i) };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  };
  const size = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: size }, worker));
  return results;
}

/** Ano de uma data dd/mm/aaaa ou aaaa-mm-dd (com validação de calendário); NaN se inválida. */
function yearOfRegistration(value: string | undefined): number {
  const s = value?.trim();
  if (!s) return NaN;
  let y: number;
  let mo: number;
  let d: number;
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/);
  if (br) {
    [d, mo, y] = [Number(br[1]), Number(br[2]), Number(br[3])];
  } else if (iso) {
    [y, mo, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  } else {
    return NaN;
  }
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return NaN;
  return y;
}

/**
 * Janelas anuais (<= 366 dias, limite do backend em produção) cobrindo todo o histórico:
 * começa no menor entre (ano do cadastro - 1) e (ano atual - 10), para não cortar sessões
 * retroativas/importadas (COFFITO), e vai até o ano seguinte (agenda futura).
 * Cadastro ausente, inválido ou no futuro é ignorado.
 */
/** Piso de ano e teto de janelas do fallback legado (temporário). */
export const HISTORY_YEAR_FLOOR = 2000;
export const HISTORY_MAX_WINDOWS = 30;

export function patientHistoryWindows(
  registeredAt: string | undefined,
  now: Date = new Date(),
): { from: string; to: string }[] {
  const currentYear = now.getFullYear();
  const regYear = yearOfRegistration(registeredAt);
  const floor = currentYear - 10;
  const startYear = Math.max(
    HISTORY_YEAR_FLOOR,
    Number.isFinite(regYear) && regYear >= 1900 && regYear <= currentYear
      ? Math.min(regYear - 1, floor)
      : floor,
  );
  const windows: { from: string; to: string }[] = [];
  for (let y = startYear; y <= currentYear + 1; y += 1) {
    windows.push({ from: `${y}-01-01`, to: `${y}-12-31` });
  }
  // Teto: mantém as janelas mais recentes.
  return windows.slice(-HISTORY_MAX_WINDOWS);
}

export type PatientHistoryTruncated = {
  anamneses: boolean;
  evolucoes: boolean;
  appointments: boolean;
};

export type PatientHistory = {
  anamneses: Anamnese[];
  evolucoes: Evolucao[];
  appointments: Appointment[];
  truncated: PatientHistoryTruncated;
  limit: number;
};

/** Ano (4 primeiros dígitos) de uma data ISO; 0 se ausente. */
function isoYear(iso: string): number {
  return Number.parseInt(iso.slice(0, 4), 10) || 0;
}

/**
 * Ordem canônica do histórico (a mesma que o fluxo por janelas anuais produzia):
 * anamneses como vêm do backend (mais recentes primeiro); evoluções por ano crescente e,
 * dentro do ano, mais recentes primeiro; agenda crescente por data/hora/id.
 * Mantém o contentHash do PDF estável para os mesmos dados.
 */
export function canonicalHistoryOrder(h: {
  anamneses: Anamnese[];
  evolucoes: Evolucao[];
  appointments: Appointment[];
}) {
  return {
    anamneses: h.anamneses,
    evolucoes: [...h.evolucoes].sort(
      (a, b) =>
        isoYear(a.dataSessao) - isoYear(b.dataSessao) ||
        b.dataSessao.localeCompare(a.dataSessao) ||
        b.id - a.id,
    ),
    appointments: [...h.appointments].sort(
      (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.id - b.id,
    ),
  };
}

/** Mapeia a resposta de `GET /v1/patients/{id}/history`; `null` se o formato for inválido. */
export function mapPatientHistoryFromApi(raw: unknown): PatientHistory | null {
  const r = raw as Record<string, unknown> | null;
  const t = r?.truncated as Record<string, unknown> | undefined;
  if (
    !r ||
    !Array.isArray(r.anamneses) ||
    !Array.isArray(r.evolucoes) ||
    !Array.isArray(r.appointments) ||
    !t ||
    typeof t.anamneses !== "boolean" ||
    typeof t.evolucoes !== "boolean" ||
    typeof t.appointments !== "boolean"
  ) {
    return null;
  }
  const ordered = canonicalHistoryOrder({
    anamneses: (r.anamneses as AnamneseDto[]).map(mapAnamneseFromApi),
    evolucoes: (r.evolucoes as EvolucaoDto[]).map(mapEvolucaoFromApi),
    appointments: (r.appointments as AppointmentDto[]).map(mapAppointmentFromApi),
  });
  return {
    ...ordered,
    truncated: {
      anamneses: t.anamneses,
      evolucoes: t.evolucoes,
      appointments: t.appointments,
    },
    limit: Number(r.limit ?? 0),
  };
}

export async function fetchPatientHistory(pid: number): Promise<PatientHistory> {
  const raw = await backendJson<unknown>(backendApiHref(`patients/${pid}/history`));
  const mapped = mapPatientHistoryFromApi(raw);
  if (!mapped) {
    const e = new Error("Resposta inválida do servidor.") as Error & { status?: number };
    e.status = 502;
    throw e;
  }
  return mapped;
}

/**
 * TEMPORÁRIO: fluxo anterior (janelas anuais) usado só enquanto o backend em produção
 * não tiver `GET /v1/patients/{id}/history`. Remover depois de estabilizar o deploy.
 */
async function fetchPatientHistoryLegacy(
  pid: number,
  registeredAt: string | undefined,
): Promise<PatientHistory> {
  const windows = patientHistoryWindows(registeredAt);
  // Evolução e agenda compartilham um único pool para respeitar o limite global.
  const tasks = windows.flatMap((w): (() => Promise<unknown>)[] => [
    () => fetchEvolutionsForPatient(pid, w.from, w.to),
    () => fetchAppointmentsRange(w.from, w.to, pid),
  ]);
  const [anamneses, settled] = await Promise.all([
    fetchAnamnesesForPatient(pid),
    mapSettledWithConcurrency(tasks, HISTORY_WINDOW_CONCURRENCY, (t) => t()),
  ]);
  const evolucoes: Evolucao[] = [];
  const appointments: Appointment[] = [];
  settled.forEach((r, i) => {
    if (r.status === "rejected") throw r.reason;
    if (i % 2 === 0) evolucoes.push(...(r.value as Evolucao[]));
    else appointments.push(...(r.value as Appointment[]));
  });
  return {
    ...canonicalHistoryOrder({ anamneses, evolucoes, appointments }),
    // Lista legada sem sinal de truncamento: no teto, assume que pode haver mais.
    truncated: {
      anamneses: anamneses.length >= CLINIC_ANAMNESES_LIMIT,
      evolucoes: false,
      appointments: false,
    },
    limit: 0,
  };
}

/** Paciente + histórico completo (2 chamadas; fallback legado se `/history` não existir). */
export async function fetchPatientDetailBundle(pid: number) {
  const [patientRes, historyRes] = await Promise.allSettled([
    fetchPatientById(pid),
    fetchPatientHistory(pid),
  ]);
  // Paciente inexistente/outra clínica (404) ou qualquer falha: nunca cai no fallback.
  if (patientRes.status === "rejected") throw patientRes.reason;
  const patient = patientRes.value;
  if (historyRes.status === "fulfilled") return { patient, ...historyRes.value };
  const status = (historyRes.reason as { status?: number } | null)?.status;
  // Paciente existe e /history deu 404: rota ainda não publicada no backend.
  // Só 404 aciona o fallback: o backend antigo pode responder 500 em rota inexistente,
  // então o backend novo deve ser publicado ANTES do front.
  if (status === 404) {
    return { patient, ...(await fetchPatientHistoryLegacy(pid, patient.registeredAt)) };
  }
  throw historyRes.reason;
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

export const EVOLUTION_AGG_CONCURRENCY = 6;
const RETRY_AFTER_DEFAULT_MS = 2000;
const RETRY_AFTER_MAX_MS = 10_000;

export type AggregatedEvolutions = {
  items: Evolucao[];
  /** Pacientes cuja consulta falhou (só no fallback por paciente; 0 no endpoint agregado). */
  failed: number;
  /** Pacientes consultados (só no fallback por paciente; 0 no endpoint agregado). */
  total: number;
  /** Alguma janela atingiu o teto do backend: há evoluções mais antigas não carregadas. */
  truncated: boolean;
  /** Teto por janela informado pelo backend (0 quando desconhecido/fallback). */
  limit: number;
};

/** Teto pedido ao backend por janela (`GET /v1/evolutions`). */
export const CLINIC_EVOLUTIONS_LIMIT = 2000;
/** Máximo de dias (inclusivo) aceito pelo backend por requisição. */
const CLINIC_EVOLUTIONS_MAX_DAYS = 366;
const CLINIC_EVOLUTIONS_CONCURRENCY = 2;
const DAY_MS = 86_400_000;

function isoToUtcMs(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function utcMsToIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Divide [from, to] (yyyy-MM-dd) em janelas contíguas de no máximo 366 dias inclusivos. */
export function splitEvolutionRange(from: string, to: string): { from: string; to: string }[] {
  const start = isoToUtcMs(from);
  const end = isoToUtcMs(to);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [{ from, to }];
  const out: { from: string; to: string }[] = [];
  for (let s = start; s <= end; s += CLINIC_EVOLUTIONS_MAX_DAYS * DAY_MS) {
    const e = Math.min(s + (CLINIC_EVOLUTIONS_MAX_DAYS - 1) * DAY_MS, end);
    out.push({ from: utcMsToIso(s), to: utcMsToIso(e) });
  }
  return out;
}

type ClinicEvolutionsDto = { items?: unknown; truncated?: unknown; limit?: unknown };

/** UMA chamada `GET /v1/evolutions` por janela (<= 366 dias), nunca por paciente. */
export async function fetchClinicEvolutions(
  from: string,
  to: string,
): Promise<{ items: Evolucao[]; truncated: boolean; limit: number }> {
  const windows = splitEvolutionRange(from, to);
  const settled = await mapSettledWithConcurrency(
    windows,
    CLINIC_EVOLUTIONS_CONCURRENCY,
    (w) =>
      backendJson<ClinicEvolutionsDto>(
        backendApiHref("evolutions", { from: w.from, to: w.to, limit: CLINIC_EVOLUTIONS_LIMIT }),
      ),
  );
  const items: Evolucao[] = [];
  let truncated = false;
  let limit = 0;
  for (const r of settled) {
    if (r.status === "rejected") throw r.reason;
    if (!Array.isArray(r.value?.items)) {
      const e = new Error("Resposta inválida do servidor.") as Error & { status?: number };
      e.status = 502;
      throw e;
    }
    items.push(...(r.value.items as EvolucaoDto[]).map(mapEvolucaoFromApi));
    if (r.value.truncated === true) truncated = true;
    limit = Math.max(limit, Number(r.value.limit ?? 0) || 0);
  }
  // Mesma ordem do backend (dataSessao desc, id desc), também entre janelas.
  items.sort((a, b) => b.dataSessao.localeCompare(a.dataSessao) || b.id - a.id);
  return { items, truncated, limit };
}

/** 1 requisição por paciente; em 429 repete UMA vez após Retry-After (só neste agregado). */
async function fetchEvolutionsWith429Retry(patientId: number, from: string, to: string) {
  try {
    return await fetchEvolutionsForPatient(patientId, from, to);
  } catch (e) {
    const err = e as { status?: number; retryAfterSeconds?: number };
    if (err?.status !== 429) throw e;
    const waitMs = Math.min(
      err.retryAfterSeconds ? err.retryAfterSeconds * 1000 : RETRY_AFTER_DEFAULT_MS,
      RETRY_AFTER_MAX_MS,
    );
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return fetchEvolutionsForPatient(patientId, from, to);
  }
}

/**
 * Evoluções da clínica no período: usa `GET /v1/evolutions` (1 chamada por janela).
 * Só 404 (backend ainda não publicado) aciona o fluxo antigo por paciente; qualquer
 * outro erro (500, 429...) propaga e a tela mostra "Tentar novamente".
 * `loadPatients` só é chamado no fallback.
 */
export async function fetchAggregatedEvolutionsDetailed(
  from: string,
  to: string,
  loadPatients: () => Promise<{ id: number }[]>,
): Promise<AggregatedEvolutions> {
  try {
    const res = await fetchClinicEvolutions(from, to);
    return { ...res, failed: 0, total: 0 };
  } catch (e) {
    if ((e as { status?: number } | null)?.status !== 404) throw e;
  }
  return fetchEvolutionsPerPatientLegacy(await loadPatients(), from, to);
}

/**
 * TEMPORÁRIO: fluxo antigo (1 requisição por paciente, concorrência limitada) usado só
 * enquanto `GET /v1/evolutions` não estiver publicado no backend. Remover depois.
 * Nunca rejeita: devolve quantos pacientes falharam, para a tela avisar sobre dados parciais.
 */
async function fetchEvolutionsPerPatientLegacy(
  patients: { id: number }[],
  from: string,
  to: string,
): Promise<AggregatedEvolutions> {
  const settled = await mapSettledWithConcurrency(patients, EVOLUTION_AGG_CONCURRENCY, (p) =>
    fetchEvolutionsWith429Retry(p.id, from, to),
  );
  const items: Evolucao[] = [];
  let failed = 0;
  for (const c of settled) {
    if (c.status === "fulfilled") items.push(...c.value);
    else failed += 1;
  }
  if (failed > 0) {
    console.warn(`[evolucoes] ${failed} chamada(s) de evoluções falharam; dados parciais.`);
  }
  return { items, failed, total: patients.length, truncated: false, limit: 0 };
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
  const { items: evolucoes } = await fetchAggregatedEvolutionsDetailed(
    from,
    to,
    async () => patients,
  );
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

export type FinancialReport = {
  totalSessions: number;
  paidSessions: number;
  pendingSessions: number;
  cancelledSessions: number;
  estimatedRevenue: number;
  receivedRevenue: number;
  defaultRate: number;
};

export async function fetchFinancialReport(
  from: string,
  to: string,
  sessionPrice: number,
): Promise<FinancialReport> {
  const raw = await backendJson<Record<string, unknown>>(
    backendApiHref("reports/financial", {
      from,
      to,
      sessionPrice: String(sessionPrice),
    }),
  );
  return {
    totalSessions: Number(raw.totalSessions ?? 0),
    paidSessions: Number(raw.paidSessions ?? 0),
    pendingSessions: Number(raw.pendingSessions ?? 0),
    cancelledSessions: Number(raw.cancelledSessions ?? 0),
    estimatedRevenue: Number(raw.estimatedRevenue ?? 0),
    receivedRevenue: Number(raw.receivedRevenue ?? 0),
    defaultRate: Number(raw.defaultRate ?? 0),
  };
}

export type ClinicAnamneses = {
  /** Resumo (sem texto clínico): id, paciente e data da coleta. */
  anamneses: Anamnese[];
  truncated: boolean;
  limit: number;
};

export const CLINIC_ANAMNESES_LIMIT = 500;

/** `GET /v1/anamneses?limit=` — lista da clínica em 1 chamada, mais recentes primeiro. */
export async function fetchClinicAnamneses(
  limit: number = CLINIC_ANAMNESES_LIMIT,
): Promise<ClinicAnamneses> {
  const raw = await backendJson<{
    items?: AnamneseDto[];
    truncated?: boolean;
    limit?: number;
  }>(backendApiHref("anamneses", { limit }));
  return {
    anamneses: (raw.items ?? []).map(mapAnamneseFromApi),
    truncated: raw.truncated === true,
    limit: Number(raw.limit ?? limit),
  };
}

/** `GET /v1/anamneses/{id}` — texto completo, usado ao editar. */
export async function fetchAnamneseById(id: number): Promise<Anamnese> {
  const raw = await backendJson<AnamneseDto>(backendApiHref(`anamneses/${id}`));
  return mapAnamneseFromApi(raw);
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

export async function apiDischargePatient(
  id: number,
  dischargeSummary?: string,
): Promise<Patient> {
  const raw = await backendJson<PatientDto>(backendApiHref(`patients/${id}/discharge`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dischargeSummary: dischargeSummary?.trim() ?? "" }),
  });
  return mapPatientFromApi(raw);
}

export async function apiCreateRecurringBlocks(body: {
  dayOfWeek: number;
  time: string;
  duration: number;
  notes?: string;
  fromDate: string;
  untilDate: string;
  allowOverlap?: boolean;
}): Promise<Appointment[]> {
  const raw = await backendJson<AppointmentDto[]>(
    backendApiHref("appointments/recurring-block", body.allowOverlap ? { allowOverlap: "true" } : undefined),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayOfWeek: body.dayOfWeek,
        time: body.time,
        duration: body.duration,
        notes: body.notes ?? null,
        fromDate: body.fromDate,
        untilDate: body.untilDate,
      }),
    },
  );
  return raw.map(mapAppointmentFromApi);
}

export async function apiCreateAppointment(
  body: Record<string, unknown>,
  options?: { allowOverlap?: boolean },
): Promise<Appointment> {
  const raw = await backendJson<AppointmentDto>(
    backendApiHref("appointments", options?.allowOverlap ? { allowOverlap: "true" } : undefined),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return mapAppointmentFromApi(raw);
}

export async function apiReplaceAppointment(
  id: number,
  body: Record<string, unknown>,
  options?: { allowOverlap?: boolean },
): Promise<Appointment> {
  const raw = await backendJson<AppointmentDto>(
    backendApiHref(`appointments/${id}`, options?.allowOverlap ? { allowOverlap: "true" } : undefined),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
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
    totalSessionsPlanned: 0,
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
  const t = values.horaAtendimento.trim();
  const horaAtendimento =
    t === "" ? null : normalizeTimeForInput(t) || null;
  return {
    patientId: Number(values.patientId),
    dataSessao: values.dataSessao,
    horaAtendimento,
    tipoSessao: "-",
    sinaisVitaisInicio: values.sinaisVitaisInicio.trim() || "",
    sinaisVitaisFim: values.sinaisVitaisFim.trim() || "",
    objetivosSessao: values.objetivosSessao,
    atividadesRealizadas: values.atividadesRealizadas,
    respostaPaciente: values.respostaPaciente,
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
    totalSessionsPlanned: p.totalSessionsPlanned,
    dischargedAt: p.dischargedAt ?? null,
    dischargeSummary: p.dischargeSummary ?? "",
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
  sessionAmount?: number;
  paymentPlan?: string;
  packageAmount?: number;
  installmentCount?: number;
}): Record<string, unknown> {
  const kind =
    input.kind ?? (input.patientId > 0 ? "session" : "personal");
  const payload: Record<string, unknown> = {
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
  if (input.sessionAmount != null && input.sessionAmount > 0) {
    payload.sessionAmount = input.sessionAmount;
  }
  if (input.paymentPlan) payload.paymentPlan = input.paymentPlan;
  if (input.packageAmount != null && input.packageAmount > 0) {
    payload.packageAmount = input.packageAmount;
  }
  if (input.installmentCount != null && input.installmentCount > 0) {
    payload.installmentCount = input.installmentCount;
  }
  return payload;
}
