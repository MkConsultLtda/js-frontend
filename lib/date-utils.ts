/** yyyy-mm-dd no fuso local */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Normaliza datas vindas da API: string `yyyy-MM-dd` ou array `[ano, mês, dia]` (Jackson legado).
 */
export function isoDateFromJsonField(value: unknown): string {
  if (typeof value === "string" && value.length >= 10) {
    const d = value.substring(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }
  if (Array.isArray(value) && value.length >= 3) {
    const y = Number(value[0]);
    const m = Number(value[1]);
    const d = Number(value[2]);
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }
  return "";
}

/** yyyy-mm-dd → dd/mm/aaaa (exibição) */
export function formatIsoDateToBR(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** dd/mm/aaaa → Date local */
export function parseBRDate(date: string): Date {
  const [d, m, y] = date.split("/").map(Number);
  return new Date(y, m - 1, d);
}

/** dd/mm/aaaa → yyyy-mm-dd (quando o formato for válido) */
export function brDateToIsoDate(br: string): string | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(br)) return null;
  return toLocalDateString(parseBRDate(br));
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

/** Segunda-feira da semana que contém `date` */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Domingo = primeiro dia da semana (mesmo critério do calendário mensal da agenda). */
export function startOfWeekSunday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

/** Sexta-feira da semana que começa na segunda que contém `isoDate` (yyyy-mm-dd). */
export function fridayOfSameWorkWeek(isoDate: string): string {
  const mon = startOfWeekMonday(parseLocalDate(isoDate));
  return toLocalDateString(addDays(mon, 4));
}

/** Normaliza hora (API ou texto) para `HH:mm`, adequado a `input type="time"`. */
export function normalizeTimeForInput(value: string | undefined | null): string {
  if (value == null || !String(value).trim()) return "";
  const m = String(value)
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?/);
  if (!m) return "";
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

