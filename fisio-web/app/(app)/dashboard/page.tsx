"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMockData } from "@/components/mock-data-provider";
import { useClinicSettings } from "@/lib/clinic-settings";
import { buildRouteForDate } from "@/lib/route-day";
import { brDateToIsoDate, startOfWeekMonday, toLocalDateString } from "@/lib/date-utils";
import {
  countAppointmentsByWorkingWeekdays,
  formatWorkingDaysShort,
  isWorkingDateKey,
} from "@/lib/schedule-utils";
import { isSessionAppointment } from "@/lib/types";
import { Users, Calendar, Clock, Activity, TrendingUp, Route, ExternalLink, BarChart3 } from "lucide-react";
import { useMemo } from "react";

function money(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });
}

export default function DashboardPage() {
  const { patients, appointments, evolucoes } = useMockData();
  const { settings } = useClinicSettings();

  const metrics = useMemo(() => {
    const now = new Date();
    const today = toLocalDateString(now);
    const sessions = appointments.filter(isSessionAppointment);
    const todayAppointments = sessions.filter((apt) => apt.date === today);
    const confirmedToday = todayAppointments.filter(
      (apt) => apt.status === "confirmed"
    ).length;

    const activePatients = patients.filter((p) => p.status === "active").length;

    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const newPatientsThisMonth = patients.filter((p) =>
      p.registeredAt.startsWith(ym)
    ).length;

    const nextAppointment = todayAppointments
      .filter((apt) => apt.status === "confirmed")
      .sort((a, b) => a.time.localeCompare(b.time))
      .find((apt) => {
        const aptTime = new Date(`${today}T${apt.time}`);
        return aptTime > now;
      });

    const weekBars = countAppointmentsByWorkingWeekdays(
      sessions,
      now,
      settings.workingWeekdays
    );
    const isTodayWorking = isWorkingDateKey(today, settings.workingWeekdays);
    const workingDaysLabel = formatWorkingDaysShort(settings.workingWeekdays);
    const maxSessions = Math.max(1, settings.maxSessionsPerDay);
    const sessionPrice = Math.max(0, settings.sessionPrice || 0);

    const receivedToday = todayAppointments.filter((apt) => apt.paymentStatus === "paid").length * sessionPrice;
    const cancelledToday = todayAppointments.filter((apt) => apt.status === "cancelled").length;

    const weekStart = startOfWeekMonday(now);
    const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
    const weekStartIso = toLocalDateString(weekStart);
    const weekEndIso = toLocalDateString(weekEnd);
    const weeklySessions = sessions.filter((apt) => {
      const date = new Date(`${apt.date}T12:00:00`);
      return date >= weekStart && date <= weekEnd;
    });
    const weeklyReceived = weeklySessions.filter((apt) => apt.paymentStatus === "paid").length * sessionPrice;
    const weeklyCancelled = weeklySessions.filter((apt) => apt.status === "cancelled").length;
    const weeklyCompleted = weeklySessions.filter((apt) => apt.status === "completed").length;

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthStartIso = toLocalDateString(monthStart);
    const monthEndIso = toLocalDateString(monthEnd);
    const monthlySessions = sessions.filter((apt) => {
      const date = new Date(`${apt.date}T12:00:00`);
      return date >= monthStart && date <= monthEnd;
    });
    const monthlyReceived = monthlySessions.filter((apt) => apt.paymentStatus === "paid").length * sessionPrice;
    const monthlyCompleted = monthlySessions.filter((apt) => apt.status === "completed").length;
    const monthlyCancelled = monthlySessions.filter((apt) => apt.status === "cancelled").length;
    const monthlyGoal = Math.max(1, settings.monthlyRevenueGoal || 0);
    const monthlyGoalPct = Math.min(999, Math.round((monthlyReceived / monthlyGoal) * 100));

    const monthWeekBuckets = [1, 2, 3, 4, 5].map((w) => ({
      label: `S${w}`,
      received: 0,
      completed: 0,
      cancelled: 0,
    }));
    for (const apt of monthlySessions) {
      const date = new Date(`${apt.date}T12:00:00`);
      const day = date.getDate();
      const bucketIndex = Math.min(4, Math.floor((day - 1) / 7));
      const bucket = monthWeekBuckets[bucketIndex];
      if (apt.paymentStatus === "paid") bucket.received += sessionPrice;
      if (apt.status === "completed") bucket.completed += 1;
      if (apt.status === "cancelled") bucket.cancelled += 1;
    }

    const countEvolucoesInIsoRange = (startIso: string, endIso: string) =>
      evolucoes.filter((ev) => {
        const iso = brDateToIsoDate(ev.dataSessao);
        return iso !== null && iso >= startIso && iso <= endIso;
      }).length;

    const evolucoesHoje = countEvolucoesInIsoRange(today, today);
    const evolucoesSemana = countEvolucoesInIsoRange(weekStartIso, weekEndIso);
    const evolucoesMes = countEvolucoesInIsoRange(monthStartIso, monthEndIso);

    const todayCompleted = todayAppointments.filter((apt) => apt.status === "completed").length;
    const pendingReceivable = (apts: typeof todayAppointments) =>
      apts.filter((apt) => apt.status !== "cancelled" && apt.paymentStatus === "pending").length *
      sessionPrice;
    const receivableToday = pendingReceivable(todayAppointments);
    const receivableWeek = pendingReceivable(weeklySessions);
    const receivableMonth = pendingReceivable(monthlySessions);

    return {
      appointmentsToday: todayAppointments.length,
      confirmedToday,
      activePatients,
      newPatientsThisMonth,
      nextAppointment,
      weekBars,
      today,
      isTodayWorking,
      workingDaysLabel,
      maxSessions,
      receivedToday,
      cancelledToday,
      weeklyReceived,
      weeklyCancelled,
      weeklyCompleted,
      monthlyReceived,
      monthlyCompleted,
      monthlyCancelled,
      monthlyGoal,
      monthlyGoalPct,
      monthWeekBuckets,
      evolucoesHoje,
      evolucoesSemana,
      evolucoesMes,
      todayCompleted,
      receivableToday,
      receivableWeek,
      receivableMonth,
      weekSessionTotal: weeklySessions.length,
      monthSessionTotal: monthlySessions.length,
    };
  }, [
    patients,
    appointments,
    evolucoes,
    settings.workingWeekdays,
    settings.maxSessionsPerDay,
    settings.monthlyRevenueGoal,
    settings.sessionPrice,
  ]);

  const routeToday = useMemo(
    () => buildRouteForDate(metrics.today, appointments, patients),
    [metrics.today, appointments, patients]
  );

  const todayList = useMemo(() => {
    return appointments
      .filter((apt) => isSessionAppointment(apt) && apt.date === metrics.today)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, metrics.today]);

  const referralChartData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const patient of patients) {
      const key = patient.referralSource?.trim() || "Não informado";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const total = Math.max(1, patients.length);
    return [...counts.entries()]
      .map(([label, count]) => ({
        label,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [patients]);

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel de controle —{" "}
            {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/agenda">Nova sessão</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/pacientes">Novo paciente</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
            <Link href="/configuracoes">Dias de atendimento</Link>
          </Button>
        </div>
      </div>

      {!metrics.isTodayWorking && (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <p className="font-medium">Hoje não está na sua grade de atendimento</p>
          <p className="mt-1 text-amber-900/90">
            Seus dias configurados: <strong>{metrics.workingDaysLabel}</strong>. O gráfico da semana
            abaixo mostra só esses dias; os cartões de hoje refletem a data real do calendário
            (útil se houver visita excepcional).
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.appointmentsToday}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.confirmedToday > 0 &&
                `+${metrics.confirmedToday} confirmado${metrics.confirmedToday > 1 ? "s" : ""}`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor recebido (dia)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money(metrics.receivedToday)}</div>
            <p className="text-xs text-muted-foreground">Pagamentos marcados como pagos hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activePatients}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.newPatientsThisMonth > 0 &&
                `+${metrics.newPatientsThisMonth} cadastro${metrics.newPatientsThisMonth > 1 ? "s" : ""} neste mês`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo paciente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.nextAppointment ? metrics.nextAppointment.time : "--:--"}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.nextAppointment
                ? `${metrics.nextAppointment.patientName} — ${metrics.nextAppointment.type}`
                : "Nenhum agendamento confirmado restante hoje"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo: hoje, semana e mês</CardTitle>
          <p className="text-sm text-muted-foreground">
            Mesmos dados da Agenda e da{" "}
            <Link href="/evolucao" className="text-primary underline-offset-4 hover:underline">
              Evolução
            </Link>{" "}
            (mock local). A semana vai de segunda a domingo. As evoluções usam a{" "}
            <strong>data da sessão</strong> informada no registro.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Métrica</th>
                <th className="py-2 pr-4 font-medium">Hoje</th>
                <th className="py-2 pr-4 font-medium">Semana</th>
                <th className="py-2 font-medium">Mês</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 text-muted-foreground">Sessões na agenda (total)</td>
                <td className="py-2 pr-4 font-medium tabular-nums">{metrics.appointmentsToday}</td>
                <td className="py-2 pr-4 font-medium tabular-nums">{metrics.weekSessionTotal}</td>
                <td className="py-2 font-medium tabular-nums">{metrics.monthSessionTotal}</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 text-muted-foreground">Concluídas</td>
                <td className="py-2 pr-4 font-medium tabular-nums">{metrics.todayCompleted}</td>
                <td className="py-2 pr-4 font-medium tabular-nums">{metrics.weeklyCompleted}</td>
                <td className="py-2 font-medium tabular-nums">{metrics.monthlyCompleted}</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 text-muted-foreground">Canceladas</td>
                <td className="py-2 pr-4 font-medium tabular-nums">{metrics.cancelledToday}</td>
                <td className="py-2 pr-4 font-medium tabular-nums">{metrics.weeklyCancelled}</td>
                <td className="py-2 font-medium tabular-nums">{metrics.monthlyCancelled}</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 text-muted-foreground">Evoluções registradas</td>
                <td className="py-2 pr-4 font-medium tabular-nums">{metrics.evolucoesHoje}</td>
                <td className="py-2 pr-4 font-medium tabular-nums">{metrics.evolucoesSemana}</td>
                <td className="py-2 font-medium tabular-nums">{metrics.evolucoesMes}</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 text-muted-foreground">Recebido (pagas)</td>
                <td className="py-2 pr-4 font-medium tabular-nums">{money(metrics.receivedToday)}</td>
                <td className="py-2 pr-4 font-medium tabular-nums">{money(metrics.weeklyReceived)}</td>
                <td className="py-2 font-medium tabular-nums">{money(metrics.monthlyReceived)}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-muted-foreground">A receber (pendentes, estimado)</td>
                <td className="py-2 pr-4 font-medium tabular-nums">{money(metrics.receivableToday)}</td>
                <td className="py-2 pr-4 font-medium tabular-nums">{money(metrics.receivableWeek)}</td>
                <td className="py-2 font-medium tabular-nums">{money(metrics.receivableMonth)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Semana atual
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Dias: {metrics.workingDaysLabel} (definido em Configurações)
            </p>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="space-y-4">
              <div className="flex items-end justify-between h-32 gap-2">
                {metrics.weekBars.map((day) => {
                  const height = Math.max(day.count * 20, 10);
                  return (
                    <div key={day.dateKey} className="flex flex-col items-center gap-2 flex-1">
                      <div
                        className="bg-primary rounded-t w-full transition-all hover:opacity-80"
                        style={{ height: `${height}px` }}
                      />
                      <span className="text-xs text-muted-foreground">{day.label}</span>
                      <span className="text-xs font-medium">{day.count}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">
                Agendamentos por dia nesta semana (dados mock compartilhados com a Agenda)
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Agendamentos de hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayList.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">
                      <Link href={`/pacientes/${appointment.patientId}`} className="hover:underline">
                        {appointment.patientName}
                      </Link>
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {appointment.time} — {appointment.type}
                    </p>
                  </div>
                  <div
                    className={`shrink-0 text-xs px-2 py-1 rounded-full ${
                      appointment.status === "confirmed"
                        ? "bg-sky-100 text-sky-900"
                        : appointment.status === "scheduled"
                          ? "bg-amber-100 text-amber-900"
                          : appointment.status === "completed"
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-red-100 text-red-800 line-through"
                    }`}
                  >
                    {appointment.status === "confirmed"
                      ? "Confirmado"
                      : appointment.status === "scheduled"
                        ? "Agendado"
                        : appointment.status === "completed"
                          ? "Concluído"
                          : "Cancelado"}
                  </div>
                </div>
              ))}
              {todayList.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum agendamento para hoje</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Route className="h-5 w-5" />
            Rota do dia (domicílio)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ordem sugerida por CEP para visitas hoje — exceto cancelados. Abre o mapa em nova aba.
            {!metrics.isTodayWorking && " Se hoje não é dia de expediente, a lista pode ser vazia ou excepcional."}
          </p>
        </CardHeader>
        <CardContent>
          {routeToday.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma visita agendada para hoje.</p>
          ) : (
            <ol className="space-y-3 text-sm">
              {routeToday.map((stop, index) => (
                <li
                  key={stop.appointment.id}
                  className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0 space-y-1">
                    <span className="font-semibold text-muted-foreground">{index + 1}.</span>{" "}
                    <span className="font-medium">{stop.appointment.patientName}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {stop.appointment.time} · CEP {stop.cepSortKey}
                    </span>
                    {stop.patient ? (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {stop.patient.address.bairro}, {stop.patient.address.cidade} —{" "}
                        {stop.appointment.type}
                      </p>
                    ) : null}
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0 gap-1" asChild>
                    <a href={stop.mapsUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Mapa
                    </a>
                  </Button>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Financeiro semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{money(metrics.weeklyReceived)}</p>
            <p className="text-xs text-muted-foreground">Sessões pagas da semana atual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelamentos semanais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-600">{metrics.weeklyCancelled}</p>
            <p className="text-xs text-muted-foreground">Sessões canceladas na semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Meta mensal financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-violet-600">{metrics.monthlyGoalPct}%</p>
            <p className="text-xs text-muted-foreground">
              {money(metrics.monthlyReceived)} de {money(metrics.monthlyGoal)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Financeiro mensal (gráfico)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex h-28 items-end gap-2">
              {metrics.monthWeekBuckets.map((bucket) => {
                const height = Math.max(8, (bucket.received / Math.max(metrics.monthlyGoal, 1)) * 120);
                return (
                  <div key={bucket.label} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-emerald-500/80" style={{ height: `${height}px` }} />
                    <span className="text-[10px] text-muted-foreground">{bucket.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">Total do mês: {money(metrics.monthlyReceived)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Concluídos no mês (gráfico)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex h-28 items-end gap-2">
              {metrics.monthWeekBuckets.map((bucket) => {
                const height = Math.max(8, bucket.completed * 14);
                return (
                  <div key={bucket.label} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-cyan-500/80" style={{ height: `${height}px` }} />
                    <span className="text-[10px] text-muted-foreground">{bucket.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total concluídos: {metrics.monthlyCompleted} sessão(ões)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelamentos no mês (gráfico)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex h-28 items-end gap-2">
              {metrics.monthWeekBuckets.map((bucket) => {
                const height = Math.max(8, bucket.cancelled * 14);
                return (
                  <div key={bucket.label} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-rose-500/80" style={{ height: `${height}px` }} />
                    <span className="text-[10px] text-muted-foreground">{bucket.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total cancelados: {metrics.monthlyCancelled} sessão(ões)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Confirmações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(
                (metrics.confirmedToday / Math.max(metrics.appointmentsToday, 1)) * 100
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Confirmados entre os agendamentos de hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              Ocupação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((metrics.appointmentsToday / metrics.maxSessions) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Referência: até {metrics.maxSessions} sessões/dia (Configurações)
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-violet-500" />
              Indicação de pacientes
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Origem dos pacientes ativos e inativos cadastrados no sistema.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {referralChartData.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.count} paciente(s) · {item.percentage}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500/75 via-cyan-500/70 to-emerald-500/70"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
