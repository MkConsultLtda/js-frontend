"use client";

import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormFieldError } from "@/components/form-field-error";
import type { AppointmentFormValues } from "@/lib/schemas/appointment-form";
import type { SessionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type PatientOption = { id: number; name: string };

type Props = {
  control: Control<AppointmentFormValues>;
  errors: FieldErrors<AppointmentFormValues>;
  patients: PatientOption[];
  durationOptions: number[];
  typeOptions: string[];
  idPrefix?: string;
};

function rowClass(hasError: boolean) {
  return cn(hasError && "text-destructive");
}

export function AppointmentFormFields({
  control,
  errors,
  patients,
  durationOptions,
  typeOptions,
  idPrefix = "",
}: Props) {
  return (
    <div className="grid gap-2 py-4">
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}patient`} className={cn("text-right pt-2", rowClass(!!errors.patientId))}>
          Paciente
        </Label>
        <div className="col-span-3 space-y-1">
          <Controller
            name="patientId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={`${idPrefix}patient`}
                  className={cn(errors.patientId && "border-destructive")}
                  aria-invalid={!!errors.patientId}
                  aria-describedby={errors.patientId ? `${idPrefix}patient-error` : undefined}
                >
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FormFieldError message={errors.patientId?.message} id={`${idPrefix}patient-error`} />
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}date`} className={cn("text-right pt-2", rowClass(!!errors.date))}>
          Data
        </Label>
        <div className="col-span-3 space-y-1">
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <Input
                id={`${idPrefix}date`}
                type="date"
                className={cn(errors.date && "border-destructive")}
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? `${idPrefix}date-error` : undefined}
                {...field}
              />
            )}
          />
          <FormFieldError message={errors.date?.message} id={`${idPrefix}date-error`} />
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}time`} className={cn("text-right pt-2", rowClass(!!errors.time))}>
          Horário
        </Label>
        <div className="col-span-3 space-y-1">
          <Controller
            name="time"
            control={control}
            render={({ field }) => (
              <Input
                id={`${idPrefix}time`}
                type="time"
                className={cn(errors.time && "border-destructive")}
                aria-invalid={!!errors.time}
                aria-describedby={errors.time ? `${idPrefix}time-error` : undefined}
                {...field}
              />
            )}
          />
          <FormFieldError message={errors.time?.message} id={`${idPrefix}time-error`} />
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}duration`} className={cn("text-right pt-2", rowClass(!!errors.duration))}>
          Duração
        </Label>
        <div className="col-span-3 space-y-1">
          <Controller
            name="duration"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={`${idPrefix}duration`}
                  className={cn(errors.duration && "border-destructive")}
                  aria-invalid={!!errors.duration}
                  aria-describedby={errors.duration ? `${idPrefix}duration-error` : undefined}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((minutes) => (
                    <SelectItem key={minutes} value={String(minutes)}>
                      {minutes === 60
                        ? "1 hora"
                        : minutes === 90
                          ? "1h30"
                          : minutes === 120
                            ? "2 horas"
                            : `${minutes} minutos`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FormFieldError message={errors.duration?.message} id={`${idPrefix}duration-error`} />
          <p className="text-[11px] text-muted-foreground">
            Horário final calculado automaticamente a partir da duração.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}type`} className={cn("text-right pt-2", rowClass(!!errors.type))}>
          Tipo
        </Label>
        <div className="col-span-3 space-y-1">
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={`${idPrefix}type`}
                  className={cn(errors.type && "border-destructive")}
                  aria-invalid={!!errors.type}
                  aria-describedby={errors.type ? `${idPrefix}type-error` : undefined}
                >
                  <SelectValue placeholder="Tipo de sessão" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FormFieldError message={errors.type?.message} id={`${idPrefix}type-error`} />
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}status`} className={cn("text-right pt-2", rowClass(!!errors.status))}>
          Status
        </Label>
        <div className="col-span-3 space-y-1">
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value: SessionStatus) => field.onChange(value)}
              >
                <SelectTrigger
                  id={`${idPrefix}status`}
                  className={cn(errors.status && "border-destructive")}
                  aria-invalid={!!errors.status}
                  aria-describedby={errors.status ? `${idPrefix}status-error` : undefined}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FormFieldError message={errors.status?.message} id={`${idPrefix}status-error`} />
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}payment`} className={cn("text-right pt-2", rowClass(!!errors.paymentStatus))}>
          Pagamento
        </Label>
        <div className="col-span-3 space-y-1">
          <Controller
            name="paymentStatus"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={`${idPrefix}payment`}
                  className={cn(errors.paymentStatus && "border-destructive")}
                  aria-invalid={!!errors.paymentStatus}
                  aria-describedby={
                    errors.paymentStatus ? `${idPrefix}payment-error` : undefined
                  }
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FormFieldError
            message={errors.paymentStatus?.message}
            id={`${idPrefix}payment-error`}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}notes`} className="text-right pt-2">
          Observações
        </Label>
        <div className="col-span-3 space-y-1">
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Textarea
                id={`${idPrefix}notes`}
                placeholder="Observações adicionais..."
                {...field}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
