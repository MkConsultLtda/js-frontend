"use client";

import Link from "next/link";
import { Calendar, CheckCircle2, Clock, ExternalLink, Route, TrendingUp, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { money, sessionStatusBadge, type DashboardMetrics } from "@/lib/dashboard-metrics";
import type { Appointment } from "@/lib/types";
import type { RouteStop } from "@/lib/route-day";

type Props = {
  metrics: DashboardMetrics;
  routeToday: RouteStop[];
  todayList: Appointment[];
};

export function DashboardZoneAgora({ metrics, routeToday, todayList }: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Agora</h2>
      {!metrics.isTodayWorking ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Hoje não está na sua grade de atendimento</p>
          <p className="mt-1 text-amber-900/90">
            Dias configurados: <strong>{metrics.workingDaysLabel}</strong>
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos hoje</CardTitle>
            <Calendar className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1 tabular-nums">
              {metrics.todayActiveSessions}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.cancelledToday > 0
                ? `${metrics.cancelledToday} cancelado${metrics.cancelledToday > 1 ? "s" : ""} no dia`
                : "Sessões ativas (sem cancelamentos)"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor recebido (dia)</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">{money(metrics.receivedToday)}</div>
            <p className="text-xs text-muted-foreground">Pagamentos marcados como pagos hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes ativos</CardTitle>
            <Users className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{metrics.activePatients}</div>
            {metrics.newPatientsThisMonth > 0 ? (
              <p className="text-xs text-muted-foreground">
                +{metrics.newPatientsThisMonth} cadastro
                {metrics.newPatientsThisMonth > 1 ? "s" : ""} neste mês
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo paciente</CardTitle>
            <Clock className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">
              {metrics.nextAppointment ? metrics.nextAppointment.time : "--:--"}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.nextAppointment
                ? `${metrics.nextAppointment.patientName} — ${metrics.nextAppointment.type}`
                : "Nenhum confirmado restante hoje"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Operação do dia</CardTitle>
          <p className="text-sm text-muted-foreground">
            Confirmações, cancelamentos e ocupação da agenda (meta: {metrics.maxSessions} sessões/dia)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-chart-2" />
              <div>
                <p className="text-xs text-muted-foreground">Confirmados</p>
                <p className="text-xl font-bold tabular-nums text-chart-2">{metrics.confirmedToday}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
              <Clock className="h-5 w-5 shrink-0 text-chart-5" />
              <div>
                <p className="text-xs text-muted-foreground">Agendados</p>
                <p className="text-xl font-bold tabular-nums text-chart-5">{metrics.scheduledToday}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
              <XCircle className="h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Cancelados</p>
                <p className="text-xl font-bold tabular-nums text-destructive">{metrics.cancelledToday}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Ocupação da agenda</span>
              <span className="tabular-nums text-muted-foreground">
                {metrics.todayActiveSessions}/{metrics.maxSessions} · {metrics.todayOccupancyPct}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-chart-1 to-chart-2 transition-all"
                style={{ width: `${metrics.todayOccupancyPct}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Route className="h-5 w-5" />
              Rota do dia (domicílio)
            </CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5" />
              Agendamentos de hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayList.map((appointment) => {
                const badge = sessionStatusBadge(appointment.status);
                return (
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
                    <span className={`shrink-0 text-xs px-2 py-1 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
              {todayList.length === 0 ? (
                <p className="text-center py-4 text-sm text-muted-foreground">Nenhum agendamento para hoje</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
