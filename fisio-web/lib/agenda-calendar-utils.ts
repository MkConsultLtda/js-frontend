import { addDays, startOfWeekSunday } from "@/lib/date-utils";

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
 * Grade semanal: dia completo 00:00 → 24:00 (meia-noite do dia seguinte),
 * para permitir rolagem por todas as horas.
 */
export const WEEK_VIEW_DAY_RANGE = { startMin: 0, endMin: 24 * 60 } as const;

export function hourTicks(startMin: number, endMin: number): number[] {
  const ticks: number[] = [];
  const first = Math.ceil(startMin / 60) * 60;
  for (let t = first; t < endMin; t += 60) {
    ticks.push(t);
  }
  return ticks;
}
