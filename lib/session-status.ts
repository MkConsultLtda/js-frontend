import type { SessionStatus } from "@/lib/types";

export function sessionStatusLabel(status: SessionStatus): string {
  switch (status) {
    case "scheduled":
      return "Agendado";
    case "confirmed":
      return "Confirmado";
    case "completed":
      return "Concluído";
    case "cancelled":
      return "Cancelado";
    case "no_show":
      return "Falta";
    default:
      return status;
  }
}
