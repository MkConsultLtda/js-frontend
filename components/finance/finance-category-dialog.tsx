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
import { FormFieldError } from "@/components/form-field-error";
import { formatUserFacingApiError } from "@/lib/api/backend-client";
import type { FinancialScope, FinancialType } from "@/lib/api/finance-api";

const schema = z.object({
  name: z.string().trim().min(2, "Nome com ao menos 2 caracteres").max(120),
  type: z.enum(["income", "expense"]),
  scope: z.enum(["professional", "personal"]),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultScope: FinancialScope;
  onSubmit: (body: { name: string; type: FinancialType; scope: FinancialScope }) => Promise<void>;
};

export function FinanceCategoryDialog({ open, onOpenChange, defaultScope, onSubmit }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "income",
      scope: defaultScope === "personal" ? "personal" : "professional",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: "",
      type: "income",
      scope: defaultScope === "personal" ? "personal" : "professional",
    });
  }, [open, defaultScope, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit({
        name: values.name.trim(),
        type: values.type,
        scope: values.scope,
      });
      toast.success("Categoria criada");
      onOpenChange(false);
    } catch (err) {
      toast.error(formatUserFacingApiError(err, "Não foi possível criar a categoria."));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova categoria</DialogTitle>
          <DialogDescription>
            Crie categorias personalizadas para organizar receitas e despesas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Nome</Label>
            <Input id="cat-name" placeholder="Ex.: Pilates, Convênio, Equipamentos" {...form.register("name")} />
            <FormFieldError message={form.formState.errors.name?.message} />
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Salvando…" : "Criar categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
