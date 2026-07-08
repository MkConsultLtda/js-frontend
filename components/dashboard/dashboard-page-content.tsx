"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DashboardZoneAgora } from "@/components/dashboard/dashboard-zone-agora";
import { DashboardZoneAtencao } from "@/components/dashboard/dashboard-zone-atencao";
import { DashboardZoneIndicacoes } from "@/components/dashboard/dashboard-zone-indicacoes";
import { DashboardZoneMes } from "@/components/dashboard/dashboard-zone-mes";
import { DashboardZoneSemana } from "@/components/dashboard/dashboard-zone-semana";
import { useDashboardBundle } from "@/lib/api/hooks/use-fisio";
import { fetchFinancialReport } from "@/lib/api/fisio-api";
import { useClinicSettings } from "@/lib/clinic-settings";
import { getUpcomingBirthdays } from "@/lib/birthdays";
import { computeDashboardMetrics } from "@/lib/dashboard-metrics";
import { buildRouteForDate } from "@/lib/route-day";
import { toLocalDateString } from "@/lib/date-utils";
import { patientsWithHighNoShowRate } from "@/lib/patient-treatment";
import { isSessionAppointment } from "@/lib/types";
import type { Appointment, Evolucao, Patient } from "@/lib/types";

export function DashboardPageContent() {
  const {
    data: dash,
    error: dashError,
    isRefetchError,
    isLoadingError,
    isLoading,
    refetch,
    isFetching,
  } = useDashboardBundle();
  const { settings } = useClinicSettings();

  const patients: Patient[] = useMemo(() => dash?.patients ?? [], [dash]);
  const appointments: Appointment[] = useMemo(() => dash?.appointments ?? [], [dash]);
  const evolucoes: Evolucao[] = useMemo(() => dash?.evolucoes ?? [], [dash]);

  const monthRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: toLocalDateString(start), to: toLocalDateString(end) };
  }, []);

  const {
    data: financialReport,
    isError: financialError,
    refetch: refetchFinancial,
    isFetching: financialFetching,
  } = useQuery({
    queryKey: ["financial-report", monthRange.from, monthRange.to, settings.sessionPrice],
    queryFn: () =>
      fetchFinancialReport(monthRange.from, monthRange.to, settings.sessionPrice),
    staleTime: 60_000,
  });

  const metrics = useMemo(
    () => computeDashboardMetrics(patients, appointments, evolucoes, settings),
    [patients, appointments, evolucoes, settings],
  );

  const routeToday = useMemo(
    () => buildRouteForDate(metrics.today, appointments, patients),
    [metrics.today, appointments, patients],
  );

  const todayList = useMemo(
    () =>
      appointments
        .filter((apt) => isSessionAppointment(apt) && apt.date === metrics.today)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, metrics.today],
  );

  const birthdays = useMemo(() => getUpcomingBirthdays(patients), [patients]);
  const noShowAlerts = useMemo(
    () => patientsWithHighNoShowRate(patients, appointments, 30),
    [patients, appointments],
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-10">
      {isRefetchError && dashError ? (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
          <p>Dados podem estar desatualizados. Falha ao atualizar em segundo plano.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            Tentar novamente
          </Button>
        </div>
      ) : null}
      {!isRefetchError && isLoadingError && dashError ? (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
          <p>Não foi possível carregar o painel. Verifique a conexão e a sessão.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            Tentar novamente
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo — {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/agenda">Nova sessão</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/pacientes">Novo paciente</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <DashboardZoneAgora metrics={metrics} routeToday={routeToday} todayList={todayList} />
          <DashboardZoneAtencao metrics={metrics} birthdays={birthdays} noShowAlerts={noShowAlerts} />
          <DashboardZoneIndicacoes patients={patients} />
          <DashboardZoneSemana metrics={metrics} />
          <DashboardZoneMes
            metrics={metrics}
            financialReport={financialReport}
            financialError={financialError}
            sessionPrice={settings.sessionPrice}
            onRetryFinancial={() => void refetchFinancial()}
            financialFetching={financialFetching}
          />
        </>
      )}
    </div>
  );
}
