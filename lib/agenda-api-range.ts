import { addDays, startOfWeekSunday, toLocalDateString } from "@/lib/date-utils";

/** Intervalo inclusivo `[from, to]` em yyyy-MM-dd para `GET /v1/appointments`. */

export function computeAgendaFetchRange(cd: Date, viewMode: "month" | "week"): {
  from: string;
  to: string;
} {
  if (viewMode === "week") {
    const start = startOfWeekSunday(cd);
    const end = addDays(start, 6);
    return {
      from: toLocalDateString(start),
      to: toLocalDateString(end),
    };
  }
  const start = new Date(cd.getFullYear(), cd.getMonth(), 1);
  const end = new Date(cd.getFullYear(), cd.getMonth() + 1, 0);
  return {
    from: toLocalDateString(start),
    to: toLocalDateString(end),
  };
}
