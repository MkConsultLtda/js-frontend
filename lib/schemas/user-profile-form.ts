import { z } from "zod";

const text = (max: number) =>
  z.string().trim().max(max, `O campo não pode ultrapassar ${max} caracteres.`);

export const userProfileFormSchema = z.object({
  fullName: text(120).min(1, "O nome completo é obrigatório."),
  crefitoNumber: text(32).min(1, "O registro no CREFITO é obrigatório."),
  professionalEmail: z
    .string()
    .trim()
    .email("Informe um endereço de e-mail válido.")
    .max(120),
  phone: text(32).min(1, "O telefone profissional é obrigatório."),
  professionalTitle: text(120).min(1, "O título ou função profissional é obrigatório."),
  notes: z.string().trim().max(500, "As observações não podem ultrapassar 500 caracteres."),
  photoDataUrl: z.string().max(600_000, "A imagem excede o tamanho máximo permitido para armazenamento."),
  signatureImageDataUrl: z
    .string()
    .max(600_000, "A assinatura excede o tamanho máximo permitido para armazenamento."),
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
    signatureImageDataUrl: "",
  };
}
