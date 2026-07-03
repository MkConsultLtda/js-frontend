import { ArrowDownLeft, ArrowUpRight, Scale, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { money } from "@/lib/dashboard-metrics";
import type { FinancialSummary } from "@/lib/api/finance-api";
import type { FinanceScopeFilter } from "@/components/finance/finance-scope-toggle";

type Props = {
  scope: FinanceScopeFilter;
  summary: FinancialSummary | undefined;
  delinquencyTotal: number;
  loading?: boolean;
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

export function FinanceSummaryCards({ scope, summary, delinquencyTotal, loading }: Props) {
  const values = summary ? pickValues(scope, summary) : { balance: 0, income: 0, expense: 0 };

  const cards = [
    { title: "Saldo", value: money(values.balance), icon: Scale, color: "text-chart-2" },
    { title: "Receitas", value: money(values.income), icon: ArrowUpRight, color: "text-chart-4" },
    { title: "Despesas", value: money(values.expense), icon: ArrowDownLeft, color: "text-chart-5" },
    { title: "A receber", value: money(delinquencyTotal), icon: Wallet, color: "text-orange-700 dark:text-orange-300" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
