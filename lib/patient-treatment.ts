import { isSessionAppointment, type Appointment, type Patient } from "@/lib/types";

export function patientSessionAppointments(
  appointments: Appointment[],
  patientId: number,
): Appointment[] {
  return appointments.filter(
    (a) => isSessionAppointment(a) && a.patientId === patientId,
  );
}

export function countCompletedSessions(
  appointments: Appointment[],
  patientId: number,
): number {
  return patientSessionAppointments(appointments, patientId).filter(
    (a) => a.status === "completed",
  ).length;
}

export function sessionProgressPercent(
  planned: number,
  completed: number,
): number | null {
  if (planned <= 0) return null;
  return Math.min(100, Math.round((completed / planned) * 100));
}

/** completed / (completed + no_show), em percentual 0–100; null se sem dados. */
export function attendanceRatePercent(
  appointments: Appointment[],
  patientId: number,
): number | null {
  const sessions = patientSessionAppointments(appointments, patientId);
  const completed = sessions.filter((a) => a.status === "completed").length;
  const noShow = sessions.filter((a) => a.status === "no_show").length;
  const denom = completed + noShow;
  if (denom === 0) return null;
  return Math.round((completed / denom) * 100);
}

/** Média de duração (min) das sessões concluídas no conjunto informado. */
export function averageSessionDurationMinutes(
  appointments: Appointment[],
): number | null {
  const completed = appointments.filter(
    (a) => isSessionAppointment(a) && a.status === "completed" && a.duration > 0,
  );
  if (completed.length === 0) return null;
  const sum = completed.reduce((acc, a) => acc + a.duration, 0);
  return Math.round(sum / completed.length);
}

export function sessionsRemaining(planned: number, completed: number): number {
  if (planned <= 0) return 0;
  return Math.max(0, planned - completed);
}

export function isPenultimateSession(planned: number, completed: number): boolean {
  return planned > 1 && completed === planned - 1;
}

export function hasReachedPlannedSessions(planned: number, completed: number): boolean {
  return planned > 0 && completed >= planned;
}

export type PatientNoShowAlert = {
  patientId: number;
  patientName: string;
  rate: number;
  noShow: number;
  completed: number;
};

/** Pacientes ativos com taxa de falta acima do limiar (ex.: 30%). */
export function patientsWithHighNoShowRate(
  patients: Patient[],
  appointments: Appointment[],
  thresholdPercent = 30,
): PatientNoShowAlert[] {
  const out: PatientNoShowAlert[] = [];
  for (const p of patients) {
    if (p.status === "discharged" || p.status === "inactive") continue;
    const sessions = patientSessionAppointments(appointments, p.id);
    const completed = sessions.filter((a) => a.status === "completed").length;
    const noShow = sessions.filter((a) => a.status === "no_show").length;
    const denom = completed + noShow;
    if (denom < 2) continue;
    const rate = Math.round((noShow / denom) * 100);
    if (rate > thresholdPercent) {
      out.push({
        patientId: p.id,
        patientName: p.name,
        rate,
        noShow,
        completed,
      });
    }
  }
  return out.sort((a, b) => b.rate - a.rate);
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return h === 1 ? "1 hora" : `${h} horas`;
  return `${h}h${String(m).padStart(2, "0")}`;
}
