import { z } from "zod";

export const appointmentFormSchema = z.object({
  patientId: z.string().min(1, "Selecione um paciente"),
  date: z
    .string()
    .min(1, "Informe a data")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato de data AAAA-MM-DD"),
  time: z
    .string()
    .min(1, "Informe o horário")
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato de horário HH:mm"),
  duration: z
    .string()
    .min(1, "Selecione a duração")
    .refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, "Duração inválida"),
  type: z.string().min(1, "Selecione o tipo de sessão"),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled"], {
    error: "Status inválido",
  }),
  paymentStatus: z.enum(["pending", "paid"], {
    error: "Status de pagamento inválido",
  }),
  notes: z.string(),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export function emptyAppointmentForm(selectedDate: string): AppointmentFormValues {
  return {
    patientId: "",
    date: selectedDate,
    time: "",
    duration: "60",
    type: "",
    status: "confirmed",
    paymentStatus: "pending",
    notes: "",
  };
}
