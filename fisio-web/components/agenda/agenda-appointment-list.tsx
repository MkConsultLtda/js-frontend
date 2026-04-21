"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Appointment, Patient } from "@/lib/types";
import type { ClinicSettings } from "@/lib/clinic-settings";
import { parseLocalDate } from "@/lib/date-utils";
import { formatAddressOneLine } from "@/lib/patient-utils";
import {
  buildSessionConfirmationWhatsappText,
  buildWhatsAppLink,
  toWhatsAppDigits,
} from "@/lib/session-messages";
import {
  Activity,
  Banknote,
  Calendar as CalendarIcon,
  Clock,
  Edit,
  ExternalLink,
  MessageCircle,
  Search,
  Trash2,
  User,
} from "lucide-react";

function endTimeLabel(start: string, durationMin: number): string {
  const [h, m] = start.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return start;
  const total = h * 60 + m + durationMin;
  const endHour = Math.floor((total % (24 * 60)) / 60);
  const endMinute = total % 60;
  return `${start} - ${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
}

type Props = {
  selectedDate: string;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  filteredAppointments: Appointment[];
  dayAppointments: Appointment[];
  patients: Patient[];
  settings: Pick<ClinicSettings, "therapistName" | "clinicName" | "maxSessionsPerDay">;
  onEdit: (appointment: Appointment) => void;
  onDeleteRequest: (id: number) => void;
  onTogglePayment: (appointment: Appointment) => void;
};

export function AgendaAppointmentList({
  selectedDate,
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  filteredAppointments,
  dayAppointments,
  patients,
  settings,
  onEdit,
  onDeleteRequest,
  onTogglePayment,
}: Props) {
  const dateLabel = parseLocalDate(selectedDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const hasActiveFilters = searchTerm.trim().length > 0 || statusFilter !== "all";
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const statusCounts = React.useMemo(() => {
    return dayAppointments.reduce(
      (acc, apt) => {
        acc.total += 1;
        acc[apt.status] += 1;
        if (apt.paymentStatus === "paid") {
          acc.paid += 1;
        } else {
          acc.pendingPayment += 1;
        }
        return acc;
      },
      {
        total: 0,
        scheduled: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        paid: 0,
        pendingPayment: 0,
      }
    );
  }, [dayAppointments]);

  const nextAppointmentId = React.useMemo(() => {
    if (selectedDate !== todayKey) return null;
    const next = dayAppointments
      .filter((apt) => apt.status !== "cancelled")
      .sort((a, b) => a.time.localeCompare(b.time))
      .find((apt) => {
        const [hour, minute] = apt.time.split(":");
        const aptMinutes = Number(hour) * 60 + Number(minute);
        return aptMinutes >= nowMinutes;
      });
    return next?.id ?? null;
  }, [dayAppointments, nowMinutes, selectedDate, todayKey]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Atendimentos do dia</CardTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {filteredAppointments.length} sessão(ões) com paciente em {dateLabel}. Bloqueios e eventos
              aparecem só na grade.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente ou tipo..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-8 w-full sm:w-72"
              />
            </div>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="scheduled">Agendados</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSearchTermChange("");
                  onStatusFilterChange("all");
                }}
              >
                Limpar filtros
              </Button>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Card className="border-primary/15">
        <CardContent>
          <div className="mb-4 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-violet-200/70 bg-violet-50/60 px-3 py-2 dark:border-violet-500/40 dark:bg-violet-500/10">
              <p className="text-muted-foreground">Ocupação prevista</p>
              <p className="font-semibold">
                {statusCounts.total}/{settings.maxSessionsPerDay} sessões
              </p>
            </div>
            <div className="rounded-lg border border-cyan-200/70 bg-cyan-50/60 px-3 py-2 dark:border-cyan-500/40 dark:bg-cyan-500/10">
              <p className="text-muted-foreground">Confirmações</p>
              <p className="font-semibold">
                {statusCounts.confirmed} confirmada(s) · {statusCounts.scheduled} agendada(s)
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-3 py-2 dark:border-emerald-500/40 dark:bg-emerald-500/10">
              <p className="text-muted-foreground">Finalização</p>
              <p className="font-semibold">
                {statusCounts.completed} concluída(s) · {statusCounts.cancelled} cancelada(s)
              </p>
            </div>
            <div className="rounded-lg border border-amber-200/70 bg-amber-50/60 px-3 py-2 dark:border-amber-500/40 dark:bg-amber-500/10">
              <p className="text-muted-foreground">Financeiro do dia</p>
              <p className="font-semibold">
                {statusCounts.paid} pago(s) · {statusCounts.pendingPayment} pendente(s)
              </p>
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum agendamento encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca."
                  : "Não há agendamentos para esta data."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments
                .slice()
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((appointment) => {
                  const patient = patients.find((p) => p.id === appointment.patientId);
                  const mapsUrl = patient
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddressOneLine(patient.address))}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.patientName)}`;
                  const waDigits = patient ? toWhatsAppDigits(patient.phone) : "";
                  const confirmText = buildSessionConfirmationWhatsappText({
                    appointment,
                    patient,
                    therapistName: settings.therapistName,
                    clinicName: settings.clinicName,
                  });
                  return (
                    <div
                      key={appointment.id}
                      className={`flex flex-col gap-4 rounded-lg border p-4 transition hover:bg-muted/50 sm:flex-row sm:items-start sm:justify-between ${
                        appointment.id === nextAppointmentId ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span className="tabular-nums">
                              {endTimeLabel(appointment.time, appointment.duration)}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1 min-w-0">
                            <User className="h-4 w-4 shrink-0" />
                            <span className="truncate">{appointment.patientName}</span>
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Activity className="h-4 w-4 shrink-0" />
                            {appointment.type}
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              appointment.status === "confirmed"
                                ? "bg-sky-100 text-sky-900"
                                : appointment.status === "scheduled"
                                  ? "bg-amber-100 text-amber-900"
                                  : appointment.status === "completed"
                                    ? "bg-emerald-100 text-emerald-900"
                                    : "bg-red-100 text-red-800 line-through"
                            }`}
                          >
                            {appointment.status === "confirmed"
                              ? "Confirmado"
                              : appointment.status === "scheduled"
                                ? "Agendado"
                                : appointment.status === "completed"
                                  ? "Concluído"
                                  : "Cancelado"}
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              appointment.paymentStatus === "paid"
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {appointment.paymentStatus === "paid" ? "Pago" : "Pag. pendente"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" asChild className="gap-1">
                          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            Mapa
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          type="button"
                          onClick={() => {
                            if (!waDigits) {
                              toast.error("Paciente sem telefone válido para WhatsApp.");
                              return;
                            }
                            void navigator.clipboard.writeText(confirmText);
                            toast.success("Mensagem copiada. Abra o WhatsApp para colar.");
                            window.open(buildWhatsAppLink(waDigits, confirmText), "_blank");
                          }}
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          className="gap-1"
                          onClick={() => onTogglePayment(appointment)}
                        >
                          <Banknote className="h-4 w-4" />
                          {appointment.paymentStatus === "paid" ? "Desmarcar pago" : "Pago"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(appointment)}
                          aria-label="Editar agendamento"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteRequest(appointment.id)}
                          className="text-red-600 hover:text-red-700"
                          aria-label="Excluir agendamento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
