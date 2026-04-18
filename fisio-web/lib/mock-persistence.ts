import type { Appointment } from "@/lib/types";
import type { MockState } from "@/lib/mock-reducer";

const STORAGE_KEY = "fisio_mock_state_v2";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizeAppointment(raw: unknown): Appointment | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "number" ? raw.id : Number(raw.id);
  const patientId =
    typeof raw.patientId === "number" ? raw.patientId : Number(raw.patientId);
  if (!Number.isFinite(id) || !Number.isFinite(patientId)) return null;
  const patientName = typeof raw.patientName === "string" ? raw.patientName : "";
  const date = typeof raw.date === "string" ? raw.date : "";
  const time = typeof raw.time === "string" ? raw.time : "";
  const duration =
    typeof raw.duration === "number" ? raw.duration : Number(raw.duration);
  const type = typeof raw.type === "string" ? raw.type : "";
  const status = raw.status as Appointment["status"];
  const notes = typeof raw.notes === "string" ? raw.notes : undefined;
  const paymentRaw = raw.paymentStatus;
  const paymentStatus: Appointment["paymentStatus"] =
    paymentRaw === "paid" || paymentRaw === "pending" ? paymentRaw : "pending";
  if (!["confirmed", "pending", "cancelled"].includes(status)) return null;
  return {
    id,
    patientId,
    patientName,
    date,
    time,
    duration: Number.isFinite(duration) ? duration : 50,
    type,
    status,
    notes,
    paymentStatus,
  };
}

export function normalizePersistedState(raw: unknown): MockState | null {
  if (!isRecord(raw)) return null;
  if (!Array.isArray(raw.patients) || !Array.isArray(raw.appointments)) return null;

  const appointments = raw.appointments
    .map(normalizeAppointment)
    .filter((a): a is Appointment => a !== null);

  return {
    patients: raw.patients as MockState["patients"],
    appointments,
    anamneses: Array.isArray(raw.anamneses) ? (raw.anamneses as MockState["anamneses"]) : [],
    evolucoes: Array.isArray(raw.evolucoes) ? (raw.evolucoes as MockState["evolucoes"]) : [],
    auditLog: Array.isArray(raw.auditLog) ? (raw.auditLog as MockState["auditLog"]) : [],
  };
}

export function loadPersistedMockState(): MockState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 2 || !isRecord(parsed.state)) return null;
    return normalizePersistedState(parsed.state);
  } catch {
    return null;
  }
}

export function savePersistedMockState(state: MockState): void {
  if (typeof window === "undefined") return;
  try {
    const envelope = { version: 2 as const, state };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // quota / private mode
  }
}

export function clearPersistedMockState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
