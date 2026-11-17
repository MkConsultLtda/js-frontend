import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const renderMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/backend-access", () => ({
  resolveAccessTokenForBackendProxy: async () => ({ ok: true, accessToken: "t" }),
}));
vi.mock("@/lib/server-auth", () => ({ backendApiUrl: () => "http://upstream/v1" }));
vi.mock("@/lib/pdf/browser", () => ({ renderHtmlToPdf: renderMock }));

import { GET } from "./route";

const patientJson = { id: 7, name: "Maria", registeredAt: "2025-02-01" };

type Handler = (url: string) => Response | undefined;

function history(overrides: Record<string, unknown> = {}) {
  return {
    anamneses: [],
    evolucoes: [],
    appointments: [],
    truncated: { anamneses: false, evolucoes: false, appointments: false },
    limit: 2000,
    ...overrides,
  };
}

/** Upstream falso: `override` responde antes do comportamento padrao (historico completo e vazio). */
function mockUpstream(override: Handler = () => undefined) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      calls.push(url);
      const o = override(url);
      if (o) return o;
      if (url.endsWith("auth/me")) return Response.json({ name: "Dra" });
      if (url.endsWith("patients/7")) return Response.json(patientJson);
      if (url.endsWith("patients/7/history")) return Response.json(history());
      return Response.json([]);
    }),
  );
  return calls;
}

const ctx = { params: Promise.resolve({ pacienteId: "7" }) };
const run = () => GET(new Request("http://x"), ctx);

function hashFromRenderedHtml(): string {
  const html = String(renderMock.mock.calls[0][0]);
  const m = html.match(/class="hash">([0-9a-f]{64})</);
  if (!m) throw new Error("hash nao encontrado no HTML");
  return m[1];
}

const apt = (id: number, date: string, time = "09:00") => ({
  id,
  kind: "session",
  patientId: 7,
  patientName: "Maria",
  date,
  time,
  duration: 50,
  type: "Fisio",
  status: "completed",
  paymentStatus: "paid",
});

