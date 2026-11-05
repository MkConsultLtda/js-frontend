import { describe, expect, it } from "vitest";
import { isRegisteredThisMonth } from "@/lib/dashboard-metrics";

describe("isRegisteredThisMonth", () => {
  it("aceita data BR dd/mm/aaaa", () => {
    expect(isRegisteredThisMonth("15/07/2026", "2026-07")).toBe(true);
    expect(isRegisteredThisMonth("15/06/2026", "2026-07")).toBe(false);
  });

  it("aceita data ISO", () => {
    expect(isRegisteredThisMonth("2026-07-15", "2026-07")).toBe(true);
  });
});
