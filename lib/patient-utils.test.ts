import { describe, expect, it } from "vitest";
import {
  ageFromBirthDateIso,
  formatAddressOneLine,
  formatCepDisplay,
} from "@/lib/patient-utils";

describe("formatCepDisplay", () => {
  it("formata 8 dígitos", () => {
    expect(formatCepDisplay("01310100")).toBe("01310-100");
  });
});

describe("ageFromBirthDateIso", () => {
  it("retorna 0 para data inválida", () => {
    expect(ageFromBirthDateIso("")).toBe(0);
  });
});

describe("formatAddressOneLine", () => {
  it("monta linha com complemento opcional", () => {
    const line = formatAddressOneLine({
      cep: "01310100",
      logradouro: "Av. Paulista",
      numero: "1000",
      complemento: "Apto 1",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      uf: "sp",
    });
    expect(line).toContain("Paulista");
    expect(line).toContain("CEP 01310-100");
  });
});
