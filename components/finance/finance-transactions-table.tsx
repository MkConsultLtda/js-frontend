"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { money } from "@/lib/dashboard-metrics";
import type { FinancialTransaction } from "@/lib/api/finance-api";

type Props = {
  transactions: FinancialTransaction[];
  loading?: boolean;
  onDelete: (id: number) => void;
};

const TYPE_LABEL: Record<string, string> = {
  income: "Receita",
  expense: "Despesa",
};

const SCOPE_LABEL: Record<string, string> = {
  professional: "Profissional",
  personal: "Pessoal",
};

export function FinanceTransactionsTable({ transactions, loading, onDelete }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lançamentos do período</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-muted" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum lançamento neste período.</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Data</th>
                <th className="py-2 pr-3 font-medium">Descrição</th>
                <th className="py-2 pr-3 font-medium">Tipo</th>
                <th className="py-2 pr-3 font-medium">Escopo</th>
                <th className="py-2 pr-3 font-medium text-right">Valor</th>
                <th className="py-2 font-medium w-10" />
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border/60">
                  <td className="py-2 pr-3 whitespace-nowrap">{tx.date}</td>
                  <td className="py-2 pr-3 max-w-[200px] truncate">
                    {tx.description || tx.categoryName || tx.patientName || "—"}
                  </td>
                  <td className="py-2 pr-3">{TYPE_LABEL[tx.type] ?? tx.type}</td>
                  <td className="py-2 pr-3">{SCOPE_LABEL[tx.scope] ?? tx.scope}</td>
                  <td
                    className={`py-2 pr-3 text-right tabular-nums font-medium ${
                      tx.type === "income" ? "text-chart-4" : "text-chart-5"
                    }`}
                  >
                    {tx.type === "expense" ? "−" : "+"}
                    {money(tx.amount)}
                  </td>
                  <td className="py-2">
                    {tx.appointmentId != null ? (
                      <span className="text-xs text-muted-foreground" title="Gerenciado pela agenda">
                        Agenda
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => onDelete(tx.id)}
                        aria-label="Excluir lançamento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
