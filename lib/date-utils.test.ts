import { describe, expect, it } from "vitest";
import { formatIsoDateToBR, toLocalDateString } from "@/lib/date-utils";

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
