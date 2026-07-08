import { backendApiHref, backendJson } from "@/lib/api/backend-client";
import type { Appointment } from "@/lib/types";

type AppointmentDto = Record<string, unknown>;

function mapAppointmentDto(raw: AppointmentDto): Appointment {
  const kind = raw.kind;
  const status = String(raw.status ?? "scheduled");
  return {
    id: Number(raw.id),
    kind: kind === "personal" || kind === "block" || kind === "session" ? kind : "session",
    patientId: Number(raw.patientId ?? 0),
    patientName: String(raw.patientName ?? ""),
    date: typeof raw.date === "string" ? raw.date.substring(0, 10) : "",
    time: String(raw.time ?? "00:00").slice(0, 5),
    duration: Number(raw.duration ?? 50),
    type: String(raw.type ?? ""),
    status:
      status === "confirmed" ||
      status === "completed" ||
      status === "cancelled" ||
      status === "scheduled" ||
      status === "no_show"
        ? status
        : "scheduled",
    notes: raw.notes != null ? String(raw.notes) : undefined,
    paymentStatus: raw.paymentStatus === "paid" || raw.pay === "paid" ? "paid" : "pending",
    sessionAmount: raw.sessionAmount != null ? Number(raw.sessionAmount) : undefined,
    seriesId: raw.seriesId != null ? String(raw.seriesId) : undefined,
  };
}

export async function createFinanceCategory(body: {
  name: string;
  type: FinancialType;
  scope: FinancialScope;
}): Promise<FinancialCategory> {
  const raw = await backendJson<Record<string, unknown>>(backendApiHref("finance/categories"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ""),
    type: raw.type === "expense" ? "expense" : "income",
    scope: raw.scope === "personal" ? "personal" : "professional",
    active: raw.active !== false,
  };
}

export async function apiCreateRecurringSessions(body: {
  patientId: number;
  patientName: string;
  totalSessions: number;
  weekdays: number[];
  time: string;
  duration: number;
  type: string;
  startDate: string;
  skipHolidays?: boolean;
  allowOverlap?: boolean;
  sessionAmount: number;
  paymentPlan?: "per_session" | "upfront" | "installments";
  packageAmount?: number;
  installmentCount?: number;
}): Promise<Appointment[]> {
  const raw = await backendJson<AppointmentDto[]>(
    backendApiHref("appointments/recurring-sessions", body.allowOverlap ? { allowOverlap: "true" } : undefined),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: body.patientId,
        patientName: body.patientName,
        totalSessions: body.totalSessions,
        weekdays: body.weekdays,
        time: body.time,
        duration: body.duration,
        type: body.type,
        startDate: body.startDate,
        skipHolidays: body.skipHolidays ?? true,
        sessionAmount: body.sessionAmount,
        paymentPlan: body.paymentPlan ?? "per_session",
        packageAmount: body.packageAmount,
        installmentCount: body.installmentCount,
      }),
    },
  );
  return raw.map(mapAppointmentDto);
}

export type FinancialScope = "personal" | "professional";
export type FinancialType = "income" | "expense";

export type FinancialCategory = {
  id: number;
  name: string;
  type: FinancialType;
  scope: FinancialScope;
  active: boolean;
};

export type FinancialTransaction = {
  id: number;
  date: string;
  amount: number;
  type: FinancialType;
  scope: FinancialScope;
  categoryId: number | null;
  categoryName: string | null;
  description: string | null;
  patientId: number | null;
  patientName: string | null;
  appointmentId: number | null;
  paymentMethod: string | null;
};

export type FinancialSummary = {
  from: string;
  to: string;
  incomeProfessional: number;
  expenseProfessional: number;
  balanceProfessional: number;
  incomePersonal: number;
  expensePersonal: number;
  balancePersonal: number;
  incomeTotal: number;
  expenseTotal: number;
  balanceTotal: number;
};

export type DelinquencyItem = {
  patientId: number;
  patientName: string;
  pendingSessions: number;
  estimatedAmount: number;
};

function mapTx(raw: Record<string, unknown>): FinancialTransaction {
  return {
    id: Number(raw.id),
    date: String(raw.date ?? ""),
    amount: Number(raw.amount ?? 0),
    type: raw.type === "expense" ? "expense" : "income",
    scope: raw.scope === "personal" ? "personal" : "professional",
    categoryId: raw.categoryId != null ? Number(raw.categoryId) : null,
    categoryName: raw.categoryName != null ? String(raw.categoryName) : null,
    description: raw.description != null ? String(raw.description) : null,
    patientId: raw.patientId != null ? Number(raw.patientId) : null,
    patientName: raw.patientName != null ? String(raw.patientName) : null,
    appointmentId: raw.appointmentId != null ? Number(raw.appointmentId) : null,
    paymentMethod: raw.paymentMethod != null ? String(raw.paymentMethod) : null,
  };
}

export async function fetchFinanceCategories(): Promise<FinancialCategory[]> {
  const raw = await backendJson<Record<string, unknown>[]>(backendApiHref("finance/categories"));
  return raw.map((c) => ({
    id: Number(c.id),
    name: String(c.name ?? ""),
    type: c.type === "expense" ? "expense" : "income",
    scope: c.scope === "personal" ? "personal" : "professional",
    active: c.active !== false,
  }));
}

export async function fetchFinanceTransactions(
  from: string,
  to: string,
  scope?: FinancialScope,
): Promise<FinancialTransaction[]> {
  const raw = await backendJson<Record<string, unknown>[]>(
    backendApiHref("finance/transactions", { from, to, scope }),
  );
  return raw.map(mapTx);
}

export async function createFinanceTransaction(body: {
  date: string;
  amount: number;
  type: FinancialType;
  scope: FinancialScope;
  categoryId?: number;
  description?: string;
  patientId?: number;
  paymentMethod?: string;
}): Promise<FinancialTransaction> {
  const raw = await backendJson<Record<string, unknown>>(backendApiHref("finance/transactions"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return mapTx(raw);
}

export async function deleteFinanceTransaction(id: number): Promise<void> {
  await backendJson<void>(backendApiHref(`finance/transactions/${id}`), { method: "DELETE" });
}

export async function fetchFinanceSummary(from: string, to: string): Promise<FinancialSummary> {
  const raw = await backendJson<Record<string, unknown>>(backendApiHref("finance/summary", { from, to }));
  return {
    from: String(raw.from ?? from),
    to: String(raw.to ?? to),
    incomeProfessional: Number(raw.incomeProfessional ?? 0),
    expenseProfessional: Number(raw.expenseProfessional ?? 0),
    balanceProfessional: Number(raw.balanceProfessional ?? 0),
    incomePersonal: Number(raw.incomePersonal ?? 0),
    expensePersonal: Number(raw.expensePersonal ?? 0),
    balancePersonal: Number(raw.balancePersonal ?? 0),
    incomeTotal: Number(raw.incomeTotal ?? 0),
    expenseTotal: Number(raw.expenseTotal ?? 0),
    balanceTotal: Number(raw.balanceTotal ?? 0),
  };
}

export async function fetchFinanceDelinquency(from: string, to: string): Promise<DelinquencyItem[]> {
  const raw = await backendJson<Record<string, unknown>[]>(
    backendApiHref("finance/delinquency", { from, to }),
  );
  return raw.map((d) => ({
    patientId: Number(d.patientId),
    patientName: String(d.patientName ?? ""),
    pendingSessions: Number(d.pendingSessions ?? 0),
    estimatedAmount: Number(d.estimatedAmount ?? 0),
  }));
}
