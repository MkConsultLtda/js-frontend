import { formatAddressOneLine } from "@/lib/patient-utils";
import type { Appointment, Patient } from "@/lib/types";

export type RouteStop = {
  appointment: Appointment;
  patient: Patient | undefined;
  cepSortKey: string;
  mapsUrl: string;
};

function mapsSearchQuery(patient: Patient | undefined, fallbackName: string): string {
  if (patient) return formatAddressOneLine(patient.address);
  return fallbackName;
}

/** Agendamentos do dia (exceto cancelados), ordenados por CEP para rota domiciliar. */
export function buildRouteForDate(
  date: string,
  appointments: Appointment[],
  patients: Patient[]
): RouteStop[] {
  const list = appointments
    .filter((a) => a.date === date && a.status !== "cancelled")
    .map((appointment) => {
      const patient = patients.find((p) => p.id === appointment.patientId);
      const cepSortKey = (patient?.address.cep ?? "99999999").replace(/\D/g, "").padStart(8, "0");
      const query = mapsSearchQuery(patient, `${appointment.patientName} ${appointment.type}`);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
      return { appointment, patient, cepSortKey, mapsUrl };
    })
    .sort(
      (a, b) =>
        a.cepSortKey.localeCompare(b.cepSortKey) ||
        a.appointment.time.localeCompare(b.appointment.time)
    );
  return list;
}
