export type AppointmentStatus = "confirmed" | "pending" | "cancelled";

export type PatientStatus = "active" | "inactive";

export interface Patient {
  id: number;
  name: string;
  age: number;
  diagnosis: string;
  phone: string;
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
