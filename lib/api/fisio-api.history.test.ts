import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  anamneseTruncatedMessage,
  canRetryAnamneseLoad,
  classifyPatientLoadError,
  patientHistoryTruncatedMessage,
} from "@/lib/api/load-error";

const backendJsonMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/backend-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/backend-client")>();
  return { ...actual, backendJson: backendJsonMock };
});

import {
  canonicalHistoryOrder,
  EVOLUTION_AGG_CONCURRENCY,
  fetchAggregatedEvolutionsDetailed,
  fetchAnamneseById,
  fetchClinicAnamneses,
  fetchPatientDetailBundle,
  mapSettledWithConcurrency,
  patientHistoryWindows,
  splitEvolutionRange,
} from "@/lib/api/fisio-api";

describe("fetchClinicAnamneses", () => {
  beforeEach(() => {
    backendJsonMock.mockReset();
  });

  it("faz 1 GET /anamneses?limit= e mapeia o resumo (dd/mm/aaaa, sem texto)", async () => {
    backendJsonMock.mockResolvedValue({
      items: [{ id: 7, patientId: 3, patientName: "Maria", dataColeta: "2026-05-04" }],
      truncated: false,
      limit: 500,
    });
    const res = await fetchClinicAnamneses();
    expect(backendJsonMock).toHaveBeenCalledTimes(1);
    expect(backendJsonMock.mock.calls[0][0]).toContain("anamneses?limit=500");
    expect(res.truncated).toBe(false);
    expect(res.limit).toBe(500);
    expect(res.anamneses).toHaveLength(1);
    expect(res.anamneses[0]).toMatchObject({
      id: 7,
      patientId: 3,
      patientName: "Maria",
      dataColeta: "04/05/2026",
    });
    expect(res.anamneses[0].anamneseTexto).toBeUndefined();
  });

  it("propaga truncated e limit e tolera lista vazia", async () => {
    backendJsonMock.mockResolvedValue({ items: [], truncated: true, limit: 100 });
    const res = await fetchClinicAnamneses(100);
    expect(backendJsonMock.mock.calls[0][0]).toContain("limit=100");
    expect(res).toEqual({ anamneses: [], truncated: true, limit: 100 });
  });

  it("erro do backend (ex. 429) rejeita com o status", async () => {
    backendJsonMock.mockRejectedValue(Object.assign(new Error("x"), { status: 429 }));
    await expect(fetchClinicAnamneses()).rejects.toMatchObject({ status: 429 });
  });
});

describe("fetchAnamneseById", () => {
  it("busca o detalhe com o texto completo", async () => {
    backendJsonMock.mockReset();
    backendJsonMock.mockResolvedValue({
      id: 7,
      patientId: 3,
      patientName: "Maria",
      dataColeta: "2026-05-04",
      anamneseTexto: "<p>oi</p>",
    });
    const a = await fetchAnamneseById(7);
    expect(backendJsonMock.mock.calls[0][0]).toContain("anamneses/7");
    expect(a.anamneseTexto).toBe("<p>oi</p>");
  });
});

const patientRaw = { id: 5, name: "Joana", registeredAt: "2025-02-01" };
const historyRaw = {
  anamneses: [{ id: 1, patientId: 5, patientName: "Joana", dataColeta: "2026-01-10" }],
  evolucoes: [
    { id: 3, patientId: 5, dataSessao: "2026-02-01" },
    { id: 2, patientId: 5, dataSessao: "2025-03-01" },
  ],
  appointments: [
    { id: 11, patientId: 5, date: "2026-02-08", time: "09:00:00", kind: "session" },
    { id: 10, patientId: 5, date: "2026-02-01", time: "09:00:00", kind: "session" },
  ],
  truncated: { anamneses: false, evolucoes: true, appointments: false },
  limit: 2000,
};

