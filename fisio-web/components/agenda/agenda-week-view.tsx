"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import type { Appointment, Holiday } from "@/lib/types";
import { calendarEntryClassName } from "@/lib/agenda-entry-styles";
import { parseLocalDate, toLocalDateString } from "@/lib/date-utils";
import { holidaysForDate } from "@/lib/holiday-utils";
import { isWorkingDate } from "@/lib/schedule-utils";
import {
  getWeekDatesContaining,
  hourTicks,
  parseTimeToMinutes,
  WEEK_VIEW_DAY_RANGE,
} from "@/lib/agenda-calendar-utils";
import { cn } from "@/lib/utils";

const DOW_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

/** Altura por hora na grade (24h → rolagem vertical no painel). */
const HOUR_HEIGHT_PX = 36;

function formatHourTickLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

type Props = {
  anchorDate: Date;
  selectedDate: string;
  appointments: Appointment[];
  holidays: Holiday[];
  workingWeekdays: number[];
  onNavigate: (direction: "prev" | "next" | "today") => void;
  onSelectDateKey: (dateKey: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
};

export function AgendaWeekView({
  anchorDate,
  selectedDate,
  appointments,
  holidays,
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

  const startMin = WEEK_VIEW_DAY_RANGE.startMin;
  const endMin = WEEK_VIEW_DAY_RANGE.endMin;
  const totalMinutes = endMin - startMin;
  const gridHeightPx = (totalMinutes / 60) * HOUR_HEIGHT_PX;

  const ticks = React.useMemo(() => hourTicks(startMin, endMin), [startMin, endMin]);

  return (
    <Card>
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
          Grade com as 24 horas do dia (00:00–23:59). Role dentro do quadro abaixo para percorrer o dia
          inteiro. Dias fora do expediente ficam esmaecidos — veja{" "}
          <Link href="/configuracoes" className="underline underline-offset-2">
            Configurações
          </Link>
          .
        </p>
        <div className="text-sm font-medium capitalize">{rangeLabel}</div>

        <div
          className="flex h-[min(72vh,820px)] min-h-[320px] max-h-[90vh] flex-col overflow-hidden rounded-xl border bg-card"
          role="presentation"
        >
          <div
            className="min-h-0 flex-1 touch-pan-y overflow-y-auto overflow-x-auto overscroll-contain [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]"
            role="region"
            aria-label="Grade semanal: 24 horas, role para ver todas"
            tabIndex={0}
          >
            <div className="min-w-[720px]">
              <div className="sticky top-0 z-10 grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b bg-background shadow-sm">
                <div className="border-r bg-muted/30 p-1" aria-hidden />
                {weekDates.map((d, i) => {
                  const key = toLocalDateString(d);
                  const isSelected = key === selectedDate;
                  const working = isWorkingDate(d, workingWeekdays);
                  const dayHolidays = holidaysForDate(holidays, key);
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
                      {dayHolidays.length > 0 ? (
                        <div className="mt-1 space-y-0.5">
                          {dayHolidays.map((h) => (
                            <div
                              key={h.id}
                              className="truncate text-[9px] font-semibold leading-tight text-amber-600 dark:text-amber-400"
                              title={h.name}
                            >
                              {h.name}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
                <div
                  className="relative border-r bg-muted/20"
                  style={{ height: `${gridHeightPx}px` }}
                >
                  {ticks.map((t) => {
                    const y = ((t - startMin) / totalMinutes) * gridHeightPx;
                    return (
                      <div
                        key={t}
                        className="absolute left-0 right-0 flex -translate-y-1/2 items-start justify-end pr-1.5 text-[10px] tabular-nums text-muted-foreground"
                        style={{ top: `${y}px` }}
                      >
                        {formatHourTickLabel(t)}
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
                            className="pointer-events-none absolute left-0 right-0 border-t border-border/70"
                            style={{ top: `${y}px` }}
                          />
                        );
                      })}

                      {Array.from({ length: 24 }, (_, h) => {
                        const y = (h + 0.5) * HOUR_HEIGHT_PX;
                        return (
                          <div
                            key={`half-${h}`}
                            className="pointer-events-none absolute left-0 right-0 border-t border-border/25"
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
                          16,
                          ((Math.min(end, endMin) - Math.max(start, startMin)) / totalMinutes) *
                            gridHeightPx
                        );

                        return (
                        <button
                          key={apt.id}
                          type="button"
                          onClick={() => onAppointmentClick(apt)}
                          className={cn(
                            "absolute left-0.5 right-0.5 overflow-hidden rounded-md px-1 py-0.5 text-left text-[10px] leading-tight hover:brightness-95",
                            calendarEntryClassName(apt)
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
