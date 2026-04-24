import { buildInitialHolidays } from "@/lib/mock-seed";
import type { MockState } from "@/lib/mock-reducer";
import type {
  Appointment,
  CalendarEntryKind,
  Holiday,
  PatientAttachment,
  SessionStatus,
} from "@/lib/types";

const STORAGE_KEY = "fisio_mock_state_v3";
const LEGACY_STORAGE_KEY = "fisio_mock_state_v2";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizeKind(k: unknown): CalendarEntryKind {
  if (k === "personal" || k === "block") return k;
  return "session";
}

function normalizeSessionStatus(s: unknown): SessionStatus {
  if (s === "pending") return "scheduled";
  if (s === "scheduled" || s === "confirmed" || s === "completed" || s === "cancelled") {
    return s;
  }
  return "scheduled";
}

function normalizeAppointment(raw: unknown): Appointment | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "number" ? raw.id : Number(raw.id);
  if (!Number.isFinite(id)) return null;

  const kind = normalizeKind(raw.kind);
  let patientId =
    typeof raw.patientId === "number" ? raw.patientId : Number(raw.patientId);
  if (!Number.isFinite(patientId)) patientId = 0;
  if (kind !== "session") patientId = 0;
  if (kind === "session" && patientId <= 0) return null;

  const patientName = typeof raw.patientName === "string" ? raw.patientName : "";
  const date = typeof raw.date === "string" ? raw.date : "";
  const time = typeof raw.time === "string" ? raw.time : "";
  const duration = typeof raw.duration === "number" ? raw.duration : Number(raw.duration);
  const type = typeof raw.type === "string" ? raw.type : "";
  const status = normalizeSessionStatus(raw.status);
  const notes = typeof raw.notes === "string" ? raw.notes : undefined;
  const paymentRaw = raw.paymentStatus;
  const paymentStatus =
    paymentRaw === "paid" || paymentRaw === "pending" ? paymentRaw : "pending";

  return {
    id,
    kind,
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

function normalizeHoliday(raw: unknown): Holiday | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "number" ? raw.id : Number(raw.id);
  const date = typeof raw.date === "string" ? raw.date : "";
  const name = typeof raw.name === "string" ? raw.name : "";
  if (!Number.isFinite(id) || !date || !name) return null;
  return { id, date, name };
}

export function normalizePersistedState(raw: unknown): MockState | null {
  if (!isRecord(raw)) return null;
  if (!Array.isArray(raw.patients) || !Array.isArray(raw.appointments)) return null;

  const appointments = raw.appointments
    .map(normalizeAppointment)
    .filter((a): a is Appointment => a !== null);

  const fromArray = Array.isArray(raw.holidays)
    ? raw.holidays.map(normalizeHoliday).filter((h): h is Holiday => h !== null)
    : [];
  const holidays = fromArray.length > 0 ? fromArray : buildInitialHolidays(new Date());

  return {
    patients: raw.patients as MockState["patients"],
    appointments,
    holidays,
    anamneses: Array.isArray(raw.anamneses) ? (raw.anamneses as MockState["anamneses"]) : [],
    evolucoes: Array.isArray(raw.evolucoes) ? (raw.evolucoes as MockState["evolucoes"]) : [],
    patientAttachments: Array.isArray(raw.patientAttachments)
      ? (raw.patientAttachments as PatientAttachment[])
      : [],
    auditLog: Array.isArray(raw.auditLog) ? (raw.auditLog as MockState["auditLog"]) : [],
  };
}

export function loadPersistedMockState(): MockState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isRecord(parsed.state)) return null;
    if (parsed.version !== 2 && parsed.version !== 3) return null;
    return normalizePersistedState(parsed.state);
  } catch {
    return null;
  }
}

export function savePersistedMockState(state: MockState): void {
  if (typeof window === "undefined") return;
  try {
    const envelope = { version: 3 as const, state };
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