describe("fetchPatientDetailBundle", () => {
  beforeEach(() => {
    backendJsonMock.mockReset();
  });

  it("200: paciente + histórico em 2 chamadas, agenda crescente e truncated", async () => {
    backendJsonMock.mockImplementation(async (href: string) => {
      if (href.endsWith("patients/5")) return patientRaw;
      if (href.endsWith("patients/5/history")) return historyRaw;
      throw new Error(`inesperado: ${href}`);
    });
    const b = await fetchPatientDetailBundle(5);
    expect(backendJsonMock).toHaveBeenCalledTimes(2);
    expect(b.patient.name).toBe("Joana");
    expect(b.anamneses).toHaveLength(1);
    expect(b.evolucoes.map((e) => e.id)).toEqual([2, 3]);
    expect(b.appointments.map((a) => a.id)).toEqual([10, 11]);
    expect(b.truncated).toEqual({ anamneses: false, evolucoes: true, appointments: false });
  });

  it("404 de /history com paciente existente => fallback por janelas (piso 2000)", async () => {
    const windowCalls: string[] = [];
    backendJsonMock.mockImplementation(async (href: string) => {
      if (href.endsWith("patients/5")) return patientRaw;
      if (href.endsWith("patients/5/history")) {
        throw Object.assign(new Error("nf"), { status: 404 });
      }
      if (href.endsWith("patients/5/anamneses")) return historyRaw.anamneses;
      windowCalls.push(href);
      return [];
    });
    const b = await fetchPatientDetailBundle(5);
    expect(b.patient.id).toBe(5);
    expect(b.anamneses).toHaveLength(1);
    expect(b.truncated).toEqual({ anamneses: false, evolucoes: false, appointments: false });
    const evo = windowCalls.filter((h) => h.includes("/evolutions"));
    expect(evo.length).toBeGreaterThan(1);
    expect(evo.length).toBeLessThanOrEqual(30);
    const years = evo.map((h) => Number(/from=(\d{4})/.exec(h)?.[1]));
    expect(Math.min(...years)).toBeGreaterThanOrEqual(2000);
  });

  it("fallback legado com anamneses no teto (500) marca truncated.anamneses", async () => {
    const many = Array.from({ length: 500 }, (_, i) => ({
      id: i + 1,
      patientId: 5,
      patientName: "Joana",
      dataColeta: "2026-01-10",
    }));
    backendJsonMock.mockImplementation(async (href: string) => {
      if (href.endsWith("patients/5")) return patientRaw;
      if (href.endsWith("patients/5/history")) {
        throw Object.assign(new Error("nf"), { status: 404 });
      }
      if (href.endsWith("patients/5/anamneses")) return many;
      return [];
    });
    const b = await fetchPatientDetailBundle(5);
    expect(b.truncated.anamneses).toBe(true);
  });

  it("documenta: backend antigo respondendo 500 em /history NÃO aciona fallback (publicar backend antes do front)", async () => {
    backendJsonMock.mockImplementation(async (href: string) => {
      if (href.endsWith("patients/5")) return patientRaw;
      throw Object.assign(new Error("Internal"), { status: 500 });
    });
    await expect(fetchPatientDetailBundle(5)).rejects.toMatchObject({ status: 500 });
    expect(backendJsonMock).toHaveBeenCalledTimes(2);
  });

  it("paciente 404 => propaga 404 sem fallback", async () => {
    backendJsonMock.mockImplementation(async () => {
      throw Object.assign(new Error("nf"), { status: 404 });
    });
    await expect(fetchPatientDetailBundle(5)).rejects.toMatchObject({ status: 404 });
    expect(backendJsonMock).toHaveBeenCalledTimes(2);
  });

  it("/history 500 ou 429 propaga o erro, sem fallback", async () => {
    for (const status of [500, 429]) {
      backendJsonMock.mockReset();
      backendJsonMock.mockImplementation(async (href: string) => {
        if (href.endsWith("patients/5")) return patientRaw;
        throw Object.assign(new Error("x"), { status });
      });
      await expect(fetchPatientDetailBundle(5)).rejects.toMatchObject({ status });
      expect(backendJsonMock).toHaveBeenCalledTimes(2);
    }
  });

  it("/history com formato inválido => erro 502", async () => {
    backendJsonMock.mockImplementation(async (href: string) =>
      href.endsWith("patients/5") ? patientRaw : { anamneses: [] },
    );
    await expect(fetchPatientDetailBundle(5)).rejects.toMatchObject({ status: 502 });
  });
});

describe("canonicalHistoryOrder", () => {
  it("evoluções por ano crescente e, no ano, recentes primeiro; agenda crescente", () => {
    const mk = (id: number, dataSessao: string) => ({ id, dataSessao }) as never;
    const out = canonicalHistoryOrder({
      anamneses: [],
      evolucoes: [mk(3, "2026-02-01"), mk(1, "2025-01-01"), mk(2, "2025-06-01")],
      appointments: [
        { id: 2, date: "2026-02-02", time: "10:00" },
        { id: 1, date: "2026-02-02", time: "09:00" },
      ] as never,
    });
    expect(out.evolucoes.map((e) => e.id)).toEqual([2, 1, 3]);
    expect(out.appointments.map((a) => a.id)).toEqual([1, 2]);
  });
});