describe("GET /api/pdf/prontuario/[pacienteId]", () => {
  beforeEach(() => {
    renderMock.mockReset();
    renderMock.mockResolvedValue(new Uint8Array([1, 2, 3]));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gera o PDF com exatamente 3 chamadas ao upstream (me, paciente, historico)", async () => {
    const calls = mockUpstream();
    const res = await run();
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(3);
    expect(calls.some((u) => u.endsWith("patients/7/history"))).toBe(true);
    expect(calls.some((u) => u.includes("evolutions?"))).toBe(false);
  });

  it("upstream 429 => 429 com Retry-After propagado e nenhum PDF", async () => {
    mockUpstream((u) =>
      u.endsWith("/history")
        ? new Response("{}", { status: 429, headers: { "Retry-After": "42" } })
        : undefined,
    );
    const res = await run();
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(renderMock).not.toHaveBeenCalled();
  });

  it("429 sem Retry-After recebe um valor padrao", async () => {
    mockUpstream((u) => (u.endsWith("auth/me") ? new Response("{}", { status: 429 }) : undefined));
    const res = await run();
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  it("qualquer colecao truncada => 422 PRONTUARIO_TRUNCATED e nenhum PDF", async () => {
    for (const key of ["anamneses", "evolucoes", "appointments"]) {
      renderMock.mockClear();
      mockUpstream((u) =>
        u.endsWith("/history")
          ? Response.json(
              history({
                truncated: { anamneses: false, evolucoes: false, appointments: false, [key]: true },
              }),
            )
          : undefined,
      );
      const res = await run();
      expect(res.status).toBe(422);
      expect((await res.json()).code).toBe("PRONTUARIO_TRUNCATED");
      expect(renderMock).not.toHaveBeenCalled();
    }
  });

  it("historico com falha (500) => 502 UPSTREAM_INCOMPLETE e nenhum PDF", async () => {
    mockUpstream((u) => (u.endsWith("/history") ? new Response("{}", { status: 500 }) : undefined));
    const res = await run();
    expect(res.status).toBe(502);
    expect((await res.json()).code).toBe("UPSTREAM_INCOMPLETE");
    expect(renderMock).not.toHaveBeenCalled();
  });

  it("historico com formato invalido (sem truncated) => 502", async () => {
    mockUpstream((u) =>
      u.endsWith("/history") ? Response.json({ anamneses: [], evolucoes: [], appointments: [] }) : undefined,
    );
    const res = await run();
    expect(res.status).toBe(502);
    expect(renderMock).not.toHaveBeenCalled();
  });

  it("rejeicao de rede => 502 e nenhum PDF", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    const res = await run();
    expect(res.status).toBe(502);
    expect(renderMock).not.toHaveBeenCalled();
  });

  it("paciente inexistente (404 em paciente e historico) => 404, sem fallback", async () => {
    const calls = mockUpstream((u) =>
      u.endsWith("patients/7") || u.endsWith("/history")
        ? new Response("{}", { status: 404 })
        : undefined,
    );
    const res = await run();
    expect(res.status).toBe(404);
    expect(calls).toHaveLength(3);
  });

  describe("fallback temporario (rota /history ainda inexistente)", () => {
    const legacy = (u: string) =>
      u.endsWith("/history") ? new Response("{}", { status: 404 }) : undefined;

    it("404 de rota com paciente existente cai nas janelas anuais com piso 2000 e teto", async () => {
      const calls = mockUpstream(legacy);
      const res = await run();
      expect(res.status).toBe(200);
      const evoCalls = calls.filter((u) => u.includes("/evolutions?"));
      expect(evoCalls.length).toBeGreaterThan(1);
      expect(evoCalls.length).toBeLessThanOrEqual(30);
      expect(evoCalls.some((u) => u.includes("from=2024-01-01"))).toBe(true);
      const years = evoCalls.map((u) => Number(/from=(\d{4})/.exec(u)?.[1]));
      expect(Math.min(...years)).toBeGreaterThanOrEqual(2000);
    });

    it("falha em janela => 502; 429 em janela => 429", async () => {
      mockUpstream((u) => legacy(u) ?? (u.includes("appointments?") ? new Response("{}", { status: 500 }) : undefined));
      expect((await run()).status).toBe(502);
      expect(renderMock).not.toHaveBeenCalled();

      mockUpstream(
        (u) =>
          legacy(u) ??
          (u.includes("/evolutions?")
            ? new Response("{}", { status: 429, headers: { "Retry-After": "7" } })
            : undefined),
      );
      const res = await run();
      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBe("7");
    });
  });

  describe("contentHash", () => {
    const base = {
      ...history(),
      anamneses: [{ id: 1, patientId: 7, patientName: "Maria", dataColeta: "2026-01-10" }],
      evolucoes: [
        { id: 3, patientId: 7, patientName: "Maria", dataSessao: "2026-02-01" },
        { id: 2, patientId: 7, patientName: "Maria", dataSessao: "2025-03-01" },
      ],
      appointments: [apt(10, "2026-02-01")],
    };

    async function hashFor(h: unknown): Promise<string> {
      renderMock.mockClear();
      mockUpstream((u) => (u.endsWith("/history") ? Response.json(h) : undefined));
      expect((await run()).status).toBe(200);
      return hashFromRenderedHtml();
    }

    it("muda apenas quando os appointments mudam", async () => {
      const h1 = await hashFor(base);
      const h1b = await hashFor(structuredClone(base));
      const h2 = await hashFor({ ...base, appointments: [apt(10, "2026-02-01"), apt(11, "2026-02-08")] });
      const h3 = await hashFor({ ...base, appointments: [{ ...apt(10, "2026-02-01"), status: "cancelled" }] });
      expect(h1b).toBe(h1);
      expect(h2).not.toBe(h1);
      expect(h3).not.toBe(h1);
    });

    it("e igual entre /history e o fluxo legado para os mesmos dados", async () => {
      const viaHistory = await hashFor(base);

      renderMock.mockClear();
      mockUpstream((u) => {
        if (u.endsWith("/history")) return new Response("{}", { status: 404 });
        if (u.endsWith("/anamneses")) return Response.json(base.anamneses);
        if (u.includes("/evolutions?")) {
          const year = /from=(\d{4})/.exec(u)![1];
          return Response.json(
            base.evolucoes.filter((e) => e.dataSessao.startsWith(year)),
          );
        }
        if (u.includes("appointments?")) {
          const year = /from=(\d{4})/.exec(u)![1];
          return Response.json(base.appointments.filter((a) => a.date.startsWith(year)));
        }
        return undefined;
      });
      expect((await run()).status).toBe(200);
      expect(hashFromRenderedHtml()).toBe(viaHistory);
    });

    it("nao depende da ordem em que o backend entrega as colecoes", async () => {
      const a = await hashFor(base);
      const b = await hashFor({
        ...base,
        evolucoes: [...base.evolucoes].reverse(),
        appointments: [apt(11, "2026-02-08"), apt(10, "2026-02-01")].reverse(),
      });
      const c = await hashFor({
        ...base,
        appointments: [apt(10, "2026-02-01"), apt(11, "2026-02-08")],
      });
      expect(b).toBe(c);
      expect(a).not.toBe(b);
    });
  });
});
