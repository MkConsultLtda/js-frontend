"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Banknote, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { money, type DashboardMetrics } from "@/lib/dashboard-metrics";
import type { FinancialReport } from "@/lib/api/fisio-api";
import { formatDurationMinutes } from "@/lib/patient-treatment";

type Props = {
  metrics: DashboardMetrics;
  financialReport: FinancialReport | undefined;
  financialError: boolean;
  sessionPrice: number;
  onRetryFinancial: () => void;
  financialFetching: boolean;
};

export function DashboardZoneMes({
  metrics,
  financialReport,
  financialError,
  sessionPrice,
  onRetryFinancial,
  financialFetching,
}: Props) {
  const [monthOpen, setMonthOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setMonthOpen(true);
    }
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Mês</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => setMonthOpen((v) => !v)}
        >
          {monthOpen ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Ocultar visão do mês
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Ver visão do mês
            </>
          )}
        </Button>
      </div>

      {monthOpen ? (
        <div className="space-y-4">
          {metrics.avgSessionMinutes != null ? (
            <Card className="border-primary/15">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tempo médio de sessão (mês)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  {formatDurationMinutes(metrics.avgSessionMinutes)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {metrics.monthlyCompleted} atendimento
                  {metrics.monthlyCompleted !== 1 ? "s" : ""} concluído
                  {metrics.monthlyCompleted !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Meta mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-chart-2">{metrics.monthlyGoalPct}%</p>
                <p className="text-xs text-muted-foreground">
                  {money(metrics.monthlyReceived)} de {money(metrics.monthlyGoal)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recebido no mês</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-chart-4">{money(metrics.monthlyReceived)}</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.monthSessionTotal} sessão(ões) na agenda
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cancelamentos no mês</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-chart-4">{metrics.monthlyCancelled}</p>
                <p className="text-xs text-muted-foreground">sessões canceladas</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {(["received", "completed", "cancelled"] as const).map((kind) => (
              <Card key={kind}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {kind === "received"
                      ? "Recebido (gráfico)"
                      : kind === "completed"
                        ? "Concluídos (gráfico)"
                        : "Cancelados (gráfico)"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex h-28 items-end gap-2">
                    {metrics.monthWeekBuckets.map((bucket) => {
                      const height =
                        kind === "received"
                          ? Math.max(8, (bucket.received / Math.max(metrics.monthlyGoal, 1)) * 120)
                          : Math.max(8, (kind === "completed" ? bucket.completed : bucket.cancelled) * 14);
                      const color =
                        kind === "received"
                          ? "bg-chart-1/85"
                          : kind === "completed"
                            ? "bg-chart-2/85"
                            : "bg-chart-4/85";
                      return (
                        <div key={bucket.label} className="flex flex-1 flex-col items-center gap-1">
                          <div className={`w-full rounded-t ${color}`} style={{ height: `${height}px` }} />
                          <span className="text-[10px] text-muted-foreground">{bucket.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {financialError ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-destructive">
                  <Banknote className="h-5 w-5" />
                  Relatório financeiro indisponível
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-destructive/90">
                  Não foi possível carregar o relatório financeiro do mês.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRetryFinancial}
                  disabled={financialFetching}
                >
                  Tentar novamente
                </Button>
              </CardContent>
            </Card>
          ) : financialReport ? (
            <Card className="border-primary/15">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Banknote className="h-5 w-5 text-chart-4" />
                  Financeiro do mês
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Sessões cobráveis com valor de referência de {money(sessionPrice)} por atendimento.{" "}
                  <Link href="/financeiro" className="text-primary underline-offset-4 hover:underline">
                    Ver módulo financeiro
                  </Link>
                </p>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Recebido</p>
                  <p className="text-xl font-bold text-chart-4">{money(financialReport.receivedRevenue)}</p>
                  <p className="text-xs text-muted-foreground">{financialReport.paidSessions} sessão(ões) pagas</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Previsto (cobrável)</p>
                  <p className="text-xl font-bold">{money(financialReport.estimatedRevenue)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pagamentos pendentes</p>
                  <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
                    {financialReport.pendingSessions}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Inadimplência</p>
                  <p className="text-xl font-bold">{financialReport.defaultRate}%</p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
