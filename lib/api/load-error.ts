/** 404/403 = recurso inexistente ou sem permissão; qualquer outra falha = erro (permite tentar novamente). */
export function classifyPatientLoadError(error: unknown): "not-found" | "error" {
  const status = (error as { status?: number } | null | undefined)?.status;
  return status === 404 || status === 403 ? "not-found" : "error";
}

/** Aviso quando a lista de anamneses da clínica foi cortada pelo limite; `null` se completa. */
export function anamneseTruncatedMessage(truncated: boolean, limit: number): string | null {
  if (!truncated) return null;
  return `Atenção: a lista mostra só as ${limit} anamneses mais recentes da clínica; as mais antigas não aparecem aqui. Abra o prontuário do paciente para ver o histórico dele.`;
}

/** "Tentar novamente" só em erro total da lista (não no aviso de lista cortada). */
export function canRetryAnamneseLoad(error: unknown): boolean {
  return error != null;
}

/** Aviso quando o histórico do paciente foi cortado; `null` se completo. */
export function patientHistoryTruncatedMessage(t: {
  anamneses: boolean;
  evolucoes: boolean;
  appointments: boolean;
}): string | null {
  const parts = [
    t.anamneses ? "anamneses" : "",
    t.evolucoes ? "evoluções" : "",
    t.appointments ? "atendimentos" : "",
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return `Atenção: o histórico é muito extenso e só os registros mais recentes de ${parts.join(", ")} estão sendo exibidos. Os mais antigos não aparecem aqui.`;
}
