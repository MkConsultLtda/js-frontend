import { z } from "zod";

const text = (max: number) => z.string().trim().max(max, `Máximo de ${max} caracteres`);

export const anamneseFormSchema = z.object({
  patientId: z.string().min(1, "Selecione um paciente"),
  anamneseTexto: text(50000).min(1, "Escreva o conteúdo da anamnese"),
});

export type AnamneseFormValues = z.infer<typeof anamneseFormSchema>;

export function emptyAnamneseForm(pacienteIdFromUrl: string | null): AnamneseFormValues {
  return {
    patientId: pacienteIdFromUrl ?? "",
    anamneseTexto: "",
  };
}
