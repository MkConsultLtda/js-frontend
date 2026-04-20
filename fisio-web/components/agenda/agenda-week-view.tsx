"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import type { Appointment } from "@/lib/types";
import { parseLocalDate, toLocalDateString } from "@/lib/date-utils";
import { isWorkingDate } from "@/lib/schedule-utils";
import {
  computeWeekTimeRange,
  getWeekDatesContaining,
  hourTicks,
  parseTimeToMinutes,
} from "@/lib/agenda-calendar-utils";
import { cn } from "@/lib/utils";

const DOW_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

const HOUR_HEIGHT_PX = 52;

type Props = {
  anchorDate: Date;
  selectedDate: string;
  appointments: Appointment[];
  workingWeekdays: number[];
  onNavigate: (direction: "prev" | "next" | "today") => void;
  onSelectDateKey: (dateKey: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
};

export function AgendaWeekView({
  anchorDate,
  selectedDate,
  appointments,
  workingWeekdays,
  onNavigate,
  onSelectDateKey,
  onAppointmentClick,
}: Props) {
  const weekDates = React.useMemo(() => getWeekDatesContaining(anchorDate), [anchorDate]);

  const rangeLabel = React.useMemo(() => {
    const a = weekDates[0];
    const b = weekDates[6];
    if (!a || !b) return "";
    const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    const left = a.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    const right = sameMonth
      ? b.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
      : b.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
    return `${left} – ${right}`;
  }, [weekDates]);

  const { startMin, endMin } = React.useMemo(
    () => computeWeekTimeRange(weekDates, appointments),
    [weekDates, appointments]
  );

  const totalMinutes = endMin - startMin;
  const gridHeightPx = Math.max(320, (totalMinutes / 60) * HOUR_HEIGHT_PX);

  const ticks = React.useMemo(() => hourTicks(startMin, endMin), [startMin, endMin]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5" />
          <CardTitle className="text-lg">Semana</CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onNavigate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate("today")}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          A grade mostra a duração de cada atendimento. Espaços vazios são horários livres. Dias fora do
          expediente ficam esmaecidos — veja{" "}
          <Link href="/configuracoes" className="underline underline-offset-2">
            Configurações
          </Link>
          .
        </p>
        <div className="text-sm font-medium capitalize">{rangeLabel}</div>

        <p className="text-[11px] text-muted-foreground">
          Role dentro da grade para ver todas as horas e atendimentos.
        </p>

        <div
          className="max-h-[min(75vh,880px)] overflow-y-auto overflow-x-auto rounded-xl border overscroll-contain scroll-smooth"
          role="region"
          aria-label="Grade semanal de horários"
        >
          <div className="min-w-[720px]">
            <div className="sticky top-0 z-10 grid grid-cols-[52px_repeat(7,minmax(0,1fr))] border-b bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="p-2" />
              {weekDates.map((d, i) => {
                const key = toLocalDateString(d);
                const isSelected = key === selectedDate;
                const working = isWorkingDate(d, workingWeekdays);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (!working) {
                        toast.message(
                          "Este dia não está nos seus dias de atendimento. Ajuste em Configurações se precisar."
                        );
                        return;
                      }
                      onSelectDateKey(key);
                    }}
                    className={cn(
                      "border-l p-2 text-left text-xs transition",
                      working ? "hover:bg-muted/60" : "cursor-not-allowed bg-muted/30 text-muted-foreground",
                      isSelected && working && "bg-primary/10"
                    )}
                  >
                    <div className="font-semibold text-[11px] text-muted-foreground">
                      {DOW_SHORT[i] ?? ""}
                    </div>
                    <div className={cn("text-lg font-bold leading-none", isSelected && "text-primary")}>
                      {d.getDate()}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))]">
              <div
                className="relative border-r bg-muted/20"
                style={{ height: `${gridHeightPx}px` }}
              >
                {ticks.map((t) => {
                  const y = ((t - startMin) / totalMinutes) * gridHeightPx;
                  return (
                    <div
                      key={t}
                      className="absolute left-0 right-0 flex -translate-y-1/2 items-start justify-end pr-2 text-[11px] text-muted-foreground"
                      style={{ top: `${y}px` }}
                    >
                      {String(Math.floor(t / 60)).padStart(2, "0")}:00
                    </div>
                  );
                })}
              </div>

              {weekDates.map((d) => {
                const key = toLocalDateString(d);
                const working = isWorkingDate(d, workingWeekdays);
                const dayAppointments = appointments
                  .filter((a) => a.date === key)
                  .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

                return (
                  <div
                    key={key}
                    className={cn(
                      "relative border-l",
                      !working && "bg-muted/20",
                      selectedDate === key && working && "bg-primary/5"
                    )}
                    style={{ height: `${gridHeightPx}px` }}
                  >
                    {ticks.map((t) => {
                      const y = ((t - startMin) / totalMinutes) * gridHeightPx;
                      return (
                        <div
                          key={t}
                          className="pointer-events-none absolute left-0 right-0 border-t border-border/60"
                          style={{ top: `${y}px` }}
                        />
                      );
                    })}

                    {dayAppointments.map((apt) => {
                      const start = parseTimeToMinutes(apt.time);
                      const end = start + apt.duration;
                      const clampedStart = Math.max(start, startMin);
                      const clampedEnd = Math.min(end, endMin);
                      if (clampedEnd <= startMin || clampedStart >= endMin) return null;
                      const top = ((clampedStart - startMin) / totalMinutes) * gridHeightPx;
                      const height = Math.max(
                        18,
                        ((Math.min(end, endMin) - Math.max(start, startMin)) / totalMinutes) *
                          gridHeightPx
                      );

                      return (
                        <button
                          key={apt.id}
                          type="button"
                          onClick={() => onAppointmentClick(apt)}
                          className={cn(
                            "absolute left-0.5 right-0.5 overflow-hidden rounded-md border px-1 py-0.5 text-left text-[10px] leading-tight shadow-sm transition hover:brightness-95",
                            apt.status === "cancelled" &&
                              "border-muted bg-muted/80 text-muted-foreground line-through",
                            apt.status === "confirmed" &&
                              "border-emerald-200 bg-emerald-100 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-50",
                            apt.status === "pending" &&
                              "border-amber-200 bg-amber-100 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-50",
                            apt.status !== "confirmed" &&
                              apt.status !== "pending" &&
                              apt.status !== "cancelled" &&
                              "border-slate-200 bg-slate-100 text-slate-900 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-50"
                          )}
                          style={{ top: `${top}px`, height: `${height}px` }}
                        >
                          <div className="font-semibold">{apt.time}</div>
                          <div className="truncate font-medium">{apt.patientName}</div>
                          <div className="truncate opacity-80">{apt.type}</div>
                          <div className="text-[9px] opacity-70">{apt.duration} min</div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Dia focado na lista abaixo:{" "}
          <span className="font-semibold text-foreground">
            {parseLocalDate(selectedDate).toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
