import { addDays, toLocalDateString } from "@/lib/date-utils";
import type { Appointment } from "@/lib/types";

/** Domingo = primeiro dia da semana (alinha ao calendário mensal da agenda). */
export function startOfWeekSunday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

export function getWeekDatesContaining(date: Date): Date[] {
  const start = startOfWeekSunday(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function parseTimeToMinutes(time: string): number {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  return h * 60 + m;
}

/**
 * Faixa horária visível na semana, com base nos atendimentos da semana.
 * Limites 06:00–23:00 para não estourar a tela.
 */
export function computeWeekTimeRange(
  weekDates: Date[],
  appointments: Appointment[]
): { startMin: number; endMin: number } {
  const keys = new Set(weekDates.map((d) => toLocalDateString(d)));
  const list = appointments.filter((a) => keys.has(a.date));
  const HARD_MIN = 6 * 60;
  const HARD_MAX = 23 * 60;
  const DEFAULT_START = 8 * 60;
  const DEFAULT_END = 18 * 60;

  if (list.length === 0) {
    return { startMin: DEFAULT_START, endMin: DEFAULT_END };
  }

  let startMin = HARD_MAX;
  let endMin = HARD_MIN;
  for (const apt of list) {
    const s = parseTimeToMinutes(apt.time);
    const e = s + apt.duration;
    startMin = Math.min(startMin, s);
    endMin = Math.max(endMin, e);
  }
  startMin = Math.max(HARD_MIN, Math.floor(startMin / 60) * 60 - 60);
  endMin = Math.min(HARD_MAX, Math.ceil(endMin / 60) * 60 + 60);
  if (endMin <= startMin) {
    return { startMin: DEFAULT_START, endMin: DEFAULT_END };
  }
  return { startMin, endMin };
}

export function hourTicks(startMin: number, endMin: number): number[] {
  const ticks: number[] = [];
  const first = Math.ceil(startMin / 60) * 60;
  for (let t = first; t < endMin; t += 60) {
    ticks.push(t);
  }
  return ticks;
}
