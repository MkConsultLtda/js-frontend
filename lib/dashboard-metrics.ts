import type { Appointment, Evolucao, Patient } from "@/lib/types";
import { brDateToIsoDate, startOfWeekMonday, toLocalDateString } from "@/lib/date-utils";
import {
  countAppointmentsByWorkingWeekdays,
  formatWorkingDaysShort,
  isWorkingDateKey,
} from "@/lib/schedule-utils";
import { isSessionAppointment } from "@/lib/types";
import { sessionAmountValue } from "@/lib/appointment-payment";
import { averageSessionDurationMinutes } from "@/lib/patient-treatment";
import type { ClinicSettings } from "@/lib/clinic-settings-types";

export type DashboardMetrics = {
  appointmentsToday: number;
  confirmedToday: number;
  scheduledToday: number;
  cancelledToday: number;
  todayActiveSessions: number;
  todayOccupancyPct: number;
  activePatients: number;
  newPatientsThisMonth: number;
  nextAppointment: Appointment | undefined;
  weekBars: ReturnType<typeof countAppointmentsByWorkingWeekdays>;
  today: string;
  isTodayWorking: boolean;
  workingDaysLabel: string;
  maxSessions: number;
  receivedToday: number;
  weeklyReceived: number;
  weeklyCancelled: number;
  weeklyCompleted: number;
  monthlyReceived: number;
  monthlyCompleted: number;
  monthlyCancelled: number;
  monthlyGoal: number;
  monthlyGoalPct: number;
  monthWeekBuckets: { label: string; received: number; completed: number; cancelled: number }[];
  evolucoesHoje: number;
  evolucoesSemana: number;
  evolucoesMes: number;
  todayCompleted: number;
  receivableToday: number;
  receivableWeek: number;
  receivableMonth: number;
  weekSessionTotal: number;
  monthSessionTotal: number;
  avgSessionMinutes: number | null;
};

export function isRegisteredThisMonth(registeredAt: string, yearMonth: string): boolean {
  if (/^\d{4}-\d{2}-\d{2}$/.test(registeredAt)) {
    return registeredAt.startsWith(yearMonth);
  }
  const iso = brDateToIsoDate(registeredAt);
  return iso !== null && iso.startsWith(yearMonth);
}

