import type { Appointment } from "@/lib/types";
import { parseTimeToMinutes } from "@/lib/agenda-calendar-utils";

export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, Math.round(totalMinutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function calculateDurationFromTimeRange(start: string, end: string): number | null {
  const startMin = parseTimeToMinutes(start);
  const endMin = parseTimeToMinutes(end);
  if (endMin <= startMin) return null;
  return endMin - startMin;
}

export function appointmentRangeMinutes(appointment: Pick<Appointment, "time" | "duration">): {
  start: number;
  end: number;
} {
  const start = parseTimeToMinutes(appointment.time);
  const end = start + Math.max(1, appointment.duration);
  return { start, end };
}

export function appointmentsOverlap(
  left: Pick<Appointment, "time" | "duration">,
  right: Pick<Appointment, "time" | "duration">
): boolean {
  const a = appointmentRangeMinutes(left);
  const b = appointmentRangeMinutes(right);
  return a.start < b.end && b.start < a.end;
}

export function formatRange(start: string, duration: number): string {
  const startMin = parseTimeToMinutes(start);
  const endMin = startMin + Math.max(1, duration);
  return `${start} - ${minutesToTime(endMin)}`;
}
