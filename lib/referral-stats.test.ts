import { describe, expect, it } from "vitest";
import { computeReferralStats, topReferralSource } from "@/lib/referral-stats";
import type { Patient } from "@/lib/types";

function patient(partial: Partial<Patient> & Pick<Patient, "id" | "name">): Patient {
  return {
    id: partial.id,
    name: partial.name,
    status: partial.status ?? "active",
    referralSource: partial.referralSource,
    registeredAt: partial.registeredAt ?? "01/01/2026",
    birthDate: partial.birthDate ?? "1990-01-01",
    email: partial.email ?? "",
    phone: partial.phone ?? "",
    diagnosis: partial.diagnosis ?? "",
    address: partial.address ?? {
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      uf: "",
    },
    lastSession: partial.lastSession ?? "",
    totalSessionsPlanned: partial.totalSessionsPlanned ?? 0,
  };
}

describe("computeReferralStats", () => {
  it("agrupa pacientes ativos por origem", () => {
    const stats = computeReferralStats([
      patient({ id: 1, name: "A", referralSource: "Instagram" }),
      patient({ id: 2, name: "B", referralSource: "Instagram" }),
      patient({ id: 3, name: "C", referralSource: "Indicação de paciente" }),
      patient({ id: 4, name: "D", status: "inactive", referralSource: "Google" }),
    ]);

    expect(stats).toHaveLength(2);
    expect(stats[0]).toMatchObject({ label: "Instagram", count: 2, pct: 67 });
    expect(stats[1]).toMatchObject({ label: "Indicação de paciente", count: 1, pct: 33 });
  });

  it("classifica origem vazia como não informado", () => {
    const stats = computeReferralStats([patient({ id: 1, name: "A" })]);
    expect(stats[0].label).toBe("Não informado");
  });
});

describe("topReferralSource", () => {
  it("ignora não informado quando há outra origem", () => {
    const stats = computeReferralStats([
      patient({ id: 1, name: "A" }),
      patient({ id: 2, name: "B", referralSource: "Google" }),
    ]);
    expect(topReferralSource(stats)).toBe("Google");
  });
});
