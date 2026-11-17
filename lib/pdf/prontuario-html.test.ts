import { describe, expect, it } from "vitest";

import { buildProntuarioHtml, type ProntuarioPdfData } from "@/lib/pdf/prontuario-html";
import { mapAppointmentFromApi, mapEvolucaoFromApi, mapPatientFromApi } from "@/lib/api/fisio-api";

function data(overrides: Partial<ProntuarioPdfData> = {}): ProntuarioPdfData {
  return {
    clinicTitle: "Clinica",
    generatedAt: "16/11/2026 10:00",
    professional: { name: "Dra", title: "Fisioterapeuta", crefito: "1", signatureImage: "", logoDataUrl: "" },
    patient: mapPatientFromApi({ id: 7, name: "Maria", birthDate: "1990-03-05" }),
    anamneses: [],
    evolucoes: [],
    appointments: [],
    contentHash: "0".repeat(64),
    systemVersion: "v1",
    ...overrides,
  };
}

describe("buildProntuarioHtml - datas", () => {
  it("agenda e evolucao saem em dd/mm/aaaa, nunca em ISO", () => {
    const html = buildProntuarioHtml(
      data({
        appointments: [
          mapAppointmentFromApi({ id: 1, kind: "session", patientId: 7, date: "2026-02-08", time: "09:00:00", type: "Fisio", status: "completed" }),
        ],
        evolucoes: [mapEvolucaoFromApi({ id: 2, patientId: 7, dataSessao: "2026-03-09" })],
      }),
    );
    expect(html).toContain("<td>08/02/2026</td>");
    expect(html).toContain("09/03/2026");
    expect(html).not.toContain("<td>2026-02-08</td>");
  });

  it("agenda sai em ordem cronologica crescente", () => {
    const mk = (id: number, date: string) =>
      mapAppointmentFromApi({ id, kind: "session", patientId: 7, date, time: "09:00", type: "T", status: "completed" });
    const html = buildProntuarioHtml(
      data({ appointments: [mk(2, "2026-05-02"), mk(1, "2025-12-30")] }),
    );
    expect(html.indexOf("30/12/2025")).toBeGreaterThan(-1);
    expect(html.indexOf("30/12/2025")).toBeLessThan(html.indexOf("02/05/2026"));
  });

  it("anamneses ordenam por data real (dd/mm/aaaa), mais recente primeiro, entre anos", () => {
    const mk = (id: number, dataColeta: string) => ({ id, patientId: 7, dataColeta }) as never;
    const html = buildProntuarioHtml(
      data({ anamneses: [mk(1, "10/03/2024"), mk(2, "04/05/2026")] }),
    );
    expect(html.indexOf("Anamnese #2")).toBeGreaterThan(-1);
    expect(html.indexOf("Anamnese #2")).toBeLessThan(html.indexOf("Anamnese #1"));
  });
});
