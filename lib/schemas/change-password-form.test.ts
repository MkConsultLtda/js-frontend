import { describe, expect, it } from "vitest";

import { changePasswordFormSchema } from "@/lib/schemas/change-password-form";

describe("changePasswordFormSchema", () => {
  it("aceita payload válido de troca de senha", () => {
    const parsed = changePasswordFormSchema.safeParse({
      currentPassword: "SenhaAtual123",
      newPassword: "NovaSenha123",
      confirmNewPassword: "NovaSenha123",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejeita nova senha sem política mínima", () => {
    const parsed = changePasswordFormSchema.safeParse({
      currentPassword: "SenhaAtual123",
      newPassword: "fraca",
      confirmNewPassword: "fraca",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejeita confirmação diferente da nova senha", () => {
    const parsed = changePasswordFormSchema.safeParse({
      currentPassword: "SenhaAtual123",
      newPassword: "NovaSenha123",
      confirmNewPassword: "OutraSenha123",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejeita reutilização da senha atual", () => {
    const parsed = changePasswordFormSchema.safeParse({
      currentPassword: "MesmaSenha123",
      newPassword: "MesmaSenha123",
      confirmNewPassword: "MesmaSenha123",
    });

    expect(parsed.success).toBe(false);
  });
});
