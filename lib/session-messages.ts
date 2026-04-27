import { formatAddressOneLine } from "@/lib/patient-utils";
import type { Appointment, Patient } from "@/lib/types";

export function buildSessionConfirmationWhatsappText(params: {
  appointment: Appointment;
  patient: Patient | undefined;
  therapistName: string;
  clinicName: string;
}): string {
  const { appointment, patient, therapistName, clinicName } = params;
  const addr = patient
    ? formatAddressOneLine(patient.address)
    : "Endereço cadastrado no sistema.";
  return (
    `Olá, ${appointment.patientName}! ` +
    `Confirmando sua sessão de ${appointment.type} em ${appointment.date} às ${appointment.time}. ` +
    `Local: ${addr}. ` +
    `Profissional: ${therapistName} (${clinicName}). ` +
    `Qualquer dúvida, responda esta mensagem.`
  );
}

/** Apenas dígitos com DDI 55 para wa.me */
export function toWhatsAppDigits(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("55")) return d;
  if (d.length >= 10 && d.length <= 11) return `55${d}`;
  return d;
}

export function buildWhatsAppLink(phoneDigits: string, text: string): string {
  const q = encodeURIComponent(text);
  return `https://wa.me/${phoneDigits}?text=${q}`;
}
