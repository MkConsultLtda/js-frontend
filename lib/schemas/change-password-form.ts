import { z } from "zod";

const passwordPolicyMessage =
  "A senha deve conter no mínimo 8 caracteres, incluindo letra maiúscula, letra minúscula e número.";

const passwordSchema = z
  .string()
  .min(8, passwordPolicyMessage)
  .max(120, "A senha não pode ultrapassar 120 caracteres.")
  .regex(/[A-Z]/, passwordPolicyMessage)
  .regex(/[a-z]/, passwordPolicyMessage)
  .regex(/[0-9]/, passwordPolicyMessage);

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "A confirmação da nova senha não corresponde ao valor informado.",
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    path: ["newPassword"],
    message: "A nova senha deve ser distinta da senha atual.",
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
