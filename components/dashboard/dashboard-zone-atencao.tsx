"use client";

import Link from "next/link";
import { AlertTriangle, Gift, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { birthdayWhenLabel } from "@/lib/birthdays";
import { money, type DashboardMetrics } from "@/lib/dashboard-metrics";
import type { UpcomingBirthday } from "@/lib/birthdays";
import type { PatientNoShowAlert } from "@/lib/patient-treatment";

type Props = {
  metrics: DashboardMetrics;
  birthdays: UpcomingBirthday[];
  noShowAlerts: PatientNoShowAlert[];
};

export function DashboardZoneAtencao({ metrics, birthdays, noShowAlerts }: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Atenção</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-5 w-5 text-chart-4" />
              Aniversariantes da semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            {birthdays.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum aniversariante nos próximos 7 dias.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {birthdays.map((b) => (
                  <li key={b.patientId} className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/pacientes/${b.patientId}`} className="font-medium hover:underline">
                        {b.name}
                      </Link>
                      <span className="text-muted-foreground"> · {b.dayMonthLabel}</span>
                    </div>
                    <span className="shrink-0 rounded-full bg-chart-4/15 px-2 py-1 text-xs font-medium text-chart-4">
                      {birthdayWhenLabel(b.daysUntil)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {noShowAlerts.length > 0 ? (
            <Card className="border-orange-300/60 bg-orange-50/30 dark:border-orange-700/50 dark:bg-orange-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-orange-900 dark:text-orange-100">
                  <AlertTriangle className="h-5 w-5" />
                  Faltas frequentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {noShowAlerts.slice(0, 6).map((a) => (
                    <li key={a.patientId} className="flex flex-wrap justify-between gap-2">
                      <Link href={`/pacientes/${a.patientId}`} className="font-medium hover:underline">
                        {a.patientName}
                      </Link>
                      <span className="text-orange-800 dark:text-orange-200 tabular-nums">
                        {a.rate}% de faltas
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-primary/15">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-5 w-5" />
                Inadimplência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Estimativa a receber no mês:{" "}
                <strong className="text-foreground">{money(metrics.receivableMonth)}</strong>
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/financeiro">Ver detalhes no Financeiro</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
