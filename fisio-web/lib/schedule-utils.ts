import { addDays, parseLocalDate, startOfWeekMonday, toLocalDateString } from "@/lib/date-utils";

/** Padrão: segunda a sexta (convenção JS `Date.getDay()` — 0 domingo … 6 sábado). */
export const DEFAULT_WORKING_WEEKDAYS: readonly number[] = [1, 2, 3, 4, 5];

const DOW_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

/** Garante ao menos um dia e valores 0–6. */
export function normalizeWorkingWeekdays(value: unknown): number[] {
  if (!Array.isArray(value)) return [...DEFAULT_WORKING_WEEKDAYS];
  const nums = value
    .map((x) => (typeof x === "number" ? x : parseInt(String(x), 10)))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 6);
  const unique = [...new Set(nums)].sort((a, b) => a - b);
  return unique.length > 0 ? unique : [...DEFAULT_WORKING_WEEKDAYS];
}

export function isWorkingDate(date: Date, workingWeekdays: number[]): boolean {
  const set = new Set(normalizeWorkingWeekdays(workingWeekdays));
  return set.has(date.getDay());
}

export function isWorkingDateKey(dateKey: string, workingWeekdays: number[]): boolean {
  return isWorkingDate(parseLocalDate(dateKey), workingWeekdays);
}

/**
 * Próximo dia útil a partir de `fromKey` (inclusive).
 * Se nenhum dia for encontrado em `maxSteps`, devolve `fromKey`.
 */
export function nextWorkingDateKey(
  fromKey: string,
  workingWeekdays: number[],
  maxSteps = 14
): string {
  const set = new Set(normalizeWorkingWeekdays(workingWeekdays));
  let d = parseLocalDate(fromKey);
  for (let i = 0; i < maxSteps; i++) {
    if (set.has(d.getDay())) return toLocalDateString(d);
    d = addDays(d, 1);
  }
  return fromKey;
}

/** Resumo para textos de UI (ex.: "seg, ter, qua, qui, sex"). */
export function formatWorkingDaysShort(workingWeekdays: number[]): string {
  const labels = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  return normalizeWorkingWeekdays(workingWeekdays)
    .map((d) => labels[d])
    .join(", ");
}

/**
 * Conta agendamentos por dia, apenas nos dias da semana em que a profissional atende,
 * na semana que contém `reference` (semana começando na segunda).
 */
export function countAppointmentsByWorkingWeekdays(
  appointments: { date: string }[],
  reference: Date,
  workingWeekdays: number[]
): { label: string; count: number; dateKey: string }[] {
  const allowed = new Set(normalizeWorkingWeekdays(workingWeekdays));
  const monday = startOfWeekMonday(reference);
  const out: { label: string; count: number; dateKey: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(monday, i);
    const dow = day.getDay();
    if (!allowed.has(dow)) continue;
    const dateKey = toLocalDateString(day);
    const count = appointments.filter((a) => a.date === dateKey).length;
    out.push({ label: DOW_SHORT[dow], count, dateKey });
  }
  return out;
}
