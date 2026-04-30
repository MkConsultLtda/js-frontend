import { afterEach, describe, expect, it, vi } from "vitest";

import { backendJson } from "@/lib/api/backend-client";

describe("backendJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("204 devolve undefined", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        statusText: "No Content",
        text: async () => "",
      }),
    );
    await expect(backendJson("/api/backend/x")).resolves.toBeUndefined();
  });

  it("200 com corpo vazio devolve undefined", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => "  \n  ",
      }),
    );
    await expect(backendJson("/api/backend/x")).resolves.toBeUndefined();
  });

  it("200 com JSON válido devolve objeto", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => '{"id":1,"name":"a"}',
      }),
    );
    await expect(backendJson("/api/backend/patients/1")).resolves.toEqual({ id: 1, name: "a" });
  });

  it("200 com corpo não-JSON lança erro claro", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => "<html></html>",
      }),
    );
    await expect(backendJson("/api/backend/x")).rejects.toThrow("Resposta inválida da API");
  });

  it("4xx devolve mensagem do JSON de erro", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ message: "Campo inválido" }),
      }),
    );
    await expect(backendJson("/api/backend/x")).rejects.toMatchObject({
      message: "Campo inválido",
      status: 400,
    });
  });
});
