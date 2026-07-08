import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Scale, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { money } from "@/lib/dashboard-metrics";
import type { FinancialSummary } from "@/lib/api/finance-api";
import type { FinanceScopeFilter } from "@/components/finance/finance-scope-toggle";

type Props = {
  scope: FinanceScopeFilter;
  summary: FinancialSummary | undefined;
  /** Inadimplência já vencida (sessões realizadas/faltas com pagamento pendente). */
  delinquencyTotal: number;
  /** Total a receber no mês com base em sessões agendadas pendentes (inclui futuras). */
  receivableTotal: number;
  loading?: boolean;
};

type SummaryCard = {
  title: string;
  value: string;
  icon: typeof Scale;
  color: string;
};

function pickValues(scope: FinanceScopeFilter, summary: FinancialSummary) {
  if (scope === "professional") {
    return {
      balance: summary.balanceProfessional,
      income: summary.incomeProfessional,
      expense: summary.expenseProfessional,
    };
  }
  if (scope === "personal") {
    return {
      balance: summary.balancePersonal,
      income: summary.incomePersonal,
      expense: summary.expensePersonal,
    };
  }
  return {
    balance: summary.balanceTotal,
    income: summary.incomeTotal,
    expense: summary.expenseTotal,
  };
}

export function FinanceSummaryCards({
  scope,
  summary,
  delinquencyTotal,
  receivableTotal,
  loading,
}: Props) {
  const values = summary ? pickValues(scope, summary) : { balance: 0, income: 0, expense: 0 };

  // Valores a receber de pacientes são inerentemente profissionais; não exibir no escopo "Pessoal".
  const showPatientReceivables = scope !== "personal";

  const cards: SummaryCard[] = [
    { title: "Saldo", value: money(values.balance), icon: Scale, color: "text-chart-2" },
    { title: "Receitas", value: money(values.income), icon: ArrowUpRight, color: "text-chart-4" },
    { title: "Despesas", value: money(values.expense), icon: ArrowDownLeft, color: "text-chart-5" },
  ];

  if (showPatientReceivables) {
    cards.push({
      title: "A receber (mês)",
      value: money(receivableTotal),
      icon: Wallet,
      color: "text-emerald-700 dark:text-emerald-300",
    });
    cards.push({
      title: "Inadimplência",
      value: money(delinquencyTotal),
      icon: AlertTriangle,
      color: "text-orange-700 dark:text-orange-300",
    });
  }

  const gridCols = showPatientReceivables ? "lg:grid-cols-5" : "lg:grid-cols-3";

  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${gridCols}`}>
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <div className={`text-2xl font-bold tabular-nums ${card.color}`}>{card.value}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
