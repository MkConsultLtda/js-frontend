/** Fluxo do atendimento na agenda (cores na grade). */
export type SessionStatus = "scheduled" | "confirmed" | "completed" | "cancelled";

/** @deprecated use SessionStatus — mantido para migração de dados */
export type AppointmentStatus = SessionStatus | "pending";

export type AppointmentPaymentStatus = "pending" | "paid";

/** Entrada na agenda: sessão com paciente, bloqueio de horário ou evento pessoal/trabalho. */
export type CalendarEntryKind = "session" | "personal" | "block";

export interface Holiday {
  id: number;
  /** yyyy-mm-dd */
  date: string;
  name: string;
}

/** Evento local para trilha de auditoria (LGPD / suporte) — mock até existir API */
export interface AuditLogEntry {
  id: string;
  at: string;
  message: string;
}

export type PatientStatus = "active" | "inactive";

/** Endereço para atendimento domiciliar e correspondência */
export interface PatientAddress {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Patient {
  id: number;
  name: string;
  /** Data de nascimento — yyyy-mm-dd */
  birthDate: string;
  email: string;
  cpf?: string;
  diagnosis: string;
  phone: string;
  responsiblePhone?: string;
  profession?: string;
  educationLevel?: string;
  referralSource?: string;
  address: PatientAddress;
  /** Exibição dd/mm/aaaa */
  lastSession: string;
  status: PatientStatus;
  /** Cadastro real — yyyy-mm-dd (mock até existir API) */
  registeredAt: string;
}

export interface Appointment {
  id: number;
  /** Padrão: sessão com paciente */
  kind?: CalendarEntryKind;
  /** Sessões: id do paciente; bloqueio/evento: 0 */
  patientId: number;
  /** Paciente ou título do evento / bloqueio */
  patientName: string;
  /** yyyy-mm-dd */
  date: string;
  time: string;
  duration: number;
  type: string;
  /** Apenas para kind session; em block/personal pode ser "confirmed" internamente */
  status: SessionStatus;
  notes?: string;
  /** Pagamento da sessão (controle financeiro leve) */
  paymentStatus: AppointmentPaymentStatus;
}

export function isSessionAppointment(a: Pick<Appointment, "kind">): boolean {
  return a.kind === undefined || a.kind === "session";
}

export interface Anamnese {
  id: number;
  patientId: number;
  patientName: string;
  dataColeta: string;
  anamneseTexto?: string;
  queixaPrincipal: string;
  historiaDoenca: string;
  antecedentesFamiliares: string;
  medicamentos: string;
  alergias: string;
  habitosVida: string;
  exameFisico: string;
  diagnosticoFisioterapico: string;
  objetivosTratamento: string;
}

export interface Evolucao {
  id: number;
  patientId: number;
  patientName: string;
  dataSessao: string;
  tipoSessao: string;
  sinaisVitaisInicio?: string;
  sinaisVitaisFim?: string;
  objetivosSessao: string;
  atividadesRealizadas: string;
  respostaPaciente: string;
  dorPre: number;
  dorPos: number;
  observacoes: string;
  planoProximaSessao: string;
}

/** Anexo no prontuário (arquivo em data URL) — armazenamento local (mock) */
export interface PatientAttachment {
  id: number;
  patientId: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** ISO-8601 */
  createdAt: string;
  /** data:...;base64,... */
  dataUrl: string;
}
