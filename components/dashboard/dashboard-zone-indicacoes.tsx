"use client";

import { Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeReferralStats, topReferralSource } from "@/lib/referral-stats";
import type { Patient } from "@/lib/types";

type Props = {
  patients: Patient[];
};

export function DashboardZoneIndicacoes({ patients }: Props) {
  const stats = computeReferralStats(patients);
  const topSource = topReferralSource(stats);
  const total = stats.reduce((sum, item) => sum + item.count, 0);
  const maxCount = stats[0]?.count ?? 1;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Indicações</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-5 w-5" />
            Origem dos pacientes ativos
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {total > 0 && topSource
              ? `Principal canal: ${topSource} · ${total} paciente${total > 1 ? "s" : ""} ativo${total > 1 ? "s" : ""}`
              : "Cadastre a origem no prontuário para acompanhar de onde vêm seus pacientes."}
          </p>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum paciente ativo para exibir.
            </p>
          ) : (
            <div className="space-y-4">
              {stats.map((item, index) => {
                const barWidth = Math.max(8, Math.round((item.count / maxCount) * 100));
                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium truncate">{item.label}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {item.count} · {item.pct}%
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-chart-2 via-chart-3 to-chart-4 transition-all"
                        style={{
                          width: `${barWidth}%`,
                          opacity: index === 0 ? 1 : 0.85 - index * 0.08,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