describe("fetchAggregatedEvolutionsDetailed", () => {
  beforeEach(() => {
    backendJsonMock.mockReset();
    vi.useRealTimers();
  });

  const pts = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i + 1 }));
  const E404 = () => Object.assign(new Error("404"), { status: 404 });
  const isAgg = (href: unknown) => !String(href).includes("patients/");
  const dto = (id: number, dataSessao: string) => ({
    id,
    patientId: 7,
    patientName: "Ana",
    dataSessao,
    horaAtendimento: "09:30:00",
    tipoSessao: "Fisio",
    sinaisVitaisInicio: "120/80",
    objetivosSessao: "obj",
  });

  /** Simula backend antigo: agregado responde 404, por paciente responde `legacy`. */
  const mockLegacyBackend = (legacy: (href: string) => unknown) =>
    backendJsonMock.mockImplementation(async (href: string) => {
      if (isAgg(href)) throw E404();
      return legacy(href);
    });

  it("N pacientes: UMA única chamada ao endpoint agregado, sem carregar pacientes", async () => {
    backendJsonMock.mockResolvedValue({ items: [dto(1, "2026-02-01")], truncated: false, limit: 2000 });
    const loadPatients = vi.fn(async () => pts(50));
    const res = await fetchAggregatedEvolutionsDetailed("2026-01-01", "2026-12-31", loadPatients);
    expect(backendJsonMock).toHaveBeenCalledTimes(1);
    const href = String(backendJsonMock.mock.calls[0][0]);
    expect(href).toContain("evolutions");
    expect(href).toContain("from=2026-01-01");
    expect(href).toContain("to=2026-12-31");
    expect(href).toContain("limit=2000");
    expect(href).not.toContain("patients/");
    expect(loadPatients).not.toHaveBeenCalled();
    expect(res).toMatchObject({ failed: 0, total: 0, truncated: false, limit: 2000 });
  });

  it("mapeia os campos para o tipo Evolucao", async () => {
    backendJsonMock.mockResolvedValue({ items: [dto(5, "2026-02-01")], truncated: false, limit: 2000 });
    const res = await fetchAggregatedEvolutionsDetailed("2026-01-01", "2026-12-31", async () => []);
    expect(res.items[0]).toEqual({
      id: 5,
      patientId: 7,
      patientName: "Ana",
      dataSessao: "2026-02-01",
      horaAtendimento: "09:30",
      tipoSessao: "Fisio",
      sinaisVitaisInicio: "120/80",
      sinaisVitaisFim: undefined,
      objetivosSessao: "obj",
      atividadesRealizadas: "",
      respostaPaciente: "",
      observacoes: "",
      planoProximaSessao: "",
    });
  });

  it("janela > 366 dias é dividida em janelas contíguas, mescladas em dataSessao desc", async () => {
    backendJsonMock.mockImplementation(async (href: string) => {
      const first = href.includes("from=2025-01-01");
      return {
        items: [first ? dto(1, "2025-03-01") : dto(2, "2026-03-01")],
        truncated: false,
        limit: 2000,
      };
    });
    const res = await fetchAggregatedEvolutionsDetailed("2025-01-01", "2026-06-30", async () => []);
    expect(backendJsonMock).toHaveBeenCalledTimes(2);
    expect(res.items.map((e) => e.id)).toEqual([2, 1]);
  });

  it("splitEvolutionRange: janelas de no máximo 366 dias, sem lacunas", () => {
    expect(splitEvolutionRange("2026-01-01", "2026-12-31")).toEqual([
      { from: "2026-01-01", to: "2026-12-31" },
    ]);
    expect(splitEvolutionRange("2024-01-01", "2024-12-31")).toHaveLength(1);
    const w = splitEvolutionRange("2020-01-01", "2026-12-31");
    expect(w[0].from).toBe("2020-01-01");
    expect(w[w.length - 1].to).toBe("2026-12-31");
    const ms = (d: string) => Date.parse(`${d}T00:00:00Z`);
    for (let i = 1; i < w.length; i += 1) {
      expect(ms(w[i].from) - ms(w[i - 1].to)).toBe(86_400_000);
    }
    for (const x of w) {
      expect((ms(x.to) - ms(x.from)) / 86_400_000 + 1).toBeLessThanOrEqual(366);
    }
  });

  it("truncated vira true se qualquer janela truncar", async () => {
    backendJsonMock.mockResolvedValue({ items: [dto(1, "2026-02-01")], truncated: true, limit: 2000 });
    const res = await fetchAggregatedEvolutionsDetailed("2026-01-01", "2026-12-31", async () => []);
    expect(res).toMatchObject({ truncated: true, limit: 2000 });
  });

  it("404 no endpoint agregado: cai no fluxo antigo por paciente", async () => {
    mockLegacyBackend(() => [{ id: 9, patientId: 1, dataSessao: "2026-02-01" }]);
    const loadPatients = vi.fn(async () => pts(3));
    const res = await fetchAggregatedEvolutionsDetailed("2026-01-01", "2026-12-31", loadPatients);
    expect(loadPatients).toHaveBeenCalledTimes(1);
    expect(backendJsonMock).toHaveBeenCalledTimes(4);
    expect(res).toMatchObject({ failed: 0, total: 3, truncated: false });
    expect(res.items).toHaveLength(3);
  });

  it("500 no endpoint agregado NÃO aciona o fallback", async () => {
    backendJsonMock.mockRejectedValue(Object.assign(new Error("x"), { status: 500 }));
    const loadPatients = vi.fn(async () => pts(3));
    await expect(
      fetchAggregatedEvolutionsDetailed("2026-01-01", "2026-12-31", loadPatients),
    ).rejects.toMatchObject({ status: 500 });
    expect(loadPatients).not.toHaveBeenCalled();
    expect(backendJsonMock).toHaveBeenCalledTimes(1);
  });

  it("resposta sem items: erro 502", async () => {
    backendJsonMock.mockResolvedValue({});
    await expect(
      fetchAggregatedEvolutionsDetailed("2026-01-01", "2026-12-31", async () => []),
    ).rejects.toMatchObject({ status: 502 });
  });

  it("fallback limita a concorrência a 6", async () => {
    let inFlight = 0;
    let peak = 0;
    backendJsonMock.mockImplementation(async (href: string) => {
      if (isAgg(href)) throw E404();
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 1));
      inFlight -= 1;
      return [];
    });
    const res = await fetchAggregatedEvolutionsDetailed("2026-01-01", "2026-12-31", async () => pts(30));
    expect(EVOLUTION_AGG_CONCURRENCY).toBe(6);
    expect(peak).toBeLessThanOrEqual(6);
    expect(res).toMatchObject({ failed: 0, total: 30 });
  });

  it("fallback 429: repete uma vez após Retry-After e recupera", async () => {
    vi.useFakeTimers();
    let calls = 0;
    mockLegacyBackend(() => {
      calls += 1;
      if (calls === 1) {
        throw Object.assign(new Error("429"), { status: 429, retryAfterSeconds: 3 });
      }
      return [{ id: 9, patientId: 1, dataSessao: "2026-02-01" }];
    });
    const p = fetchAggregatedEvolutionsDetailed("2026-01-01", "2026-12-31", async () => pts(1));
    await vi.advanceTimersByTimeAsync(2999);
    expect(calls).toBe(1);
    await vi.advanceTimersByTimeAsync(2);
    const res = await p;
    expect(calls).toBe(2);
    expect(res.items).toHaveLength(1);
    expect(res.failed).toBe(0);
  });

  it("fallback 429 persistente: no máximo 1 retry; conta como falha (dados parciais)", async () => {
    vi.useFakeTimers();
    mockLegacyBackend((href) => {
      if (href.includes("patients/2/")) {
        throw Object.assign(new Error("429"), { status: 429 });
      }
      return [{ id: 1, patientId: 1, dataSessao: "2026-02-01" }];
    });
    const p = fetchAggregatedEvolutionsDetailed("2026-01-01", "2026-12-31", async () => pts(2));
    await vi.advanceTimersByTimeAsync(20_000);
    const res = await p;
    expect(backendJsonMock.mock.calls.filter(([h]) => String(h).includes("patients/2/"))).toHaveLength(2);
    expect(res).toMatchObject({ failed: 1, total: 2 });
    expect(res.items).toHaveLength(1);
  });

  it("fallback: erro não-429 não repete", async () => {
    mockLegacyBackend(() => {
      throw Object.assign(new Error("x"), { status: 500 });
    });
    const res = await fetchAggregatedEvolutionsDetailed("2026-01-01", "2026-12-31", async () => pts(3));
    expect(backendJsonMock).toHaveBeenCalledTimes(4);
    expect(res).toMatchObject({ failed: 3, total: 3, items: [] });
  });
});