export function computeDashboardMetrics(
  patients: Patient[],
  appointments: Appointment[],
  evolucoes: Evolucao[],
  settings: ClinicSettings,
): DashboardMetrics {
  const now = new Date();
  const today = toLocalDateString(now);
  const sessions = appointments.filter(isSessionAppointment);
  const maxSessions = Math.max(1, settings.maxSessionsPerDay);
  const sessionPrice = Math.max(0, settings.sessionPrice || 0);
  const amountOf = (apt: Appointment) => sessionAmountValue(apt, sessionPrice);

  const todayAppointments = sessions.filter((apt) => apt.date === today);
  const confirmedToday = todayAppointments.filter((apt) => apt.status === "confirmed").length;
  const scheduledToday = todayAppointments.filter((apt) => apt.status === "scheduled").length;
  const cancelledToday = todayAppointments.filter((apt) => apt.status === "cancelled").length;
  const todayActiveSessions = todayAppointments.filter((apt) => apt.status !== "cancelled").length;
  const todayOccupancyPct = Math.min(
    100,
    Math.round((todayActiveSessions / maxSessions) * 100),
  );
  const receivedToday = todayAppointments
    .filter((apt) => apt.paymentStatus === "paid")
    .reduce((sum, apt) => sum + amountOf(apt), 0);

  const activePatients = patients.filter((p) => p.status === "active").length;
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const newPatientsThisMonth = patients.filter((p) => isRegisteredThisMonth(p.registeredAt, ym)).length;

  const nextAppointment = todayAppointments
    .filter((apt) => apt.status === "confirmed")
    .sort((a, b) => a.time.localeCompare(b.time))
    .find((apt) => {
      const aptTime = new Date(`${today}T${apt.time}`);
      return aptTime > now;
    });

  const weekBars = countAppointmentsByWorkingWeekdays(sessions, now, settings.workingWeekdays);
  const isTodayWorking = isWorkingDateKey(today, settings.workingWeekdays);
  const workingDaysLabel = formatWorkingDaysShort(settings.workingWeekdays);

  const weekStart = startOfWeekMonday(now);
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
  const weekStartIso = toLocalDateString(weekStart);
  const weekEndIso = toLocalDateString(weekEnd);
  const weeklySessions = sessions.filter((apt) => {
    const date = new Date(`${apt.date}T12:00:00`);
    return date >= weekStart && date <= weekEnd;
  });
  const weeklyReceived = weeklySessions
    .filter((apt) => apt.paymentStatus === "paid")
    .reduce((sum, apt) => sum + amountOf(apt), 0);
  const weeklyCancelled = weeklySessions.filter((apt) => apt.status === "cancelled").length;
  const weeklyCompleted = weeklySessions.filter((apt) => apt.status === "completed").length;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthStartIso = toLocalDateString(monthStart);
  const monthEndIso = toLocalDateString(monthEnd);
  const monthlySessions = sessions.filter((apt) => {
    const date = new Date(`${apt.date}T12:00:00`);
    return date >= monthStart && date <= monthEnd;
  });
  const monthlyReceived = monthlySessions
    .filter((apt) => apt.paymentStatus === "paid")
    .reduce((sum, apt) => sum + amountOf(apt), 0);
  const monthlyCompleted = monthlySessions.filter((apt) => apt.status === "completed").length;
  const monthlyCancelled = monthlySessions.filter((apt) => apt.status === "cancelled").length;
  const avgSessionMinutes = averageSessionDurationMinutes(monthlySessions);
  const monthlyGoal = Math.max(1, settings.monthlyRevenueGoal || 0);
  const monthlyGoalPct = Math.min(999, Math.round((monthlyReceived / monthlyGoal) * 100));

  const monthWeekBuckets = [1, 2, 3, 4, 5].map((w) => ({
    label: `S${w}`,
    received: 0,
    completed: 0,
    cancelled: 0,
  }));
  for (const apt of monthlySessions) {
    const date = new Date(`${apt.date}T12:00:00`);
    const day = date.getDate();
    const bucketIndex = Math.min(4, Math.floor((day - 1) / 7));
    const bucket = monthWeekBuckets[bucketIndex];
    if (apt.paymentStatus === "paid") bucket.received += amountOf(apt);
    if (apt.status === "completed") bucket.completed += 1;
    if (apt.status === "cancelled") bucket.cancelled += 1;
  }

  const countEvolucoesInIsoRange = (startIso: string, endIso: string) =>
    evolucoes.filter((ev) => {
      const raw = ev.dataSessao;
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : brDateToIsoDate(raw);
      return iso !== null && iso >= startIso && iso <= endIso;
    }).length;

  const evolucoesHoje = countEvolucoesInIsoRange(today, today);
  const evolucoesSemana = countEvolucoesInIsoRange(weekStartIso, weekEndIso);
  const evolucoesMes = countEvolucoesInIsoRange(monthStartIso, monthEndIso);

  const todayCompleted = todayAppointments.filter((apt) => apt.status === "completed").length;
  const pendingReceivable = (apts: typeof todayAppointments) =>
    apts
      .filter((apt) => apt.status !== "cancelled" && apt.paymentStatus === "pending")
      .reduce((sum, apt) => sum + amountOf(apt), 0);

  return {
    appointmentsToday: todayAppointments.length,
    confirmedToday,
    scheduledToday,
    cancelledToday,
    todayActiveSessions,
    todayOccupancyPct,
    activePatients,
    newPatientsThisMonth,
    nextAppointment,
    weekBars,
    today,
    isTodayWorking,
    workingDaysLabel,
    maxSessions,
    receivedToday,
    weeklyReceived,
    weeklyCancelled,
    weeklyCompleted,
    monthlyReceived,
    monthlyCompleted,
    monthlyCancelled,
    monthlyGoal,
    monthlyGoalPct,
    monthWeekBuckets,
    evolucoesHoje,
    evolucoesSemana,
    evolucoesMes,
    todayCompleted,
    receivableToday: pendingReceivable(todayAppointments),
    receivableWeek: pendingReceivable(weeklySessions),
    receivableMonth: pendingReceivable(monthlySessions),
    weekSessionTotal: weeklySessions.length,
    monthSessionTotal: monthlySessions.length,
    avgSessionMinutes,
  };
}

export function money(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });
}

export function sessionStatusBadge(status: Appointment["status"]): {
  label: string;
  className: string;
} {
  switch (status) {
    case "confirmed":
      return { label: "Confirmado", className: "bg-chart-2/25 text-chart-3" };
    case "scheduled":
      return { label: "Agendado", className: "bg-chart-5/20 text-chart-5" };
    case "completed":
      return { label: "Concluído", className: "bg-chart-1/20 text-chart-1" };
    case "no_show":
      return { label: "Falta", className: "bg-orange-200/80 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100" };
    case "cancelled":
      return { label: "Cancelado", className: "bg-destructive/15 text-destructive line-through" };
    default:
      return { label: status, className: "bg-muted text-muted-foreground" };
  }
}
