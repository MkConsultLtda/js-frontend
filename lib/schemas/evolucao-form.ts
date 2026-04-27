import { z } from "zod";
import { toLocalDateString } from "@/lib/date-utils";

const text = (max: number) => z.string().trim().max(max, `Máximo de ${max} caracteres`);

export const evolucaoFormSchema = z.object({
  patientId: z.string().min(1, "Selecione um paciente"),
  dataSessao: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida"),
  tipoSessao: z.string().min(1, "Selecione o tipo de sessão"),
  sinaisVitaisInicio: text(500),
  sinaisVitaisFim: text(500),
  objetivosSessao: text(4000).min(1, "Informe os objetivos da sessão"),
  atividadesRealizadas: text(8000).min(1, "Descreva as atividades realizadas"),
  respostaPaciente: text(4000).min(1, "Informe a resposta do paciente"),
  dorPre: z
    .number({ error: "Informe a dor pré-sessão (0 a 10)" })
    .int()
    .min(0, "Mínimo 0")
    .max(10, "Máximo 10"),
  dorPos: z
    .number({ error: "Informe a dor pós-sessão (0 a 10)" })
    .int()
    .min(0, "Mínimo 0")
    .max(10, "Máximo 10"),
  observacoes: text(8000),
  planoProximaSessao: text(4000),
});

export type EvolucaoFormValues = z.infer<typeof evolucaoFormSchema>;

export function emptyEvolucaoForm(pacienteIdFromUrl: string | null): EvolucaoFormValues {
  return {
    patientId: pacienteIdFromUrl ?? "",
    dataSessao: toLocalDateString(new Date()),
    tipoSessao: "",
    sinaisVitaisInicio: "",
    sinaisVitaisFim: "",
    objetivosSessao: "",
    atividadesRealizadas: "",
    respostaPaciente: "",
    dorPre: 0,
    dorPos: 0,
    observacoes: "",
    planoProximaSessao: "",
  };
}
