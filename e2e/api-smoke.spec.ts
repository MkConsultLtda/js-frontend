import { test, expect } from "@playwright/test";

const apiBase = (process.env.E2E_API_URL ?? "").replace(/\/$/, "");
const token = process.env.E2E_ACCESS_TOKEN ?? "";

test.describe("Smoke API (opcional)", () => {
  test.skip(!apiBase || !token, "Defina E2E_API_URL e E2E_ACCESS_TOKEN para rodar smoke contra o Spring.");

  test("GET /v1/appointments responde 200", async ({ request }) => {
    const res = await request.get(`${apiBase}/v1/appointments?from=2026-01-01&to=2026-01-31`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status(), await res.text()).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json)).toBeTruthy();
  });
});
