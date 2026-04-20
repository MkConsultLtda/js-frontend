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
        <Label htmlFor={`${idPrefix}duration`} className={cn("text-right pt-2", errors.duration && "text-destructive")}>
          Duração
        </Label>
        <div className="col-span-3 space-y-1">
          <Controller
            name="duration"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={`${idPrefix}duration`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="50">50 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1h 30min</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FormFieldError message={errors.duration?.message} id={`${idPrefix}duration-error`} />
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