describe("mapSettledWithConcurrency", () => {
  it("respeita o limite, preserva a ordem e não rejeita", async () => {
    let inFlight = 0;
    let peak = 0;
    const res = await mapSettledWithConcurrency(
      Array.from({ length: 26 }, (_, i) => i),
      6,
      async (i) => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await new Promise((r) => setTimeout(r, 1));
        inFlight -= 1;
        if (i === 3) throw new Error("x");
        return i;
      },
    );
    expect(peak).toBeLessThanOrEqual(6);
    expect(res[3].status).toBe("rejected");
    expect(res[25]).toEqual({ status: "fulfilled", value: 25 });
  });
});

describe("patientHistoryWindows", () => {
  const now = new Date(2026, 10, 16);

  it("paciente cadastrado em 2026 ainda cobre evolução retroativa de 2024", () => {
    const w = patientHistoryWindows("10/02/2026", now);
    expect(w.map((x) => x.from)).toContain("2024-01-01");
    expect(w[0].from).toBe("2016-01-01");
    expect(w[w.length - 1].to).toBe("2027-12-31");
  });

  it("cadastro muito antigo amplia o início (ano anterior ao cadastro)", () => {
    expect(patientHistoryWindows("15/03/2010", now)[0].from).toBe("2009-01-01");
    expect(patientHistoryWindows("2010-03-15", now)[0].from).toBe("2009-01-01");
  });

  it("piso de ano 2000 e teto de janelas", () => {
    const w = patientHistoryWindows("15/03/1990", now);
    expect(w[0].from).toBe("2000-01-01");
    expect(w.length).toBeLessThanOrEqual(30);
    const far = patientHistoryWindows("15/03/2010", new Date(2090, 0, 1));
    expect(far).toHaveLength(30);
    expect(far[far.length - 1].to).toBe("2091-12-31");
  });

  it("data ausente, inválida ou futura é ignorada sem quebrar", () => {
    for (const v of ["", undefined, "abc", "31/02/2020", "99/99/9999", "15/03/2999"]) {
      expect(patientHistoryWindows(v, now)[0].from).toBe("2016-01-01");
    }
  });
});

