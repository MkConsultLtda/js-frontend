import { z } from "zod";

const passwordPolicyMessage = "Use ao menos 8 caracteres, com maiúscula, minúscula e número";

const passwordSchema = z
  .string()
  .min(8, passwordPolicyMessage)
  .max(120, "Máximo de 120 caracteres")
  .regex(/[A-Z]/, passwordPolicyMessage)
  .regex(/[a-z]/, passwordPolicyMessage)
  .regex(/[0-9]/, passwordPolicyMessage);

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "A confirmação não confere",
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    path: ["newPassword"],
    message: "A nova senha deve ser diferente da senha atual",
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
