import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { money, type DashboardMetrics } from "@/lib/dashboard-metrics";

type Props = {
  metrics: DashboardMetrics;
};

export function DashboardZoneSemana({ metrics }: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Semana</h2>
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5" />
              Semana atual
            </CardTitle>
            <p className="text-sm text-muted-foreground">Dias: {metrics.workingDaysLabel}</p>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="flex items-end justify-between h-32 gap-2">
              {metrics.weekBars.map((day) => (
                <div key={day.dateKey} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className="bg-primary rounded-t w-full transition-all hover:opacity-80"
                    style={{ height: `${Math.max(day.count * 20, 10)}px` }}
                  />
                  <span className="text-xs text-muted-foreground">{day.label}</span>
                  <span className="text-xs font-medium">{day.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Resumo: hoje, semana e mês</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
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
                  <td className="py-2 pr-4 text-muted-foreground">Sessões</td>
                  <td className="py-2 pr-4 tabular-nums">{metrics.appointmentsToday}</td>
                  <td className="py-2 pr-4 tabular-nums">{metrics.weekSessionTotal}</td>
                  <td className="py-2 tabular-nums">{metrics.monthSessionTotal}</td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="py-2 pr-4 text-muted-foreground">Concluídas</td>
                  <td className="py-2 pr-4 tabular-nums">{metrics.todayCompleted}</td>
                  <td className="py-2 pr-4 tabular-nums">{metrics.weeklyCompleted}</td>
                  <td className="py-2 tabular-nums">{metrics.monthlyCompleted}</td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="py-2 pr-4 text-muted-foreground">Recebido</td>
                  <td className="py-2 pr-4 tabular-nums">{money(metrics.receivedToday)}</td>
                  <td className="py-2 pr-4 tabular-nums">{money(metrics.weeklyReceived)}</td>
                  <td className="py-2 tabular-nums">{money(metrics.monthlyReceived)}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-muted-foreground">Evoluções</td>
                  <td className="py-2 pr-4 tabular-nums">{metrics.evolucoesHoje}</td>
                  <td className="py-2 pr-4 tabular-nums">{metrics.evolucoesSemana}</td>
                  <td className="py-2 tabular-nums">{metrics.evolucoesMes}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
