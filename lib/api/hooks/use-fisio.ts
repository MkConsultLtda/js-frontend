import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Appointment, Evolucao, Patient } from "@/lib/types";

import {
  apiCreateAppointment,
  apiCreatePatient,
  apiCreateAnamnese,
  apiCreateEvolution,
  apiDeleteAnamnese,
  apiDeleteAppointment,
  apiDeleteEvolution,
  apiDeletePatient,
  apiReplaceAnamnese,
  apiReplaceAppointment,
  apiReplaceEvolution,
  apiReplacePatient,
  fetchAggregatedAnamneses,
  fetchAggregatedEvolutions,
  fetchAppointmentsRange,
  fetchDashboardMetricsBundle,
  fetchPatientDetailBundle,
  fetchPatientPage,
} from "@/lib/api/fisio-api";

export type DashboardBundle = {
  patients: Patient[];
  appointments: Appointment[];
  evolucoes: Evolucao[];
};

async function fetchDashboardBundle(): Promise<DashboardBundle> {
  const anchor = new Date();
  const y = anchor.getFullYear();
  const from = `${y}-01-01`;
  const to = `${y}-12-31`;
  return fetchDashboardMetricsBundle(from, to);
}

async function fetchDashboardBundleWithSessionRecovery(): Promise<DashboardBundle> {
  try {
    return await fetchDashboardBundle();
  } catch (e) {
    const status = (e as Error & { status?: number }).status;
    if (status === 401) {
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (refreshRes.ok) return await fetchDashboardBundle();
    }
    throw e;
  }
}

export const fisioKeys = {
  patients: (q: string) => ["patients", "list", q] as const,
  dashboard: ["dashboard"] as const,
  agenda: (from: string, to: string) => ["appointments", from, to] as const,
  evolutionsAgg: (from: string, to: string) => ["evolutions", from, to] as const,
  anamnesesAgg: ["anamneses", "aggregate"] as const,
  patient: (id: number) => ["patient", id] as const,
};

/** Pacientes paginados; `q` repassa ao parâmetro `q` da API Spring. */
export function usePatientDetailBundle(pid: number | undefined) {
  return useQuery({
    queryKey: ["patient-bundle", pid],
    enabled: typeof pid === "number" && Number.isFinite(pid) && pid > 0,
    queryFn: () => fetchPatientDetailBundle(pid as number),
    staleTime: 15_000,
  });
}

export function usePatientsSearch(q: string) {
  return useQuery({
    queryKey: fisioKeys.patients(q),
    queryFn: () => fetchPatientPage({ q: q.trim() || undefined, page: 0, size: 200 }),
    staleTime: 15_000,
  });
}

/** Bundle para dashboard/métricas: agenda + lista pacientes + evoluções em janela ampla. */
export function useDashboardBundle() {
  return useQuery({
    queryKey: fisioKeys.dashboard,
    queryFn: fetchDashboardBundleWithSessionRecovery,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      const status = (error as Error & { status?: number }).status;
      if (status === 401) return false;
      if (status === 408 || status === 429) return failureCount < 1;
      if (status === 0 || status === undefined) return failureCount < 2;
      return status >= 500 && failureCount < 2;
    },
    retryDelay: (i) => Math.min(800 * 2 ** i, 4000),
  });
}

export function useAppointmentRange(from: string, to: string) {
  return useQuery({
    queryKey: fisioKeys.agenda(from, to),
    queryFn: () => fetchAppointmentsRange(from, to),
    staleTime: 10_000,
  });
}

export function useAggregateAnamneses(enabled: boolean) {
  return useQuery({
    queryKey: fisioKeys.anamnesesAgg,
    enabled,
    queryFn: async () => {
      const page = await fetchPatientPage({ size: 500 });
      return fetchAggregatedAnamneses(page.content);
    },
    staleTime: 20_000,
  });
}

export function useAggregateEvoluco(from: string, to: string, enabled: boolean) {
  return useQuery({
    queryKey: fisioKeys.evolutionsAgg(from, to),
    enabled,
    queryFn: async () => {
      const page = await fetchPatientPage({ size: 500 });
      return fetchAggregatedEvolutions(page.content, from, to);
    },
    staleTime: 20_000,
  });
}

/** --- Mutations com inval. de queries --- */

export function usePatientMutations() {
  const qc = useQueryClient();
  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["patients"] });
    await qc.invalidateQueries({ queryKey: ["patient-bundle"] });
    await qc.invalidateQueries({ queryKey: fisioKeys.dashboard });
  };

  const createPatient = useMutation({
    mutationFn: apiCreatePatient,
    onSuccess: invalidate,
  });
  const replacePatient = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      apiReplacePatient(id, body),
    onSuccess: invalidate,
  });
  const deletePatient = useMutation({
    mutationFn: apiDeletePatient,
    onSuccess: invalidate,
  });

  return { createPatient, replacePatient, deletePatient };
}

export function useAgendaMutations(from: string, to: string) {
  const qc = useQueryClient();
  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["appointments"] });
    await qc.invalidateQueries({ queryKey: ["patient-bundle"] });
    await qc.invalidateQueries({ queryKey: fisioKeys.dashboard });
    await qc.invalidateQueries({ queryKey: fisioKeys.evolutionsAgg(from, to) });
  };

  const createAppointment = useMutation({
    mutationFn: (input: { body: Record<string, unknown>; allowOverlap?: boolean }) =>
      apiCreateAppointment(input.body, { allowOverlap: input.allowOverlap }),
    onSuccess: invalidate,
  });
  const replaceAppointment = useMutation({
    mutationFn: (input: { id: number; body: Record<string, unknown>; allowOverlap?: boolean }) =>
      apiReplaceAppointment(input.id, input.body, { allowOverlap: input.allowOverlap }),
    onSuccess: invalidate,
  });
  const deleteAppointment = useMutation({
    mutationFn: apiDeleteAppointment,
    onSuccess: invalidate,
  });

  return { createAppointment, replaceAppointment, deleteAppointment };
}

export function useAnamneseMutations() {
  const qc = useQueryClient();
  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["anamneses"] });
    await qc.invalidateQueries({ queryKey: ["patient-bundle"] });
    await qc.invalidateQueries({ queryKey: fisioKeys.dashboard });
  };
  const createAnam = useMutation({ mutationFn: apiCreateAnamnese, onSuccess: invalidate });
  const replaceAnam = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      apiReplaceAnamnese(id, body),
    onSuccess: invalidate,
  });
  const deleteAnam = useMutation({ mutationFn: apiDeleteAnamnese, onSuccess: invalidate });
  return { createAnam, replaceAnam, deleteAnam };
}

export function useEvolucoMutations(evFrom: string, evTo: string) {
  const qc = useQueryClient();
  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["evolutions"] });
    await qc.invalidateQueries({ queryKey: ["patient-bundle"] });
    await qc.invalidateQueries({ queryKey: fisioKeys.evolutionsAgg(evFrom, evTo) });
    await qc.invalidateQueries({ queryKey: fisioKeys.dashboard });
    await qc.invalidateQueries({ queryKey: ["appointments"] });
  };
  const createEvo = useMutation({ mutationFn: apiCreateEvolution, onSuccess: invalidate });
  const replaceEvo = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      apiReplaceEvolution(id, body),
    onSuccess: invalidate,
  });
  const deleteEvo = useMutation({ mutationFn: apiDeleteEvolution, onSuccess: invalidate });
  return { createEvo, replaceEvo, deleteEvo };
}
