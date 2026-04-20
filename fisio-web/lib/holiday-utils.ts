import type { Holiday } from "@/lib/types";

export function holidaysForDate(holidays: Holiday[], dateKey: string): Holiday[] {
  return holidays.filter((h) => h.date === dateKey);
}
