import type { Appointment } from "@/lib/types";
import { isSessionAppointment } from "@/lib/types";
import { cn } from "@/lib/utils";

const baseBlock =
  "border shadow-sm transition hover:brightness-[0.98] backdrop-blur-[1px]";

/** Estilo dos blocos na grade semanal / chips no mês (meio transparente). */
export function calendarEntryClassName(entry: Appointment): string {
  if (entry.kind === "block") {
    return cn(
      baseBlock,
      "border-slate-400/50 bg-slate-300/60 text-slate-900 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-100"
    );
  }
  if (entry.kind === "personal") {
    return cn(
      baseBlock,
      "border-violet-400/50 bg-violet-300/45 text-violet-950 dark:border-violet-500/40 dark:bg-violet-950/35 dark:text-violet-50"
    );
  }
  if (!isSessionAppointment(entry)) {
    return cn(baseBlock, "border-border bg-muted");
  }

  switch (entry.status) {
    case "scheduled":
      return cn(
        baseBlock,
        "border-amber-400/60 bg-amber-200/55 text-amber-950 dark:border-amber-600/50 dark:bg-amber-950/35 dark:text-amber-50"
      );
    case "confirmed":
      return cn(
        baseBlock,
        "border-sky-400/60 bg-sky-200/50 text-sky-950 dark:border-sky-500/45 dark:bg-sky-950/40 dark:text-sky-50"
      );
    case "completed":
      return cn(
        baseBlock,
        "border-emerald-400/55 bg-emerald-200/45 text-emerald-950 dark:border-emerald-600/45 dark:bg-emerald-950/35 dark:text-emerald-50"
      );
    case "cancelled":
      return cn(
        baseBlock,
        "border-red-400/50 bg-red-100/50 text-red-900 line-through decoration-red-600/70 dark:border-red-800/70 dark:bg-red-950/40 dark:text-red-100"
      );
    default:
      return cn(baseBlock, "border-border bg-muted/80");
  }
}

export function monthChipClassName(entry: Appointment): string {
  return cn(
    "truncate rounded px-1 py-0.5 text-[10px] leading-tight",
    calendarEntryClassName(entry)
  );
}
