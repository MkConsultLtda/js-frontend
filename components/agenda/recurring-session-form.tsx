"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { useAgendaMutations } from "@/lib/api/hooks/use-fisio";
import { PAYMENT_PLAN_LABEL, parseMoneyInput, type SessionPaymentPlan } from "@/lib/appointment-payment";

const WEEKDAYS = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 7, label: "Dom" },
] as const;

const schema = z
  .object({
    patientId: z.string().min(1, "Selecione o paciente"),
    totalSessions: z.string().refine((v) => Number(v) >= 1 && Number(v) <= 100, "Entre 1 e 100"),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido"),
    duration: z.string().refine((v) => Number(v) > 0, "Duração inválida"),
    type: z.string().min(1, "Tipo obrigatório"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    skipHolidays: z.boolean(),
    sessionAmount: z.string().min(1, "Informe o valor por sessão"),
    paymentPlan: z.enum(["per_session", "upfront", "installments"]),
    packageAmount: z.string().optional(),
    installmentCount: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!parseMoneyInput(data.sessionAmount)) {
      ctx.addIssue({ code: "custom", message: "Valor por sessão inválido", path: ["sessionAmount"] });
    }
    if (data.paymentPlan === "upfront") {
      if (!parseMoneyInput(data.packageAmount)) {
        ctx.addIssue({
          code: "custom",
          message: "Informe o valor total do pacote",
          path: ["packageAmount"],
        });
      }
    }
    if (data.paymentPlan === "installments") {
      if (!parseMoneyInput(data.packageAmount)) {
        ctx.addIssue({
          code: "custom",
          message: "Informe o valor total do pacote",
          path: ["packageAmount"],
        });
      }
      const n = Number(data.installmentCount ?? "");
      if (!Number.isFinite(n) || n < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Informe ao menos 2 parcelas",
          path: ["installmentCount"],
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

type Props = {
  from: string;
  to: string;
  patients: { id: number; name: string }[];
  durationOptions: number[];
  typeOptions: string[];
  defaultStartDate: string;
  defaultSessionPrice?: number;
  suggestedSessions?: number;
  onSuccess?: () => void;
};

export function RecurringSessionForm({
  from,
  to,
  patients,
  durationOptions,
  typeOptions,
  defaultStartDate,
  defaultSessionPrice = 150,
  suggestedSessions,
  onSuccess,
}: Props) {
  const [weekdays, setWeekdays] = React.useState<number[]>([1, 3, 5]);
  const { createRecurringSessions } = useAgendaMutations(from, to);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientId: "",
      totalSessions: String(suggestedSessions ?? 10),
      time: "15:00",
      duration: String(durationOptions[0] ?? 60),
      type: typeOptions[0] ?? "Fisioterapia",
      startDate: defaultStartDate,
      skipHolidays: true,
      sessionAmount: String(defaultSessionPrice),
      paymentPlan: "per_session",
      packageAmount: "",
      installmentCount: "2",
    },
  });

  const paymentPlan = form.watch("paymentPlan");

  React.useEffect(() => {
    form.setValue("startDate", defaultStartDate);
  }, [defaultStartDate, form]);

  const toggleDay = (day: number) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  };

  const onSubmit = async (data: FormValues) => {
    if (weekdays.length === 0) {
      toast.error("Selecione ao menos um dia da semana.");
      return;
    }
    const patient = patients.find((p) => String(p.id) === data.patientId);
    if (!patient) return;
    const sessionAmount = parseMoneyInput(data.sessionAmount);
    if (!sessionAmount) return;
    if (createRecurringSessions.isPending) return;
    try {
      const created = await createRecurringSessions.mutateAsync({
        patientId: patient.id,
        patientName: patient.name,
        totalSessions: Number(data.totalSessions),
        weekdays,
        time: data.time,
        duration: Number(data.duration),
        type: data.type,
        startDate: data.startDate,
        skipHolidays: data.skipHolidays,
        sessionAmount,
        paymentPlan: data.paymentPlan as SessionPaymentPlan,
        packageAmount: parseMoneyInput(data.packageAmount),
        installmentCount:
          data.paymentPlan === "installments" ? Number(data.installmentCount) : undefined,
      });
      toast.success(`${created.length} sessão(ões) agendada(s) no pacote.`);
      onSuccess?.();
    } catch (err) {
      toast.error(formatUserFacingApiError(err, "Não foi possível criar o pacote de sessões."));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 py-2">
      <div className="space-y-1">
        <Label>Paciente</Label>
        <Select value={form.watch("patientId")} onValueChange={(v) => form.setValue("patientId", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormFieldError message={form.formState.errors.patientId?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="rs-sessions">Quantidade de sessões</Label>
          <Input id="rs-sessions" type="number" min={1} max={100} {...form.register("totalSessions")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rs-start">Primeira sessão em</Label>
          <Input id="rs-start" type="date" {...form.register("startDate")} />
        </div>
      </div>

      <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
        <Label>Forma de pagamento do pacote</Label>
        <Select
          value={paymentPlan}
          onValueChange={(v) => form.setValue("paymentPlan", v as SessionPaymentPlan)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PAYMENT_PLAN_LABEL) as SessionPaymentPlan[]).map((key) => (
              <SelectItem key={key} value={key}>
                {PAYMENT_PLAN_LABEL[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <Label htmlFor="rs-session-amount">Valor por sessão (R$)</Label>
            <Input id="rs-session-amount" inputMode="decimal" {...form.register("sessionAmount")} />
            <FormFieldError message={form.formState.errors.sessionAmount?.message} />
          </div>
          {paymentPlan !== "per_session" ? (
            <div className="space-y-1">
              <Label htmlFor="rs-package-amount">Valor total do pacote (R$)</Label>
              <Input id="rs-package-amount" inputMode="decimal" {...form.register("packageAmount")} />
              <FormFieldError message={form.formState.errors.packageAmount?.message} />
            </div>
          ) : null}
        </div>
        {paymentPlan === "installments" ? (
          <div className="space-y-1">
            <Label htmlFor="rs-installments">Número de parcelas</Label>
            <Input id="rs-installments" type="number" min={2} max={48} {...form.register("installmentCount")} />
            <FormFieldError message={form.formState.errors.installmentCount?.message} />
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Dias da semana</Label>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => (
            <label
              key={d.value}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs has-[:checked]:border-primary has-[:checked]:bg-primary/10"
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-input accent-primary"
                checked={weekdays.includes(d.value)}
                onChange={() => toggleDay(d.value)}
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="rs-time">Horário</Label>
          <Input id="rs-time" type="time" {...form.register("time")} />
        </div>
        <div className="space-y-1">
          <Label>Duração</Label>
          <Select value={form.watch("duration")} onValueChange={(v) => form.setValue("duration", v)}>
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

      <div className="space-y-1">
        <Label>Tipo de sessão</Label>
        <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-input accent-primary"
          checked={form.watch("skipHolidays")}
          onChange={(e) => form.setValue("skipHolidays", e.target.checked)}
        />
        Pular feriados ao gerar datas
      </label>

      <Button type="submit" className="w-full" disabled={createRecurringSessions.isPending}>
        {createRecurringSessions.isPending ? "Agendando pacote…" : "Criar pacote de sessões"}
      </Button>
    </form>
  );
}
