import type { Patient, PatientAddress } from "@/lib/types";

/** Idade em anos completos a partir de yyyy-mm-dd (meio-dia local evita desvio de fuso). */
export function ageFromBirthDateIso(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const birth = new Date(y, m - 1, d, 12, 0, 0);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function formatCepDisplay(cepDigits: string): string {
  const d = cepDigits.replace(/\D/g, "");
  if (d.length !== 8) return cepDigits;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function formatAddressOneLine(a: PatientAddress): string {
  const parts = [
    `${a.logradouro}, ${a.numero}`,
    a.complemento?.trim(),
    a.bairro,
    `${a.cidade} – ${a.uf.toUpperCase()}`,
    a.cep ? `CEP ${formatCepDisplay(a.cep)}` : "",
  ].filter(Boolean);
  return parts.join(" · ");
}

export function patientMatchesSearch(patient: Patient, q: string): boolean {
  const s = q.toLowerCase();
  const addr = patient.address;
  return (
    patient.name.toLowerCase().includes(s) ||
    patient.diagnosis.toLowerCase().includes(s) ||
    patient.email.toLowerCase().includes(s) ||
    (patient.profession ?? "").toLowerCase().includes(s) ||
    (patient.educationLevel ?? "").toLowerCase().includes(s) ||
    (patient.referralSource ?? "").toLowerCase().includes(s) ||
    patient.phone.toLowerCase().includes(s) ||
    (patient.responsiblePhone ?? "").toLowerCase().includes(s) ||
    addr.cidade.toLowerCase().includes(s) ||
    addr.bairro.toLowerCase().includes(s) ||
    addr.logradouro.toLowerCase().includes(s)
  );
}
