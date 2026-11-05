"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormFieldError } from "@/components/form-field-error";
import { formatUserFacingApiError } from "@/lib/api/backend-client";
import type { FinancialCategory, FinancialScope, FinancialType } from "@/lib/api/finance-api";

const schema = z.object({
  date: z.string().min(1, "Informe a data"),
  amount: z.number({ error: "Informe um valor válido" }).positive("Valor deve ser positivo"),
  type: z.enum(["income", "expense"]),
  scope: z.enum(["professional", "personal"]),
  categoryId: z.string().optional(),
  description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: FinancialCategory[];
  defaultScope: FinancialScope;
  onSubmit: (body: {
    date: string;
    amount: number;
    type: FinancialType;
    scope: FinancialScope;
    categoryId?: number;
    description?: string;
  }) => Promise<void>;
};

export function FinanceTransactionDialog({
  open,
  onOpenChange,
  categories,
  defaultScope,
  onSubmit,
}: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      type: "income",
      scope: defaultScope === "personal" ? "personal" : "professional",
      categoryId: "",
      description: "",
    },
  });

  const watchType = form.watch("type");
  const watchScope = form.watch("scope");

  useEffect(() => {
    if (open) {
      form.reset({
        date: new Date().toISOString().slice(0, 10),
        amount: 0,
        type: "income",
        scope: defaultScope === "personal" ? "personal" : "professional",
        categoryId: "",
        description: "",
      });
    }
  }, [open, defaultScope, form]);

  const filteredCategories = categories.filter(
    (c) => c.active && c.type === watchType && c.scope === watchScope,
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit({
        date: values.date,
        amount: values.amount,
        type: values.type,
        scope: values.scope,
        categoryId: values.categoryId ? Number(values.categoryId) : undefined,
        description: values.description?.trim() || undefined,
      });
      toast.success("Lançamento registrado");
      onOpenChange(false);
    } catch (err) {
      toast.error(formatUserFacingApiError(err, "Não foi possível salvar o lançamento."));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
          <DialogDescription>Registre receita ou despesa manualmente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fin-date">Data</Label>
              <Input id="fin-date" type="date" {...form.register("date")} />
              <FormFieldError message={form.formState.errors.date?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fin-amount">Valor (R$)</Label>
              <Input
                id="fin-amount"
                type="number"
                step="0.01"
                min="0"
                {...form.register("amount", { valueAsNumber: true })}
              />
              <FormFieldError message={form.formState.errors.amount?.message} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Escopo</Label>
              <Controller
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Profissional</SelectItem>
                      <SelectItem value="personal">Pessoal</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {filteredCategories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fin-desc">Descrição</Label>
            <Textarea id="fin-desc" rows={2} {...form.register("description")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
