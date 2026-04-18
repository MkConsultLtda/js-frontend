import { z } from "zod";

const text = (max: number) => z.string().trim().max(max, `Máximo de ${max} caracteres`);

export const anamneseFormSchema = z.object({
  patientId: z.string().min(1, "Selecione um paciente"),
  queixaPrincipal: text(4000).min(1, "Informe a queixa principal"),
  historiaDoenca: text(8000).min(1, "Informe a história da doença atual"),
  antecedentesFamiliares: text(4000),
  medicamentos: text(4000),
  alergias: text(500),
  habitosVida: text(4000),
  exameFisico: text(8000).min(1, "Informe o exame físico"),
  diagnosticoFisioterapico: text(4000).min(1, "Informe o diagnóstico fisioterapêutico"),
  objetivosTratamento: text(4000).min(1, "Informe os objetivos do tratamento"),
});

export type AnamneseFormValues = z.infer<typeof anamneseFormSchema>;

export function emptyAnamneseForm(pacienteIdFromUrl: string | null): AnamneseFormValues {
  return {
    patientId: pacienteIdFromUrl ?? "",
    queixaPrincipal: "",
    historiaDoenca: "",
    antecedentesFamiliares: "",
    medicamentos: "",
    alergias: "",
    habitosVida: "",
    exameFisico: "",
    diagnosticoFisioterapico: "",
    objetivosTratamento: "",
  };
}
