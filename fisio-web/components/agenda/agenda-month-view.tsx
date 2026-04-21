"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import type { Appointment, Holiday } from "@/lib/types";
import { parseLocalDate, toLocalDateString } from "@/lib/date-utils";
import { monthChipClassName } from "@/lib/agenda-entry-styles";
import { holidaysForDate } from "@/lib/holiday-utils";
import { isWorkingDate } from "@/lib/schedule-utils";
import { parseTimeToMinutes } from "@/lib/agenda-calendar-utils";

const dayNames = ["D", "S", "T", "Q", "Q", "S", "S"];

type Props = {
  currentDate: Date;
  selectedDate: string;
  appointments: Appointment[];
  holidays: Holiday[];
  workingWeekdays: number[];
  onNavigate: (direction: "prev" | "next" | "today") => void;
  onSelectDay: (day: number) => void;
  onAppointmentClick: (appointment: Appointment) => void;
};

export function AgendaMonthView({
  currentDate,
  selectedDate,
  appointments,
  holidays,
  workingWeekdays,
  onNavigate,
  onSelectDay,
  onAppointmentClick,
}: Props) {
  const selectedDay = parseLocalDate(selectedDate).getDate();

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstWeekday = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const appointmentsByDay = React.useMemo(() => {
    const map = new Map<number, Appointment[]>();
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    for (const apt of appointments) {
      const d = parseLocalDate(apt.date);
      if (d.getFullYear() === y && d.getMonth() === m) {
        const day = d.getDate();
        const list = map.get(day) ?? [];
        list.push(apt);
        map.set(day, list);
      }
    }
    for (const [, list] of map) {
      list.sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
    }
    return map;
  }, [appointments, currentDate]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <CardTitle className="text-lg">Mês</CardTitle>
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
          Dias fora do seu expediente aparecem esmaecidos. Ajuste em{" "}
          <Link href="/configuracoes" className="underline underline-offset-2">
            Configurações
          </Link>
          .
        </p>
        <div className="text-sm font-medium capitalize">
          {currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-muted-foreground">
          {dayNames.map((day, index) => (
            <div key={index}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, index) => {
            const dayNumber = index - firstWeekday + 1;
            const isActive = dayNumber >= 1 && dayNumber <= daysInMonth;
            const isSelected = isActive && dayNumber === selectedDay;
            const cellDate = isActive
              ? new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber)
              : null;
            const isWorkingDayCell =
              cellDate !== null && isWorkingDate(cellDate, workingWeekdays);
            const dayAppointments = isActive ? appointmentsByDay.get(dayNumber) ?? [] : [];
            const cellDateKey =
              cellDate !== null ? toLocalDateString(cellDate) : "";
            const dayHolidays = cellDateKey ? holidaysForDate(holidays, cellDateKey) : [];

            return (
              <button
                type="button"
                key={index}
                disabled={!isActive}
                aria-disabled={isActive && !isWorkingDayCell}
                title={
                  isActive && !isWorkingDayCell
                    ? "Fora dos dias de atendimento configurados"
                    : undefined
                }
                onClick={() => {
                  if (!isActive) return;
                  if (!isWorkingDayCell) {
                    toast.message(
                      "Este dia não está nos seus dias de atendimento. Ajuste em Configurações se precisar."
                    );
                    return;
                  }
                  onSelectDay(dayNumber);
                }}
                className={`flex min-h-[104px] flex-col items-stretch rounded-lg border p-1.5 text-left text-sm transition ${
                  !isActive
                    ? "pointer-events-none bg-transparent text-muted-foreground"
                    : !isWorkingDayCell
                      ? "cursor-not-allowed border-dashed bg-muted/40 text-muted-foreground"
                      : isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border bg-background hover:bg-muted/60"
                }`}
              >
                <span
                  className={`mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isSelected ? "bg-primary text-primary-foreground" : "text-foreground"
                  }`}
                >
                  {isActive ? dayNumber : ""}
                </span>
                {dayHolidays.length > 0 ? (
                  <div className="mb-1 space-y-0.5">
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
                <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                  {dayAppointments.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      className={`${monthChipClassName(apt)} cursor-pointer`}
                      title={`${apt.time} · ${apt.patientName}`}
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        onAppointmentClick(apt);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        event.stopPropagation();
                        onAppointmentClick(apt);
                      }}
                    >
                      <span className="font-medium">{apt.time}</span>{" "}
                      <span className="opacity-90">{apt.patientName}</span>
                    </div>
                  ))}
                  {dayAppointments.length > 3 ? (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      +{dayAppointments.length - 3} mais
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
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
