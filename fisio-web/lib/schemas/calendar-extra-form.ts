import { z } from "zod";

export const calendarExtraFormSchema = z.object({
  title: z.string().min(1, "Informe um título"),
  date: z.string().min(1, "Informe a data"),
  time: z.string().min(1, "Informe o horário"),
  duration: z.enum(["30", "50", "60", "90"]),
  notes: z.string(),
});

export type CalendarExtraFormValues = z.infer<typeof calendarExtraFormSchema>;

export function emptyCalendarExtraForm(selectedDate: string): CalendarExtraFormValues {
  return {
    title: "",
    date: selectedDate,
    time: "",
    duration: "60",
    notes: "",
  };
}
