import { addDays, parseLocalDate, toLocalDateString } from "@/lib/date-utils";
import type { CalendarExtraFormValues } from "@/lib/schemas/calendar-extra-form";

/** Todas as datas corridas entre início e fim (inclusive), formato yyyy-MM-dd. */
export function eachInclusiveCalendarDay(fromIso: string, toIso: string): string[] {
  const start = parseLocalDate(fromIso);
  const end = parseLocalDate(toIso);
  const dates: string[] = [];
  for (
    let cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    cursor <= end;
    cursor = addDays(cursor, 1)
  ) {
    dates.push(toLocalDateString(cursor));
  }
  return dates;
}

/** Datas para bloqueio/evento extra (dia inteiro em intervalo ou repetição semanal). */
export function buildCalendarExtraDates(values: CalendarExtraFormValues): string[] {
  if (
    values.isAllDay &&
    values.repeatUntil &&
    values.repeatUntil >= values.date
  ) {
    return eachInclusiveCalendarDay(values.date, values.repeatUntil);
  }

  if (!values.repeatEnabled) return [values.date];

  const endDate = values.repeatUntil || values.date;
  const cursorStart = parseLocalDate(values.date);
  const cursorEnd = parseLocalDate(endDate);
  const selectedWeekdays = new Set(values.repeatWeekdays);
  const dates: string[] = [];

  for (
    let cursor = new Date(cursorStart.getFullYear(), cursorStart.getMonth(), cursorStart.getDate());
    cursor <= cursorEnd;
    cursor = addDays(cursor, 1)
  ) {
    if (selectedWeekdays.has(cursor.getDay())) {
      dates.push(toLocalDateString(cursor));
    }
  }

  return dates;
}
