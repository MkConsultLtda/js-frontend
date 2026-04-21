"use client";

import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormFieldError } from "@/components/form-field-error";
import type { CalendarExtraFormValues } from "@/lib/schemas/calendar-extra-form";
import { cn } from "@/lib/utils";

type Props = {
  control: Control<CalendarExtraFormValues>;
  errors: FieldErrors<CalendarExtraFormValues>;
  idPrefix?: string;
  titleLabel?: string;
};

export function CalendarExtraFormFields({
  control,
  errors,
  idPrefix = "",
  titleLabel = "Título",
}: Props) {
  const weekdays = [
    { label: "Dom", value: 0 },
    { label: "Seg", value: 1 },
    { label: "Ter", value: 2 },
    { label: "Qua", value: 3 },
    { label: "Qui", value: 4 },
    { label: "Sex", value: 5 },
    { label: "Sáb", value: 6 },
  ] as const;

  return (
    <div className="grid gap-2 py-4">
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}title`} className={cn("text-right pt-2", errors.title && "text-destructive")}>
          {titleLabel}
        </Label>
        <div className="col-span-3 space-y-1">
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input
                id={`${idPrefix}title`}
                placeholder="Ex.: Almoço, Reunião, Trabalho fixo"
                className={cn(errors.title && "border-destructive")}
                {...field}
              />
            )}
          />
          <FormFieldError message={errors.title?.message} id={`${idPrefix}title-error`} />
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}date`} className={cn("text-right pt-2", errors.date && "text-destructive")}>
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
                {...field}
              />
            )}
          />
          <FormFieldError message={errors.date?.message} id={`${idPrefix}date-error`} />
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}time`} className={cn("text-right pt-2", errors.time && "text-destructive")}>
          Início
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
                {...field}
              />
            )}
          />
          <FormFieldError message={errors.time?.message} id={`${idPrefix}time-error`} />
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}end-time`} className={cn("text-right pt-2", errors.endTime && "text-destructive")}>
          Fim
        </Label>
        <div className="col-span-3 space-y-1">
          <Controller
            name="endTime"
            control={control}
            render={({ field }) => (
              <Input
                id={`${idPrefix}end-time`}
                type="time"
                className={cn(errors.endTime && "border-destructive")}
                {...field}
              />
            )}
          />
          <FormFieldError message={errors.endTime?.message} id={`${idPrefix}end-time-error`} />
          <p className="text-[11px] text-muted-foreground">
            Para bloquear o dia inteiro, marque a opção abaixo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}all-day`} className="text-right pt-2">
          Dia inteiro
        </Label>
        <div className="col-span-3">
          <Controller
            name="isAllDay"
            control={control}
            render={({ field }) => (
              <label className="inline-flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <input
                  id={`${idPrefix}all-day`}
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                Bloquear/ocupar dia inteiro (00:00 às 23:59)
              </label>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}repeat`} className="text-right pt-2">
          Repetição
        </Label>
        <div className="col-span-3 space-y-2">
          <Controller
            name="repeatEnabled"
            control={control}
            render={({ field }) => (
              <label className="inline-flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <input
                  id={`${idPrefix}repeat`}
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                Repetir semanalmente em dias selecionados
              </label>
            )}
          />

          <Controller
            name="repeatWeekdays"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {weekdays.map((weekday) => {
                  const isSelected = field.value.includes(weekday.value);
                  return (
                    <button
                      key={weekday.value}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          field.onChange(field.value.filter((v) => v !== weekday.value));
                          return;
                        }
                        field.onChange([...field.value, weekday.value].sort((a, b) => a - b));
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {weekday.label}
                    </button>
                  );
                })}
              </div>
            )}
          />
          <FormFieldError
            message={errors.repeatWeekdays?.message}
            id={`${idPrefix}repeat-weekdays-error`}
          />

          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}repeat-until`} className="text-xs text-muted-foreground">
              Repetir até
            </Label>
            <Controller
              name="repeatUntil"
              control={control}
              render={({ field }) => (
                <Input
                  id={`${idPrefix}repeat-until`}
                  type="date"
                  className={cn(errors.repeatUntil && "border-destructive")}
                  {...field}
                />
              )}
            />
            <FormFieldError message={errors.repeatUntil?.message} id={`${idPrefix}repeat-until-error`} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}notes`} className="text-right pt-2">
          Observações
        </Label>
        <div className="col-span-3">
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Textarea id={`${idPrefix}notes`} className="min-h-[72px] resize-none" {...field} />
            )}
          />
        </div>
      </div>
    </div>
  );
}
