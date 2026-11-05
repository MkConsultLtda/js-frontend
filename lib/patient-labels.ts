import type { PatientStatus } from "@/lib/types";

export function patientStatusLabel(status: PatientStatus): string {
  switch (status) {
    case "active":
      return "Ativo";
    case "inactive":
      return "Inativo";
    case "discharged":
      return "Alta";
    default:
      return status;
  }
}

export function patientStatusBadgeClass(status: PatientStatus): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300";
    case "discharged":
      return "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200";
    case "inactive":
    default:
      return "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground";
  }
}
