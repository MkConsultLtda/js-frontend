import { z } from "zod";

export const appointmentFormSchema = z.object({
  patientId: z.string().min(1, "Selecione um paciente"),
  date: z.string().min(1, "Informe a data"),
  time: z.string().min(1, "Informe o horário"),
  duration: z.enum(["30", "50", "60", "90"]),
  type: z.string().min(1, "Selecione o tipo de sessão"),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]),
  paymentStatus: z.enum(["pending", "paid"]),
  notes: z.string(),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export function emptyAppointmentForm(selectedDate: string): AppointmentFormValues {
  return {
    patientId: "",
    date: selectedDate,
    time: "",
    duration: "50",
    type: "",
    status: "confirmed",
    paymentStatus: "pending",
    notes: "",
  };
}
