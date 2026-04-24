import { z } from "zod";

const text = (max: number) => z.string().trim().max(max, `Máximo de ${max} caracteres`);

export const userProfileFormSchema = z.object({
  fullName: text(120).min(1, "Informe o nome completo"),
  crefitoNumber: text(32).min(1, "Informe o registro no CREFITO (ex.: 123456-F)"),
  professionalEmail: z.string().trim().email("E-mail inválido").max(120),
  phone: text(32).min(1, "Informe um telefone profissional"),
  professionalTitle: z.string().trim().max(80, "Máximo de 80 caracteres"),
  notes: z.string().trim().max(500, "Máximo de 500 caracteres"),
  photoDataUrl: z.string().max(600_000),
});

export type UserProfileFormValues = z.infer<typeof userProfileFormSchema>;

export function emptyUserProfileForm(): UserProfileFormValues {
  return {
    fullName: "",
    crefitoNumber: "",
    professionalEmail: "",
    phone: "",
    professionalTitle: "",
    notes: "",
    photoDataUrl: "",
  };
}
