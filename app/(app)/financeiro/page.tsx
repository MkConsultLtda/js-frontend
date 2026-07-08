"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FinanceCategoryDialog } from "@/components/finance/finance-category-dialog";
import { FinanceScopeToggle, type FinanceScopeFilter } from "@/components/finance/finance-scope-toggle";
import { FinanceSummaryCards } from "@/components/finance/finance-summary-cards";
import { FinanceTransactionDialog } from "@/components/finance/finance-transaction-dialog";
import { FinanceTransactionsTable } from "@/components/finance/finance-transactions-table";
import { formatUserFacingApiError } from "@/lib/api/backend-client";
import {
  createFinanceTransaction,
  createFinanceCategory,
  deleteFinanceTransaction,
  fetchFinanceCategories,
  fetchFinanceDelinquency,
  fetchFinanceSummary,
  fetchFinanceTransactions,
  type FinancialScope,
} from "@/lib/api/finance-api";
import { toLocalDateString } from "@/lib/date-utils";

function currentMonthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { from: toLocalDateString(start), to: toLocalDateString(end) };
}

function monthLabel(from: string) {
  const [y, m] = from.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default function FinanceiroPage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [scope, setScope] = useState<FinanceScopeFilter>("professional");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const range = useMemo(() => currentMonthRange(monthOffset), [monthOffset]);
  const queryScope = scope === "all" ? undefined : (scope as FinancialScope);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["finance-summary", range.from, range.to],
    queryFn: () => fetchFinanceSummary(range.from, range.to),
    staleTime: 30_000,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["finance-transactions", range.from, range.to, queryScope],
    queryFn: () => fetchFinanceTransactions(range.from, range.to, queryScope),
    staleTime: 30_000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["finance-categories"],
    queryFn: fetchFinanceCategories,
    staleTime: 60_000,
  });

  const { data: delinquency = [] } = useQuery({
    queryKey: ["finance-delinquency", range.from, range.to],
    queryFn: () => fetchFinanceDelinquency(range.from, range.to),
    staleTime: 30_000,
  });

  const delinquencyTotal = useMemo(
    () => delinquency.reduce((sum, d) => sum + d.estimatedAmount, 0),
    [delinquency],
  );

  const createMutation = useMutation({
    mutationFn: createFinanceTransaction,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: createFinanceCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["finance-categories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFinanceTransaction,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      toast.success("Lançamento excluído");
    },
    onError: (err) => toast.error(formatUserFacingApiError(err, "Não foi possível excluir o lançamento.")),
  });

  const defaultScope: FinancialScope = scope === "personal" ? "personal" : "professional";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground capitalize">{monthLabel(range.from)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => setMonthOffset((o) => o - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMonthOffset(0)}
            disabled={monthOffset === 0}
          >
            Mês atual
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => setMonthOffset((o) => o + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(true)}>
            Nova categoria
          </Button>
          <Button type="button" className="gap-1" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo lançamento
          </Button>
        </div>
      </div>

      <FinanceScopeToggle value={scope} onChange={setScope} />

      <FinanceSummaryCards
        scope={scope}
        summary={summary}
        delinquencyTotal={delinquencyTotal}
        loading={summaryLoading}
      />

      <FinanceTransactionsTable
        transactions={transactions}
        loading={txLoading}
        onDelete={(id) => setDeleteId(id)}
      />

      <FinanceTransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={categories}
        defaultScope={defaultScope}
        onSubmit={async (body) => {
          await createMutation.mutateAsync(body);
        }}
      />

      <FinanceCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        defaultScope={defaultScope}
        onSubmit={async (body) => {
          await createCategoryMutation.mutateAsync(body);
        }}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir lançamento"
        description="Esta ação não pode ser desfeita. O lançamento será removido permanentemente."
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId !== null) await deleteMutation.mutateAsync(deleteId);
        }}
      />
    </div>
  );
}
