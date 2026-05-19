import { describe, expect, it } from "vitest";

import { buildCalendarExtraDates } from "@/lib/agenda-extra-dates";
import type { CalendarExtraFormValues } from "@/lib/schemas/calendar-extra-form";

function base(values: Partial<CalendarExtraFormValues>): CalendarExtraFormValues {
  return {
    title: "Bloqueio",
    date: "2026-05-20",
    time: "",
    endTime: "",
    isAllDay: false,
    repeatEnabled: false,
    repeatWeekdays: [],
    repeatUntil: "",
    notes: "",
    ...values,
  };
}

describe("buildCalendarExtraDates", () => {
  it("dia inteiro com até gera intervalo corrido sem repetir semanal", () => {
    const dates = buildCalendarExtraDates(
      base({
        isAllDay: true,
        repeatUntil: "2026-05-21",
        repeatEnabled: false,
        repeatWeekdays: [],
      }),
    );
    expect(dates).toEqual(["2026-05-20", "2026-05-21"]);
  });

  it("sem repetição retorna só a data inicial", () => {
    expect(buildCalendarExtraDates(base({ date: "2026-05-20" }))).toEqual(["2026-05-20"]);
  });
});
