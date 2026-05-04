import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAuthMe, patchAuthProfile } from "@/lib/auth-me-api";

const sampleMe = {
  id: 1,
  email: "login@x.com",
  role: "THERAPIST",
  name: "Nome",
  crefito: "1-F",
  phone: "11999999999",
  professionalTitle: "Fisio",
  professionalEmail: "prof@x.com",
  notes: "n",
  photoDataUrl: "data:image/png;base64,QQ==",
};

describe("fetchAuthMe", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retorna JSON quando 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => sampleMe,
      }),
    );
    await expect(fetchAuthMe()).resolves.toEqual(sampleMe);
  });

  it("lança com status em erro", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: "expirado" }),
      }),
    );
    await expect(fetchAuthMe()).rejects.toMatchObject({
      message: "expirado",
      status: 401,
    });
  });

  it("usa mensagem padrão quando JSON de erro falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("parse");
        },
      }),
    );
    await expect(fetchAuthMe()).rejects.toMatchObject({
      message: "Não foi possível carregar o perfil da conta.",
      status: 500,
    });
  });
});

describe("patchAuthProfile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envia PATCH e retorna corpo", async () => {
    const body = {
      name: "A",
      phone: "",
      crefito: "2-F",
      professionalTitle: "T",
      professionalEmail: "p@x.com",
      notes: "",
      photoDataUrl: "",
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleMe,
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(patchAuthProfile(body)).resolves.toEqual(sampleMe);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/profile",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    );
  });

  it("lança em falha HTTP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: "validação" }),
      }),
    );
    await expect(
      patchAuthProfile({
        name: "A",
        phone: "",
        crefito: "2-F",
        professionalTitle: "T",
        professionalEmail: "bad",
        notes: "",
        photoDataUrl: "",
      }),
    ).rejects.toMatchObject({ message: "validação", status: 400 });
  });

  it("patch usa mensagem padrão quando corpo de erro não é JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => {
          throw new Error("bad json");
        },
      }),
    );
    await expect(
      patchAuthProfile({
        name: "A",
        phone: "",
        crefito: "2-F",
        professionalTitle: "T",
        professionalEmail: "p@x.com",
        notes: "",
        photoDataUrl: "",
      }),
    ).rejects.toMatchObject({
      message: "Não foi possível salvar o perfil na API.",
      status: 502,
    });
  });
});
