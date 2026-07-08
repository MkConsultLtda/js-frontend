import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import type { Appointment, Evolucao, Patient } from "@/lib/types";

import {
  apiCreateAppointment,
  apiCreatePatient,
  apiCreateRecurringBlocks,
  apiCreateAnamnese,
  apiCreateEvolution,
  apiDeleteAnamnese,
  apiDeleteAppointment,
  apiDeleteEvolution,
  apiDeletePatient,
  apiDischargePatient,
  apiReplaceAnamnese,
  apiReplaceAppointment,
  apiReplaceEvolution,
  apiReplacePatient,
  fetchAggregatedAnamneses,
  fetchAggregatedEvolutions,
  fetchAppointmentsRange,
  fetchDashboardMetricsBundle,
  fetchHolidays,
  fetchPatientDetailBundle,
  fetchPatientPage,
} from "@/lib/api/fisio-api";
import { apiCreateRecurringSessions } from "@/lib/api/finance-api";
import { fetchAuthMe } from "@/lib/auth-me-api";
import {
  fetchClinicProfile,
  updateClinicProfile,
  type ClinicProfile,
} from "@/lib/clinic-profile-api";

export type DashboardBundle = {
  patients: Patient[];
  appointments: Appointment[];
  evolucoes: Evolucao[];
};

import { toLocalDateString } from "@/lib/date-utils";

async function fetchDashboardBundle(): Promise<DashboardBundle> {
  const anchor = new Date();
  const start = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 2, 0);
  return fetchDashboardMetricsBundle(toLocalDateString(start), toLocalDateString(end));
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

/** Evita que `mutateAsync` rejeite após sucesso da API só porque o refetch pós-invalidate falhou. */
function scheduleInvalidate(qc: QueryClient, tasks: Array<() => ReturnType<QueryClient["invalidateQueries"]>>) {
  for (const t of tasks) {
    void t().catch(() => undefined);
  }
}

export const fisioKeys = {
  patients: (q: string) => ["patients", "list", q] as const,
  dashboard: ["dashboard"] as const,
  holidays: (year: number) => ["holidays", year] as const,
  agenda: (from: string, to: string) => ["appointments", from, to] as const,
  evolutionsAgg: (from: string, to: string) => ["evolutions", from, to] as const,
  anamnesesAgg: ["anamneses", "aggregate"] as const,
  patient: (id: number) => ["patient", id] as const,
  authMe: ["auth-me"] as const,
  clinicProfile: ["clinic-profile"] as const,
};

/** Perfil profissional persistido na API (nome, Crefito, título, telefone). */
export function useAuthMe(enabled = true) {
  return useQuery({
    queryKey: fisioKeys.authMe,
    queryFn: fetchAuthMe,
    enabled,
    staleTime: 60_000,
    retry: (failureCount, error) => {
      const status = (error as Error & { status?: number }).status;
      if (status === 401) return false;
      return failureCount < 2;
    },
  });
}

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

export function useHolidays(year: number) {
  return useQuery({
    queryKey: fisioKeys.holidays(year),
    queryFn: () => fetchHolidays(year),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

/** Bundle para dashboard/métricas: agenda + lista pacientes + evoluções em janela ampla. */
export function useDashboardBundle() {
  const periodKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}`;
  })();
  return useQuery({
    queryKey: [...fisioKeys.dashboard, periodKey],
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
    staleTime: 30_000,
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
  const invalidate = () =>
    scheduleInvalidate(qc, [
      () => qc.invalidateQueries({ queryKey: ["patients"] }),
      () => qc.invalidateQueries({ queryKey: ["patient-bundle"] }),
      () => qc.invalidateQueries({ queryKey: fisioKeys.dashboard }),
    ]);

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
  const dischargePatient = useMutation({
    mutationFn: ({
      id,
      dischargeSummary,
    }: {
      id: number;
      dischargeSummary?: string;
    }) => apiDischargePatient(id, dischargeSummary),
    onSuccess: invalidate,
  });

  return { createPatient, replacePatient, deletePatient, dischargePatient };
}

export function useAgendaMutations(from: string, to: string) {
  const qc = useQueryClient();
  const invalidate = () =>
    scheduleInvalidate(qc, [
      () => qc.invalidateQueries({ queryKey: ["appointments"] }),
      () => qc.invalidateQueries({ queryKey: ["patient-bundle"] }),
      () => qc.invalidateQueries({ queryKey: fisioKeys.dashboard }),
      () => qc.invalidateQueries({ queryKey: fisioKeys.evolutionsAgg(from, to) }),
      () => qc.invalidateQueries({ queryKey: ["finance-summary"] }),
      () => qc.invalidateQueries({ queryKey: ["finance-transactions"] }),
      () => qc.invalidateQueries({ queryKey: ["finance-delinquency"] }),
    ]);

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
  const createRecurringBlocks = useMutation({
    mutationFn: apiCreateRecurringBlocks,
    onSuccess: invalidate,
  });
  const createRecurringSessions = useMutation({
    mutationFn: apiCreateRecurringSessions,
    onSuccess: invalidate,
  });

  return {
    createAppointment,
    replaceAppointment,
    deleteAppointment,
    createRecurringBlocks,
    createRecurringSessions,
  };
}

export function useAnamneseMutations() {
  const qc = useQueryClient();
  const invalidate = () =>
    scheduleInvalidate(qc, [
      () => qc.invalidateQueries({ queryKey: ["anamneses"] }),
      () => qc.invalidateQueries({ queryKey: ["patient-bundle"] }),
      () => qc.invalidateQueries({ queryKey: fisioKeys.dashboard }),
    ]);
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
  const invalidate = () =>
    scheduleInvalidate(qc, [
      () => qc.invalidateQueries({ queryKey: ["evolutions"] }),
      () => qc.invalidateQueries({ queryKey: ["patient-bundle"] }),
      () => qc.invalidateQueries({ queryKey: fisioKeys.evolutionsAgg(evFrom, evTo) }),
      () => qc.invalidateQueries({ queryKey: fisioKeys.dashboard }),
      () => qc.invalidateQueries({ queryKey: ["appointments"] }),
    ]);
  const createEvo = useMutation({ mutationFn: apiCreateEvolution, onSuccess: invalidate });
  const replaceEvo = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      apiReplaceEvolution(id, body),
    onSuccess: invalidate,
  });
  const deleteEvo = useMutation({ mutationFn: apiDeleteEvolution, onSuccess: invalidate });
  return { createEvo, replaceEvo, deleteEvo };
}

/** Dados institucionais da clínica (CNPJ, contato, DPO) persistidos na API. */
export function useClinicProfile(enabled = true) {
  return useQuery({
    queryKey: fisioKeys.clinicProfile,
    queryFn: fetchClinicProfile,
    enabled,
    staleTime: 60_000,
    retry: (failureCount, error) => {
      const status = (error as Error & { status?: number }).status;
      if (status === 401) return false;
      return failureCount < 2;
    },
  });
}

export function useUpdateClinicProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateClinicProfile,
    onSuccess: (data: ClinicProfile) => {
      qc.setQueryData(fisioKeys.clinicProfile, data);
    },
  });
}
