import { toLocalDateString } from "@/lib/date-utils";
import type { Appointment } from "@/lib/types";

/** Estado exibido na agenda (derivado de pagamento + status do atendimento). */
export type AppointmentPaymentView = "paid" | "pending" | "delinquent";

export type SessionPaymentPlan = "per_session" | "upfront" | "installments";

export const PAYMENT_PLAN_LABEL: Record<SessionPaymentPlan, string> = {
  per_session: "Por sessão",
  upfront: "À vista (pacote)",
  installments: "Parcelado",
};

export function sessionAmountValue(apt: Pick<Appointment, "sessionAmount">, fallback: number): number {
  if (apt.sessionAmount != null && apt.sessionAmount > 0) return apt.sessionAmount;
  return fallback;
}

export function resolveAppointmentPaymentView(
  apt: Pick<Appointment, "paymentStatus" | "status" | "date">,
  today = toLocalDateString(new Date()),
): AppointmentPaymentView {
  if (apt.paymentStatus === "paid") return "paid";
  if (apt.status === "completed" || apt.status === "no_show") return "delinquent";
  if (apt.status !== "cancelled" && apt.date < today) return "delinquent";
  return "pending";
}

export function paymentViewLabel(
  view: AppointmentPaymentView,
  amount?: number,
): string {
  if (view === "paid") {
    return amount != null && amount > 0 ? `Pago · R$ ${formatBrl(amount)}` : "Pago";
  }
  if (view === "delinquent") {
    return amount != null && amount > 0
      ? `Inadimplente · R$ ${formatBrl(amount)}`
      : "Inadimplente";
  }
  return "Pagamento pendente";
}

export function paymentViewBadgeClass(view: AppointmentPaymentView): string {
  if (view === "paid") {
    return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";
  }
  if (view === "delinquent") {
    return "bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-200";
  }
  return "bg-orange-200 text-orange-950 dark:bg-orange-900/50 dark:text-orange-100";
}

function formatBrl(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export function parseMoneyInput(value?: string): number | undefined {
  const raw = (value ?? "").trim().replace(",", ".");
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
