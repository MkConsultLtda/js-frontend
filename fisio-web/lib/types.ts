export type AppointmentStatus = "confirmed" | "pending" | "cancelled";

export type AppointmentPaymentStatus = "pending" | "paid";

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
  address: PatientAddress;
  /** Exibição dd/mm/aaaa */
  lastSession: string;
  status: PatientStatus;
  /** Cadastro real — yyyy-mm-dd (mock até existir API) */
  registeredAt: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  /** yyyy-mm-dd */
  date: string;
  time: string;
  duration: number;
  type: string;
  status: AppointmentStatus;
  notes?: string;
  /** Pagamento da sessão (controle financeiro leve) */
  paymentStatus: AppointmentPaymentStatus;
}

export interface Anamnese {
  id: number;
  patientId: number;
  patientName: string;
  dataColeta: string;
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
  objetivosSessao: string;
  atividadesRealizadas: string;
  respostaPaciente: string;
  dorPre: number;
  dorPos: number;
  observacoes: string;
  planoProximaSessao: string;
}
