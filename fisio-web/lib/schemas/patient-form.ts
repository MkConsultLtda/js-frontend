import { z } from "zod";

export const patientCreateFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome completo")
    .max(200, "Nome muito longo"),
  age: z
    .number({ error: "Informe uma idade válida" })
    .int("Use um número inteiro")
    .min(0, "Idade não pode ser negativa")
    .max(130, "Verifique a idade informada"),
  diagnosis: z
    .string()
    .trim()
    .min(1, "Informe o diagnóstico ou quadro clínico")
    .max(500, "Texto muito longo"),
  phone: z.string().trim().max(40, "Telefone muito longo"),
});

export type PatientCreateFormValues = z.infer<typeof patientCreateFormSchema>;

export const patientEditFormSchema = patientCreateFormSchema.extend({
  status: z.enum(["active", "inactive"], {
    error: "Selecione o status",
  }),
});

export type PatientEditFormValues = z.infer<typeof patientEditFormSchema>;
