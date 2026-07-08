"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormFieldError } from "@/components/form-field-error";
import { formatUserFacingApiError } from "@/lib/api/backend-client";
import { useAgendaMutations } from "@/lib/api/hooks/use-fisio";
import { toLocalDateString } from "@/lib/date-utils";

const schema = z.object({
  dayOfWeek: z.string().min(1, "Selecione o dia"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido"),
  duration: z.string().refine((v) => Number(v) > 0, "Duração inválida"),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inicial inválida"),
  untilDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data final inválida"),
  notes: z.string(),
});

type FormValues = z.infer<typeof schema>;

const WEEKDAYS = [
  { value: "1", label: "Segunda-feira" },
  { value: "2", label: "Terça-feira" },
  { value: "3", label: "Quarta-feira" },
  { value: "4", label: "Quinta-feira" },
  { value: "5", label: "Sexta-feira" },
  { value: "6", label: "Sábado" },
  { value: "7", label: "Domingo" },
] as const;

type Props = {
  from: string;
  to: string;
  durationOptions: number[];
};

export function RecurringBlockDialog({ from, to, durationOptions }: Props) {
  const [open, setOpen] = React.useState(false);
  const { createRecurringBlocks } = useAgendaMutations(from, to);
  const today = toLocalDateString(new Date());

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dayOfWeek: "5",
      time: "12:00",
      duration: String(durationOptions[0] ?? 120),
      fromDate: today,
      untilDate: today,
      notes: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (createRecurringBlocks.isPending) return;
    try {
      const created = await createRecurringBlocks.mutateAsync({
        dayOfWeek: Number(data.dayOfWeek),
        time: data.time,
        duration: Number(data.duration),
        notes: data.notes.trim() || undefined,
        fromDate: data.fromDate,
        untilDate: data.untilDate,
      });
      setOpen(false);
      toast.success(`${created.length} bloqueio(s) criado(s).`);
    } catch (err) {
      toast.error(formatUserFacingApiError(err, "Não foi possível criar os bloqueios."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          <Repeat className="h-4 w-4" />
          Bloqueio recorrente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bloqueio semanal recorrente</DialogTitle>
          <DialogDescription>
            Cria bloqueios no mesmo dia da semana e horário entre duas datas (ex.: toda sexta
            12h–14h).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Dia da semana</Label>
            <Select
              value={form.watch("dayOfWeek")}
              onValueChange={(v) => form.setValue("dayOfWeek", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAYS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormFieldError message={form.formState.errors.dayOfWeek?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="rb-time">Início</Label>
              <Input id="rb-time" type="time" {...form.register("time")} />
              <FormFieldError message={form.formState.errors.time?.message} />
            </div>
            <div className="space-y-1">
              <Label>Duração (min)</Label>
              <Select
                value={form.watch("duration")}
                onValueChange={(v) => form.setValue("duration", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="rb-from">De</Label>
              <Input id="rb-from" type="date" {...form.register("fromDate")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rb-until">Até</Label>
              <Input id="rb-until" type="date" {...form.register("untilDate")} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="rb-notes">Observações</Label>
            <Textarea id="rb-notes" rows={2} {...form.register("notes")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createRecurringBlocks.isPending}>
              {createRecurringBlocks.isPending ? "Criando…" : "Criar bloqueios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
