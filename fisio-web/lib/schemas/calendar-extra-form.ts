import { z } from "zod";

export const calendarExtraFormSchema = z.object({
  title: z.string().min(1, "Informe um título"),
  date: z.string().min(1, "Informe a data"),
  time: z.string(),
  endTime: z.string(),
  isAllDay: z.boolean(),
  repeatEnabled: z.boolean(),
  repeatWeekdays: z.array(z.number().int().min(0).max(6)),
  repeatUntil: z.string(),
  notes: z.string(),
}).superRefine((values, ctx) => {
  if (!values.isAllDay && !values.time) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["time"],
      message: "Informe o horário de início",
    });
  }

  if (!values.isAllDay && !values.endTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "Informe o horário de fim",
    });
  }

  if (!values.isAllDay && values.time && values.endTime && values.endTime <= values.time) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "Horário de fim deve ser maior que o início",
    });
  }

  if (values.repeatEnabled) {
    if (!values.repeatUntil) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["repeatUntil"],
        message: "Informe até quando repetir",
      });
    } else if (values.repeatUntil < values.date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["repeatUntil"],
        message: "Data final da repetição deve ser igual ou após a data inicial",
      });
    }

    if (values.repeatWeekdays.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["repeatWeekdays"],
        message: "Selecione pelo menos um dia da semana para repetir",
      });
    }
  }
});

export type CalendarExtraFormValues = z.infer<typeof calendarExtraFormSchema>;

export function emptyCalendarExtraForm(selectedDate: string): CalendarExtraFormValues {
  return {
    title: "",
    date: selectedDate,
    time: "",
    endTime: "",
    isAllDay: false,
    repeatEnabled: false,
    repeatWeekdays: [],
    repeatUntil: "",
    notes: "",
  };
}
