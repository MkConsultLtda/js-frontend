import { describe, expect, it } from "vitest";
import {
  formatIsoDateToBR,
  formatMonthYearPtBR,
  isoDateFromJsonField,
  toLocalDateString,
} from "@/lib/date-utils";

describe("formatMonthYearPtBR", () => {
  it("mantém a preposição em minúscula", () => {
    expect(formatMonthYearPtBR(new Date(2026, 10, 1))).toBe("Novembro de 2026");
  });
});

describe("formatIsoDateToBR", () => {
  it("converte yyyy-mm-dd", () => {
    expect(formatIsoDateToBR("2026-04-18")).toBe("18/04/2026");
  });
});

describe("toLocalDateString", () => {
  it("usa fuso local", () => {
    const d = new Date(2026, 3, 18);
    expect(toLocalDateString(d)).toBe("2026-04-18");
  });
});

describe("isoDateFromJsonField", () => {
  it("aceita ISO string", () => {
    expect(isoDateFromJsonField("2026-05-03T00:00:00")).toBe("2026-05-03");
  });
  it("aceita array ano/mês/dia", () => {
    expect(isoDateFromJsonField([2026, 5, 3])).toBe("2026-05-03");
  });
  it("retorna vazio para null", () => {
    expect(isoDateFromJsonField(null)).toBe("");
  });
});
