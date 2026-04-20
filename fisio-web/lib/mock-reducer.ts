import { nextNumericId } from "@/lib/id";
import {
  buildInitialAnamneses,
  buildInitialAppointments,
  buildInitialEvolucoes,
  buildInitialHolidays,
  buildInitialPatients,
} from "@/lib/mock-seed";
import type { Anamnese, Appointment, AuditLogEntry, Evolucao, Holiday, Patient } from "@/lib/types";
import { isSessionAppointment } from "@/lib/types";

export type MockState = {
  patients: Patient[];
  appointments: Appointment[];
  holidays: Holiday[];
  anamneses: Anamnese[];
  evolucoes: Evolucao[];
  auditLog: AuditLogEntry[];
};

export type MockAction =
  | { type: "HYDRATE"; payload: MockState }
  | { type: "RESET" }
  | { type: "ADD_PATIENT"; payload: Omit<Patient, "id"> }
  | { type: "UPDATE_PATIENT"; payload: Patient }
  | { type: "DELETE_PATIENT"; id: number }
  | { type: "ADD_APPOINTMENT"; payload: Omit<Appointment, "id"> }
  | { type: "UPDATE_APPOINTMENT"; payload: Appointment }
  | { type: "DELETE_APPOINTMENT"; id: number }
  | { type: "ADD_ANAMNESE"; payload: Omit<Anamnese, "id"> }
  | { type: "UPDATE_ANAMNESE"; payload: Anamnese }
  | { type: "DELETE_ANAMNESE"; id: number }
  | { type: "ADD_EVOLUCAO"; payload: Omit<Evolucao, "id"> }
  | { type: "UPDATE_EVOLUCAO"; payload: Evolucao }
  | { type: "DELETE_EVOLUCAO"; id: number }
  | { type: "CLEAR_AUDIT_LOG" };

function auditEntry(message: string): AuditLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    at: new Date().toISOString(),
    message,
  };
}

function withAudit(state: MockState, message: string): MockState {
  return {
    ...state,
    auditLog: [...state.auditLog, auditEntry(message)].slice(-200),
  };
}

export function createInitialMockState(): MockState {
  const patients = buildInitialPatients();
  const now = new Date();
  return {
    patients,
    appointments: buildInitialAppointments(now),
    holidays: buildInitialHolidays(now),
    anamneses: buildInitialAnamneses(patients),
    evolucoes: buildInitialEvolucoes(patients),
    auditLog: [],
  };
}

export function mockReducer(state: MockState, action: MockAction): MockState {
  switch (action.type) {
    case "HYDRATE":
      return {
        patients: action.payload.patients,
        appointments: action.payload.appointments,
        holidays: action.payload.holidays ?? [],
        anamneses: action.payload.anamneses,
        evolucoes: action.payload.evolucoes,
        auditLog: action.payload.auditLog ?? [],
      };
    case "RESET": {
      const fresh = createInitialMockState();
      return withAudit(fresh, "Dados clínicos restaurados para o exemplo inicial (seed).");
    }
    case "CLEAR_AUDIT_LOG":
      return { ...state, auditLog: [] };
    case "ADD_PATIENT": {
      const id = nextNumericId(state.patients);
      const next: MockState = {
        ...state,
        patients: [...state.patients, { ...action.payload, id }],
      };
      return withAudit(next, `Paciente cadastrado: ${action.payload.name}`);
    }
    case "UPDATE_PATIENT": {
      const p = action.payload;
      const next: MockState = {
        ...state,
        patients: state.patients.map((x) => (x.id === p.id ? p : x)),
        appointments: state.appointments.map((a) =>
          a.patientId === p.id && isSessionAppointment(a) ? { ...a, patientName: p.name } : a
        ),
        anamneses: state.anamneses.map((a) =>
          a.patientId === p.id ? { ...a, patientName: p.name } : a
        ),
        evolucoes: state.evolucoes.map((e) =>
          e.patientId === p.id ? { ...e, patientName: p.name } : e
        ),
      };
      return withAudit(next, `Paciente atualizado: ${p.name}`);
    }
    case "DELETE_PATIENT": {
      const id = action.id;
      const removed = state.patients.find((p) => p.id === id);
      const next: MockState = {
        ...state,
        patients: state.patients.filter((p) => p.id !== id),
        appointments: state.appointments.filter((a) => a.patientId !== id),
        anamneses: state.anamneses.filter((a) => a.patientId !== id),
        evolucoes: state.evolucoes.filter((e) => e.patientId !== id),
      };
      return withAudit(
        next,
        `Paciente excluído${removed ? `: ${removed.name}` : ""} (agendamentos e registros clínicos vinculados removidos).`
      );
    }
    case "ADD_APPOINTMENT": {
      const id = nextNumericId(state.appointments);
      const next: MockState = {
        ...state,
        appointments: [
          ...state.appointments,
          {
            ...action.payload,
            id,
            kind: action.payload.kind ?? "session",
            paymentStatus: action.payload.paymentStatus ?? "pending",
          },
        ],
      };
      return withAudit(
        next,
        `Agendamento criado: ${action.payload.patientName} em ${action.payload.date} às ${action.payload.time}`
      );
    }
    case "UPDATE_APPOINTMENT": {
      const a = action.payload;
      const next: MockState = {
        ...state,
        appointments: state.appointments.map((x) => (x.id === a.id ? a : x)),
      };
      return withAudit(
        next,
        `Agendamento atualizado: ${a.patientName} em ${a.date} às ${a.time}`
      );
    }
    case "DELETE_APPOINTMENT": {
      const apt = state.appointments.find((a) => a.id === action.id);
      const next: MockState = {
        ...state,
        appointments: state.appointments.filter((a) => a.id !== action.id),
      };
      return withAudit(
        next,
        apt
          ? `Agendamento excluído: ${apt.patientName} (${apt.date} ${apt.time})`
          : "Agendamento excluído"
      );
    }
    case "ADD_ANAMNESE": {
      const id = nextNumericId(state.anamneses);
      const next: MockState = {
        ...state,
        anamneses: [...state.anamneses, { ...action.payload, id }],
      };
      return withAudit(next, `Anamnese registrada: ${action.payload.patientName}`);
    }
    case "UPDATE_ANAMNESE": {
      const a = action.payload;
      const next: MockState = {
        ...state,
        anamneses: state.anamneses.map((x) => (x.id === a.id ? a : x)),
      };
      return withAudit(next, `Anamnese atualizada: ${a.patientName}`);
    }
    case "DELETE_ANAMNESE": {
      const next: MockState = {
        ...state,
        anamneses: state.anamneses.filter((a) => a.id !== action.id),
      };
      return withAudit(next, "Anamnese excluída");
    }
    case "ADD_EVOLUCAO": {
      const id = nextNumericId(state.evolucoes);
      const next: MockState = {
        ...state,
        evolucoes: [...state.evolucoes, { ...action.payload, id }],
      };
      return withAudit(next, `Evolução registrada: ${action.payload.patientName}`);
    }
    case "UPDATE_EVOLUCAO": {
      const e = action.payload;
      const next: MockState = {
        ...state,
        evolucoes: state.evolucoes.map((x) => (x.id === e.id ? e : x)),
      };
      return withAudit(next, `Evolução atualizada: ${e.patientName}`);
    }
    case "DELETE_EVOLUCAO": {
      const next: MockState = {
        ...state,
        evolucoes: state.evolucoes.filter((e) => e.id !== action.id),
      };
      return withAudit(next, "Evolução excluída");
    }
    default:
      return state;
  }
}
