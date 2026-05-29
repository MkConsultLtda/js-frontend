"use client";

import * as React from "react";
import { toast } from "sonner";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Appointment, Holiday } from "@/lib/types";
import { toLocalDateString } from "@/lib/date-utils";
import { holidaysForDate } from "@/lib/holiday-utils";
import { isWorkingDate } from "@/lib/schedule-utils";
import { getWeekDatesContaining } from "@/lib/agenda-calendar-utils";
import { cn } from "@/lib/utils";

const DOW_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

type Props = {
  anchorDate: Date;
  selectedDate: string;
  appointments: Appointment[];
  holidays: Holiday[];
  workingWeekdays: number[];
  onNavigate: (direction: "prev" | "next" | "today") => void;
  onSelectDateKey: (dateKey: string) => void;
};

/** Versão compacta da semana para telas pequenas: faixa de dias selecionáveis. */
export function AgendaWeekMobile({
  anchorDate,
  selectedDate,
  appointments,
  holidays,
  workingWeekdays,
  onNavigate,
  onSelectDateKey,
}: Props) {
  const weekDates = React.useMemo(() => getWeekDatesContaining(anchorDate), [anchorDate]);

  const countByDate = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const a of appointments) {
      map.set(a.date, (map.get(a.date) ?? 0) + 1);
    }
    return map;
  }, [appointments]);

  const rangeLabel = React.useMemo(() => {
    const a = weekDates[0];
    const b = weekDates[6];
    if (!a || !b) return "";
    const left = a.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    const right = b.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
    return `${left} – ${right}`;
  }, [weekDates]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5" />
          <CardTitle className="text-lg">Semana</CardTitle>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => onNavigate("prev")} aria-label="Semana anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate("today")}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate("next")} aria-label="Próxima semana">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm font-medium capitalize">{rangeLabel}</div>
        <div className="grid grid-cols-7 gap-1.5">
          {weekDates.map((d, i) => {
            const key = toLocalDateString(d);
            const isSelected = key === selectedDate;
            const working = isWorkingDate(d, workingWeekdays);
            const count = countByDate.get(key) ?? 0;
            const hasHoliday = holidaysForDate(holidays, key).length > 0;
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
                  "flex flex-col items-center gap-0.5 rounded-lg border px-0.5 py-2 text-center transition",
                  working ? "hover:bg-muted/60" : "cursor-not-allowed bg-muted/30 text-muted-foreground",
                  isSelected && working
                    ? "border-primary bg-primary/10"
                    : "border-border"
                )}
                aria-pressed={isSelected}
              >
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                  {DOW_SHORT[i] ?? ""}
                </span>
                <span className={cn("text-base font-bold leading-none", isSelected && working && "text-primary")}>
                  {d.getDate()}
                </span>
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                    count > 0 ? "bg-primary/15 text-primary" : "text-transparent"
                  )}
                  aria-hidden={count === 0}
                >
                  {count > 0 ? count : "0"}
                </span>
                {hasHoliday ? (
                  <span className="h-1 w-1 rounded-full bg-amber-500" aria-label="Feriado" />
                ) : null}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Toque em um dia para ver os atendimentos na lista abaixo.
        </p>
      </CardContent>
    </Card>
  );
}
