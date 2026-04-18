import { describe, expect, it } from "vitest";
import {
  countAppointmentsByWorkingWeekdays,
  formatWorkingDaysShort,
  normalizeWorkingWeekdays,
  nextWorkingDateKey,
} from "@/lib/schedule-utils";

describe("normalizeWorkingWeekdays", () => {
  it("usa seg–sex quando vazio ou inválido", () => {
    expect(normalizeWorkingWeekdays([])).toEqual([1, 2, 3, 4, 5]);
    expect(normalizeWorkingWeekdays(null)).toEqual([1, 2, 3, 4, 5]);
  });

  it("deduplica e ordena", () => {
    expect(normalizeWorkingWeekdays([3, 1, 1, 5])).toEqual([1, 3, 5]);
  });
});

describe("nextWorkingDateKey", () => {
  it("mantém sexta se for dia útil", () => {
    expect(nextWorkingDateKey("2026-04-17", [1, 2, 3, 4, 5])).toBe("2026-04-17");
  });

  it("avança domingo para segunda", () => {
    expect(nextWorkingDateKey("2026-04-19", [1, 2, 3, 4, 5])).toBe("2026-04-20");
  });
});

describe("countAppointmentsByWorkingWeekdays", () => {
  it("só inclui dias configurados", () => {
    const ref = new Date(2026, 3, 15);
    const bars = countAppointmentsByWorkingWeekdays(
      [{ date: "2026-04-13" }, { date: "2026-04-18" }],
      ref,
      [1, 3, 5]
    );
    expect(bars.map((b) => b.label)).toEqual(["Seg", "Qua", "Sex"]);
    expect(bars.find((b) => b.dateKey === "2026-04-13")?.count).toBe(1);
  });
});

describe("formatWorkingDaysShort", () => {
  it("formata lista", () => {
    expect(formatWorkingDaysShort([1, 5])).toBe("seg, sex");
  });
});