describe("anamneseTruncatedMessage / canRetryAnamneseLoad", () => {
  it("aviso só quando truncado, citando o limite", () => {
    expect(anamneseTruncatedMessage(false, 500)).toBeNull();
    expect(anamneseTruncatedMessage(true, 500)).toContain("500 anamneses mais recentes");
  });
  it("retry só em erro total, nunca por truncamento", () => {
    expect(canRetryAnamneseLoad(null)).toBe(false);
    expect(canRetryAnamneseLoad(undefined)).toBe(false);
    expect(canRetryAnamneseLoad(new Error("x"))).toBe(true);
  });
});

describe("patientHistoryTruncatedMessage", () => {
  it("lista as coleções cortadas; null se nenhuma", () => {
    expect(
      patientHistoryTruncatedMessage({ anamneses: false, evolucoes: false, appointments: false }),
    ).toBeNull();
    const m = patientHistoryTruncatedMessage({
      anamneses: false,
      evolucoes: true,
      appointments: true,
    });
    expect(m).toContain("evoluções, atendimentos");
    expect(m).not.toContain("anamneses");
  });
});

describe("classifyPatientLoadError", () => {
  it("404 e 403 são não encontrado/sem permissão", () => {
    expect(classifyPatientLoadError({ status: 404 })).toBe("not-found");
    expect(classifyPatientLoadError({ status: 403 })).toBe("not-found");
  });
  it("500, rede e desconhecido são erro (tentar novamente)", () => {
    expect(classifyPatientLoadError({ status: 500 })).toBe("error");
    expect(classifyPatientLoadError({ status: 0 })).toBe("error");
    expect(classifyPatientLoadError(new Error("x"))).toBe("error");
    expect(classifyPatientLoadError(undefined)).toBe("error");
  });
});
