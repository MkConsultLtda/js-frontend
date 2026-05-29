import { addDays } from "@/lib/date-utils";
import type { Patient } from "@/lib/types";

export interface UpcomingBirthday {
  patientId: number;
  name: string;
  birthDate: string;
  dayMonthLabel: string;
  daysUntil: number;
  turningAge: number | null;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Aniversariantes nos proximos `windowDays` dias (inclui hoje), a partir de `reference`.
 * Compara apenas dia/mes, ignorando o ano de nascimento.
 */
export function getUpcomingBirthdays(
  patients: Patient[],
  reference: Date = new Date(),
  windowDays: number = 7
): UpcomingBirthday[] {
  const start = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate()
  );

  const result: UpcomingBirthday[] = [];

  for (const patient of patients) {
    const match = ISO_DATE.exec(patient.birthDate);
    if (!match) continue;

    const birthYear = Number(match[1]);
    const birthMonth = Number(match[2]);
    const birthDay = Number(match[3]);

    for (let offset = 0; offset < windowDays; offset++) {
      const target = addDays(start, offset);
      if (target.getMonth() + 1 !== birthMonth || target.getDate() !== birthDay) {
        continue;
      }
      result.push({
        patientId: patient.id,
        name: patient.name,
        birthDate: patient.birthDate,
        dayMonthLabel: `${match[3]}/${match[2]}`,
        daysUntil: offset,
        turningAge: birthYear > 0 ? target.getFullYear() - birthYear : null,
      });
      break;
    }
  }

  return result.sort((a, b) =>
    a.daysUntil !== b.daysUntil
      ? a.daysUntil - b.daysUntil
      : a.name.localeCompare(b.name, "pt-BR")
  );
}

export function birthdayWhenLabel(daysUntil: number): string {
  if (daysUntil === 0) return "Hoje";
  if (daysUntil === 1) return "Amanha";
  return `Em ${daysUntil} dias`;
}
