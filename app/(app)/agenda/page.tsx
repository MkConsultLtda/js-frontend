"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppointmentFormFields } from "@/components/agenda/appointment-form-fields";
import { AgendaAppointmentList } from "@/components/agenda/agenda-appointment-list";
import { AgendaColorLegend } from "@/components/agenda/agenda-color-legend";
import { AgendaMonthView } from "@/components/agenda/agenda-month-view";
import { AgendaWeekView } from "@/components/agenda/agenda-week-view";
import { RecurringBlockDialog } from "@/components/agenda/recurring-block-dialog";
import { RecurringSessionForm } from "@/components/agenda/recurring-session-form";
import { parseMoneyInput } from "@/lib/appointment-payment";
import type { AgendaDaySortOrder } from "@/lib/list-sort";
import { sortAgendaDay } from "@/lib/list-sort";
import { CalendarExtraFormFields } from "@/components/agenda/calendar-extra-form-fields";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatUserFacingApiError } from "@/lib/api/backend-client";
import {
  dtoAgendaPayloadSession,
} from "@/lib/api/fisio-api";
import {
  useAggregateEvoluco,
  useAppointmentRange,
  useAgendaMutations,
  useHolidays,
  usePatientsSearch,
} from "@/lib/api/hooks/use-fisio";
import { computeAgendaFetchRange } from "@/lib/agenda-api-range";
import { useClinicSettings } from "@/lib/clinic-settings";
import {
  appointmentFormSchema,
  emptyAppointmentForm,
  type AppointmentFormValues,
} from "@/lib/schemas/appointment-form";
import {
  calendarExtraFormSchema,
  emptyCalendarExtraForm,
  type CalendarExtraFormValues,
} from "@/lib/schemas/calendar-extra-form";
import { buildCalendarExtraDates } from "@/lib/agenda-extra-dates";
import { formatIsoDateToBR, parseLocalDate, toLocalDateString } from "@/lib/date-utils";
import {
  appointmentsOverlap,
  calculateDurationFromTimeRange,
  formatRange,
  minutesToTime,
} from "@/lib/agenda-scheduling";
import { parseTimeToMinutes } from "@/lib/agenda-calendar-utils";
import {
  closestWorkingDayInWeek,
  isWorkingDate,
  normalizeWorkingWeekdays,
} from "@/lib/schedule-utils";
import { isSessionAppointment, type Appointment, type CalendarEntryKind } from "@/lib/types";
import { ChevronDown, Plus } from "lucide-react";

type AgendaViewMode = "month" | "week";
type CreateSessionMode = "single" | "package";
type ScheduleCandidate = {
  date: string;
  time: string;
  duration: number;
  label: string;
};

export default function AgendaPage() {
  const [viewMode, setViewMode] = React.useState<AgendaViewMode>("month");
  const [currentDate, setCurrentDate] = React.useState(() => new Date());
  const [selectedDate, setSelectedDate] = React.useState(() =>
    toLocalDateString(new Date())
  );
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [paymentFilter, setPaymentFilter] = React.useState<"all" | "pending" | "paid">("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createKind, setCreateKind] = React.useState<"session" | "block" | "personal">("session");
  const [createSessionMode, setCreateSessionMode] = React.useState<CreateSessionMode>("single");
  const [daySortOrder, setDaySortOrder] = React.useState<AgendaDaySortOrder>("time");
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] =
    React.useState<Appointment | null>(null);
  const [appointmentToDeleteId, setAppointmentToDeleteId] = React.useState<number | null>(
    null
  );
  const [conflictDialogOpen, setConflictDialogOpen] = React.useState(false);
  const [conflictDialogDescription, setConflictDialogDescription] = React.useState("");
  const [pendingConflictAction, setPendingConflictAction] = React.useState<
    (() => void | Promise<void>) | null
  >(null);

  const { settings } = useClinicSettings();

  const range = React.useMemo(
    () => computeAgendaFetchRange(currentDate, viewMode),
    [currentDate, viewMode],
  );

  const {
    data: patientPage,
    isLoading: isPatientsLoading,
    error: patientsError,
  } = usePatientsSearch("");
  const patients = patientPage?.content ?? [];

  const {
    data: appointments = [],
    isLoading: isAppointmentsLoading,
    error: appointmentsError,
  } = useAppointmentRange(range.from, range.to);

  const evWindow = React.useMemo(
    () => ({
      from: `${currentDate.getFullYear()}-01-01`,
      to: `${currentDate.getFullYear()}-12-31`,
    }),
    [currentDate],
  );

  const {
    data: evolucoes = [],
    isLoading: isEvolucoesLoading,
    error: evolucoesError,
  } = useAggregateEvoluco(evWindow.from, evWindow.to, true);

  const {
    createAppointment,
    replaceAppointment,
    deleteAppointment,
  } = useAgendaMutations(range.from, range.to);
  const isMutatingAgenda =
    createAppointment.isPending ||
    replaceAppointment.isPending ||
    deleteAppointment.isPending;

  const holidayYear = currentDate.getFullYear();
  const { data: holidays = [] } = useHolidays(holidayYear);

  const patientOptions = patients.map((p) => ({ id: p.id, name: p.name }));

  const durationOptions = React.useMemo(() => {
    return settings.appointmentDurations.length > 0 ? settings.appointmentDurations : [60, 90, 120];
  }, [settings.appointmentDurations]);
  const typeOptions = React.useMemo(() => {
    return settings.appointmentTypes.length > 0
      ? settings.appointmentTypes
      : [
          "Avaliação fisioterapêutica",
          "Fisioterapia",
          "Liberação Miofascial",
          "Drenagem linfática",
        ];
  }, [settings.appointmentTypes]);
  const workingWeekdays = React.useMemo(
    () => normalizeWorkingWeekdays(settings.workingWeekdays),
    [settings.workingWeekdays],
  );

  const createForm = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: emptyAppointmentForm(toLocalDateString(new Date()), settings.sessionPrice),
  });

  const editForm = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: emptyAppointmentForm(toLocalDateString(new Date()), settings.sessionPrice),
  });

  const createExtraForm = useForm<CalendarExtraFormValues>({
    resolver: zodResolver(calendarExtraFormSchema),
    defaultValues: emptyCalendarExtraForm(toLocalDateString(new Date())),
  });

  const editExtraForm = useForm<CalendarExtraFormValues>({
    resolver: zodResolver(calendarExtraFormSchema),
    defaultValues: emptyCalendarExtraForm(toLocalDateString(new Date())),
  });

  const filteredAppointments = React.useMemo(() => {
    const list = appointments.filter((apt) => {
      if (!isSessionAppointment(apt)) return false;
      const matchesSearch =
        apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
      const matchesPayment =
        paymentFilter === "all" ||
        apt.paymentStatus === paymentFilter;
      const matchesDate = apt.date === selectedDate;
      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
    return sortAgendaDay(list, daySortOrder);
  }, [appointments, searchTerm, statusFilter, paymentFilter, selectedDate, daySortOrder]);

  const dayAppointments = React.useMemo(
    () =>
      appointments.filter(
        (apt) => isSessionAppointment(apt) && apt.date === selectedDate
      ),
    [appointments, selectedDate]
  );

  const navigateMonth = React.useCallback(
    (direction: "prev" | "next" | "today") => {
      if (direction === "today") {
        const todayKey = toLocalDateString(new Date());
        setCurrentDate(parseLocalDate(todayKey));
        setSelectedDate(todayKey);
        return;
      }
      const newDate = new Date(currentDate);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      setCurrentDate(newDate);
      setSelectedDate(toLocalDateString(newDate));
    },
    [currentDate]
  );

  const navigateWeek = React.useCallback(
    (direction: "prev" | "next" | "today") => {
      if (direction === "today") {
        const todayKey = toLocalDateString(new Date());
        setCurrentDate(parseLocalDate(todayKey));
        setSelectedDate(todayKey);
        return;
      }
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + (direction === "prev" ? -7 : 7));
      setCurrentDate(newDate);
      setSelectedDate((prev) => {
        const p = parseLocalDate(prev);
        p.setDate(p.getDate() + (direction === "prev" ? -7 : 7));
        return toLocalDateString(p);
      });
    },
    [currentDate]
  );

  const handleSelectDay = (day: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(day);
    setCurrentDate(newDate);
    setSelectedDate(toLocalDateString(newDate));
  };

  const handleSelectDateKey = (dateKey: string) => {
    setSelectedDate(dateKey);
    setCurrentDate(parseLocalDate(dateKey));
  };

  const findScheduleConflicts = React.useCallback(
    (candidates: ScheduleCandidate[], ignoreAppointmentId?: number) => {
      const activeAppointments = appointments.filter(
        (existing) => existing.id !== ignoreAppointmentId && existing.status !== "cancelled"
      );
      const conflictSummaries: string[] = [];

      for (const candidate of candidates) {
        const conflicting = activeAppointments.filter(
          (existing) =>
            existing.date === candidate.date &&
            appointmentsOverlap(
              { time: candidate.time, duration: candidate.duration },
              { time: existing.time, duration: existing.duration }
            )
        );

        for (const existing of conflicting) {
          conflictSummaries.push(
            `${parseLocalDate(existing.date).toLocaleDateString("pt-BR")} · ${formatRange(
              existing.time,
              existing.duration
            )} (${existing.patientName})`
          );
        }
      }

      return [...new Set(conflictSummaries)];
    },
    [appointments]
  );

  const executeWithConflictConfirmation = React.useCallback(
    async (params: {
      candidates: ScheduleCandidate[];
      onContinue: (allowOverlap: boolean) => void | Promise<void>;
      ignoreAppointmentId?: number;
      actionLabel: string;
    }): Promise<void> => {
      const conflicts = findScheduleConflicts(params.candidates, params.ignoreAppointmentId);
      if (conflicts.length === 0) {
        await params.onContinue(false);
        return;
      }

      const preview = conflicts.slice(0, 4).join("; ");
      const suffix =
        conflicts.length > 4 ? ` (+${conflicts.length - 4} conflito(s) adicional(is))` : "";
      setConflictDialogDescription(
        `${params.actionLabel} conflita com: ${preview}${suffix}. Deseja salvar mesmo assim?`
      );
      setPendingConflictAction(() => async () => {
        await params.onContinue(true);
      });
      setConflictDialogOpen(true);
    },
    [findScheduleConflicts]
  );

  const hasEvolucaoForAppointmentDate = React.useCallback(
    (patientId: number, isoDate: string) => {
      return evolucoes.some(
        (ev) =>
          ev.patientId === patientId &&
          (ev.dataSessao === isoDate ||
            ev.dataSessao === formatIsoDateToBR(isoDate)),
      );
    },
    [evolucoes],
  );

  const agendaPayloadFromForm = (
    appointment: Pick<Appointment, "kind" | "patientId" | "patientName">,
    values: AppointmentFormValues,
    duration: number,
  ) =>
    dtoAgendaPayloadSession({
      kind: appointment.kind ?? "session",
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      date: values.date,
      time: values.time,
      duration,
      type: values.type,
      status: values.status,
      notes: values.notes?.trim() || undefined,
      paymentStatus: values.paymentStatus,
      sessionAmount: parseMoneyInput(values.sessionAmount),
    });

  const onCreateSessionSubmit = async (values: AppointmentFormValues) => {
    const patient = patients.find((p) => p.id === parseInt(values.patientId, 10));
    if (!patient) return;
    if (values.status === "completed" && !hasEvolucaoForAppointmentDate(patient.id, values.date)) {
      toast.error(
        "Para marcar como concluído, registre uma evolução do paciente na mesma data do atendimento."
      );
      return;
    }
    const duration = parseInt(values.duration, 10);
    const payload = agendaPayloadFromForm(
      { kind: "session", patientId: patient.id, patientName: patient.name },
      values,
      duration,
    );

    await executeWithConflictConfirmation({
      candidates: [{ date: values.date, time: values.time, duration, label: patient.name }],
      actionLabel: "Este atendimento",
      onContinue: async (allowOverlap) => {
        try {
          await createAppointment.mutateAsync({
            body: payload,
            allowOverlap,
          });
          setCreateOpen(false);
          createForm.reset(emptyAppointmentForm(selectedDate, settings.sessionPrice));
          toast.success("Agendamento criado.");
        } catch (err) {
          toast.error(
            formatUserFacingApiError(err, "Não foi possível criar o agendamento."),
          );
        }
      },
    });
  };

  const onCreateExtraSubmit = async (values: CalendarExtraFormValues) => {
    const kind: CalendarEntryKind = createKind === "block" ? "block" : "personal";
    const title = values.title.trim();
    const duration = values.isAllDay
      ? 24 * 60
      : calculateDurationFromTimeRange(values.time, values.endTime);
    if (!duration) {
      toast.error("Informe um horário final maior que o inicial.");
      return;
    }

    const dates = buildCalendarExtraDates(values);
    if (dates.length === 0) {
      toast.error(
        values.isAllDay
          ? "Informe uma data final válida em «Até (dia)» para bloquear vários dias seguidos."
          : "Nenhum dia no período combina com os dias da semana marcados. Ajuste «Repetir até» ou use o atalho Seg–sex.",
      );
      return;
    }
    const entries = dates.map((date) => ({
      kind,
      patientId: 0,
      patientName: title,
      date,
      time: values.isAllDay ? "00:00" : values.time,
      duration,
      type: kind === "block" ? "Bloqueio" : "Evento pessoal",
      status: "confirmed" as const,
      notes: values.notes?.trim() || undefined,
      paymentStatus: "pending" as const,
    }));

    await executeWithConflictConfirmation({
      candidates: entries.map((entry) => ({
        date: entry.date,
        time: entry.time,
        duration: entry.duration,
        label: entry.patientName,
      })),
      actionLabel: "Este bloqueio/evento",
      onContinue: async (allowOverlap) => {
        try {
          for (const entry of entries) {
            await createAppointment.mutateAsync({
              body: dtoAgendaPayloadSession(entry),
              allowOverlap,
            });
          }
          setCreateOpen(false);
          createExtraForm.reset(emptyCalendarExtraForm(selectedDate));
          toast.success(
            kind === "block"
              ? entries.length > 1
                ? `${entries.length} bloqueios criados.`
                : "Horário bloqueado."
              : entries.length > 1
                ? `${entries.length} eventos adicionados.`
                : "Evento adicionado.",
          );
        } catch (err) {
          toast.error(formatUserFacingApiError(err, "Não foi possível salvar."));
        }
      },
    });
  };

  const onEditSessionSubmit = async (values: AppointmentFormValues) => {
    if (!editingAppointment) return;
    const patient = patients.find((p) => p.id === parseInt(values.patientId, 10));
    if (!patient) return;
    if (values.status === "completed" && !hasEvolucaoForAppointmentDate(patient.id, values.date)) {
      toast.error(
        "Não é possível concluir sem evolução vinculada à data do atendimento."
      );
      return;
    }
    const duration = parseInt(values.duration, 10);
    const body = agendaPayloadFromForm(
      {
        kind: editingAppointment.kind,
        patientId: patient.id,
        patientName: patient.name,
      },
      values,
      duration,
    );
    const updated = {
      ...editingAppointment,
      patientId: patient.id,
      patientName: patient.name,
      date: values.date,
      time: values.time,
      duration,
      type: values.type,
      status: values.status,
      notes: values.notes?.trim() || undefined,
      paymentStatus: values.paymentStatus,
      sessionAmount: parseMoneyInput(values.sessionAmount),
    };

    await executeWithConflictConfirmation({
      candidates: [{ date: updated.date, time: updated.time, duration: updated.duration, label: updated.patientName }],
      ignoreAppointmentId: editingAppointment.id,
      actionLabel: "Esta alteração",
      onContinue: async (allowOverlap) => {
        try {
          await replaceAppointment.mutateAsync({
            id: editingAppointment.id,
            body,
            allowOverlap,
          });
          setIsEditDialogOpen(false);
          setEditingAppointment(null);
          editForm.reset(emptyAppointmentForm(selectedDate, settings.sessionPrice));
          toast.success("Agendamento atualizado.");
        } catch (err) {
          toast.error(formatUserFacingApiError(err, "Não foi possível atualizar."));
        }
      },
    });
  };

  const onEditExtraSubmit = async (values: CalendarExtraFormValues) => {
    if (!editingAppointment || isSessionAppointment(editingAppointment)) return;
    const duration = values.isAllDay
      ? 24 * 60
      : calculateDurationFromTimeRange(values.time, values.endTime);
    if (!duration) {
      toast.error("Informe um horário final maior que o inicial.");
      return;
    }
    const updated = {
      ...editingAppointment,
      patientName: values.title.trim(),
      date: values.date,
      time: values.isAllDay ? "00:00" : values.time,
      duration,
      notes: values.notes?.trim() || undefined,
    };

    await executeWithConflictConfirmation({
      candidates: [{ date: updated.date, time: updated.time, duration: updated.duration, label: updated.patientName }],
      ignoreAppointmentId: editingAppointment.id,
      actionLabel: "Esta alteração",
      onContinue: async (allowOverlap) => {
        try {
          await replaceAppointment.mutateAsync({
            id: editingAppointment!.id,
            body: dtoAgendaPayloadSession(updated),
            allowOverlap,
          });
          setIsEditDialogOpen(false);
          setEditingAppointment(null);
          editExtraForm.reset(emptyCalendarExtraForm(selectedDate));
          toast.success("Registro atualizado.");
        } catch (err) {
          toast.error(formatUserFacingApiError(err, "Não foi possível atualizar."));
        }
      },
    });
  };

  const openEditModal = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    if (isSessionAppointment(appointment)) {
      editForm.reset({
        patientId: appointment.patientId.toString(),
        date: appointment.date,
        time: appointment.time,
        duration: String(appointment.duration),
        type: appointment.type,
        status: appointment.status,
        paymentStatus: appointment.paymentStatus ?? "pending",
        sessionAmount:
          appointment.sessionAmount != null
            ? String(appointment.sessionAmount).replace(".", ",")
            : String(settings.sessionPrice),
        notes: appointment.notes ?? "",
      });
    } else {
      const endMinutes = parseTimeToMinutes(appointment.time) + appointment.duration;
      const isAllDay = appointment.time === "00:00" && appointment.duration >= 24 * 60 - 1;
      editExtraForm.reset({
        title: appointment.patientName,
        date: appointment.date,
        time: isAllDay ? "" : appointment.time,
        endTime: isAllDay ? "" : minutesToTime(endMinutes),
        isAllDay,
        repeatEnabled: false,
        repeatWeekdays: [],
        repeatUntil: "",
        notes: appointment.notes ?? "",
      });
    }
    setIsEditDialogOpen(true);
  };

  const handleTogglePayment = (appointment: Appointment) => {
    if (!isSessionAppointment(appointment)) return;
    const nextPaid = appointment.paymentStatus === "paid" ? "pending" : "paid";
    void (async () => {
      try {
        await replaceAppointment.mutateAsync({
          id: appointment.id,
          body: dtoAgendaPayloadSession({
            ...appointment,
            paymentStatus: nextPaid,
            sessionAmount: appointment.sessionAmount ?? settings.sessionPrice,
          }),
        });
        toast.message(nextPaid === "paid" ? "Marcado como pago." : "Marcado como não pago.");
      } catch (err) {
        toast.error(formatUserFacingApiError(err, "Não foi possível atualizar pagamento."));
      }
    })();
  };

  React.useEffect(() => {
    if (!createOpen || isEditDialogOpen) return;
    createForm.setValue("date", selectedDate);
    createExtraForm.setValue("date", selectedDate);
  }, [selectedDate, createOpen, isEditDialogOpen, createForm, createExtraForm]);

  React.useEffect(() => {
    if (isWorkingDate(parseLocalDate(selectedDate), workingWeekdays)) return;
    const snapped = closestWorkingDayInWeek(selectedDate, workingWeekdays);
    if (snapped !== selectedDate) {
      setSelectedDate(snapped);
      setCurrentDate(parseLocalDate(snapped));
    }
  }, [selectedDate, workingWeekdays]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Visualização em estilo calendário: mês com atendimentos no próprio grid e semana com horários
            e duração.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="inline-flex rounded-lg border bg-muted/40 p-1">
            <Button
              type="button"
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              className="px-4"
              onClick={() => {
                setViewMode("month");
                setCurrentDate(parseLocalDate(selectedDate));
              }}
            >
              Mês
            </Button>
            <Button
              type="button"
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="px-4"
              onClick={() => {
                setViewMode("week");
                setCurrentDate(parseLocalDate(selectedDate));
              }}
            >
              Semana
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo na agenda
                <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onSelect={() => {
                  setCreateKind("session");
                  setCreateSessionMode("single");
                  createForm.reset(emptyAppointmentForm(selectedDate, settings.sessionPrice));
                  setCreateOpen(true);
                }}
              >
                Atendimento
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setCreateKind("block");
                  createExtraForm.reset(emptyCalendarExtraForm(selectedDate));
                  setCreateOpen(true);
                }}
              >
                Bloquear horário
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setCreateKind("personal");
                  createExtraForm.reset(emptyCalendarExtraForm(selectedDate));
                  setCreateOpen(true);
                }}
              >
                Evento pessoal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <RecurringBlockDialog
            from={range.from}
            to={range.to}
            durationOptions={durationOptions}
          />

          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (open) {
                if (createKind === "session") {
                  setCreateSessionMode("single");
                  createForm.reset(emptyAppointmentForm(selectedDate, settings.sessionPrice));
                } else {
                  createExtraForm.reset(emptyCalendarExtraForm(selectedDate));
                }
              }
            }}
          >
            <DialogContent className={createKind === "session" && createSessionMode === "package" ? "sm:max-w-lg max-h-[90vh] overflow-y-auto" : "sm:max-w-[425px]"}>
              <DialogHeader>
                <DialogTitle>
                  {createKind === "session"
                    ? "Novo atendimento"
                    : createKind === "block"
                      ? "Bloquear horário"
                      : "Evento pessoal"}
                </DialogTitle>
                <DialogDescription>
                  {createKind === "session"
                    ? "Escolha sessão avulsa ou pacote com várias sessões recorrentes."
                    : createKind === "block"
                      ? "Reserve o intervalo na agenda (não aparece como atendimento na lista do dia)."
                      : "Marque compromissos pessoais (cor roxa na grade)."}
                </DialogDescription>
              </DialogHeader>
              {createKind === "session" ? (
                <>
                  <div className="inline-flex w-full rounded-lg border bg-muted/40 p-1">
                    <Button
                      type="button"
                      variant={createSessionMode === "single" ? "default" : "ghost"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setCreateSessionMode("single")}
                    >
                      Sessão avulsa
                    </Button>
                    <Button
                      type="button"
                      variant={createSessionMode === "package" ? "default" : "ghost"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setCreateSessionMode("package")}
                    >
                      Pacote de sessões
                    </Button>
                  </div>
                  {createSessionMode === "single" ? (
                    <form
                      onSubmit={createForm.handleSubmit(onCreateSessionSubmit)}
                      className="space-y-0"
                    >
                      <AppointmentFormFields
                        control={createForm.control}
                        errors={createForm.formState.errors}
                        patients={patientOptions}
                        durationOptions={durationOptions}
                        typeOptions={typeOptions}
                        idPrefix="create-"
                        defaultSessionPrice={settings.sessionPrice}
                      />
                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="submit" disabled={isMutatingAgenda}>
                          {createAppointment.isPending ? "Criando…" : "Criar sessão"}
                        </Button>
                      </DialogFooter>
                    </form>
                  ) : (
                    <RecurringSessionForm
                      from={range.from}
                      to={range.to}
                      patients={patientOptions}
                      durationOptions={durationOptions}
                      typeOptions={typeOptions}
                      defaultStartDate={selectedDate}
                      defaultSessionPrice={settings.sessionPrice}
                      onSuccess={() => {
                        setCreateOpen(false);
                        setCreateSessionMode("single");
                      }}
                    />
                  )}
                </>
              ) : (
                <form
                  onSubmit={createExtraForm.handleSubmit(onCreateExtraSubmit)}
                  className="space-y-0"
                >
                  <CalendarExtraFormFields
                    control={createExtraForm.control}
                    errors={createExtraForm.formState.errors}
                    setValue={createExtraForm.setValue}
                    getValues={createExtraForm.getValues}
                    idPrefix="create-extra-"
                    titleLabel={createKind === "block" ? "Motivo do bloqueio" : "Título do evento"}
                  />
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="submit" disabled={isMutatingAgenda}>
                      {createAppointment.isPending ? "Adicionando…" : "Adicionar"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <AgendaColorLegend />

      <div className="space-y-6">
        {(isPatientsLoading || isAppointmentsLoading || isEvolucoesLoading) && (
          <p className="text-sm text-muted-foreground">Carregando agenda…</p>
        )}
        {(patientsError || appointmentsError || evolucoesError) && (
          <p className="text-sm text-destructive">
            Não foi possível carregar todos os dados da agenda. Verifique conexão e sessão.
          </p>
        )}
        {viewMode === "month" ? (
          <AgendaMonthView
            currentDate={currentDate}
            selectedDate={selectedDate}
            appointments={appointments}
            holidays={holidays}
            workingWeekdays={workingWeekdays}
            onNavigate={navigateMonth}
            onSelectDay={handleSelectDay}
            onAppointmentClick={openEditModal}
          />
        ) : (
          <AgendaWeekView
            anchorDate={currentDate}
            selectedDate={selectedDate}
            appointments={appointments}
            holidays={holidays}
            workingWeekdays={workingWeekdays}
            onNavigate={navigateWeek}
            onSelectDateKey={handleSelectDateKey}
            onAppointmentClick={openEditModal}
          />
        )}

        <AgendaAppointmentList
          selectedDate={selectedDate}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={setPaymentFilter}
          filteredAppointments={filteredAppointments}
          dayAppointments={dayAppointments}
          patients={patients}
          settings={settings}
          onEdit={openEditModal}
          onDeleteRequest={setAppointmentToDeleteId}
          onTogglePayment={handleTogglePayment}
          daySortOrder={daySortOrder}
          onDaySortOrderChange={setDaySortOrder}
        />
      </div>

      <ConfirmDialog
        open={appointmentToDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setAppointmentToDeleteId(null);
        }}
        title="Excluir registro da agenda?"
        description="Esta ação não pode ser desfeita. O agendamento será removido da sua agenda."
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={async () => {
          if (appointmentToDeleteId == null) return;
          try {
            await deleteAppointment.mutateAsync(appointmentToDeleteId);
            toast.success("Registro excluído.");
          } catch (err) {
            toast.error(formatUserFacingApiError(err, "Não foi possível excluir."));
            throw err;
          }
        }}
      />

      <ConfirmDialog
        open={conflictDialogOpen}
        onOpenChange={(open) => {
          setConflictDialogOpen(open);
          if (!open) {
            setPendingConflictAction(null);
          }
        }}
        title="Conflito de horário detectado"
        description={conflictDialogDescription}
        confirmLabel="Salvar mesmo assim"
        cancelLabel="Revisar horário"
        variant="default"
        onConfirm={async () => {
          const action = pendingConflictAction;
          setPendingConflictAction(null);
          if (!action) return;
          await action();
        }}
      />

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingAppointment(null);
            editForm.reset(emptyAppointmentForm(selectedDate, settings.sessionPrice));
            editExtraForm.reset(emptyCalendarExtraForm(selectedDate));
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingAppointment && isSessionAppointment(editingAppointment)
                ? "Editar atendimento"
                : "Editar bloqueio ou evento"}
            </DialogTitle>
            <DialogDescription>
              {editingAppointment && isSessionAppointment(editingAppointment)
                ? "Altere os dados da sessão."
                : "Altere horário, título ou observações."}
            </DialogDescription>
          </DialogHeader>
          {editingAppointment && isSessionAppointment(editingAppointment) ? (
            <form onSubmit={editForm.handleSubmit(onEditSessionSubmit)} className="space-y-0">
              <AppointmentFormFields
                control={editForm.control}
                errors={editForm.formState.errors}
                patients={patientOptions}
                durationOptions={durationOptions}
                typeOptions={typeOptions}
                idPrefix="edit-"
                defaultSessionPrice={settings.sessionPrice}
              />
              <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                {editingAppointment ? (
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full sm:order-first sm:w-auto"
                    onClick={() => {
                      setAppointmentToDeleteId(editingAppointment.id);
                      setIsEditDialogOpen(false);
                    }}
                  >
                    Excluir da agenda
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  className="w-full sm:ml-auto sm:w-auto"
                  disabled={isMutatingAgenda}
                >
                  {replaceAppointment.isPending ? "Salvando…" : "Salvar alterações"}
                </Button>
              </DialogFooter>
            </form>
          ) : editingAppointment ? (
            <form onSubmit={editExtraForm.handleSubmit(onEditExtraSubmit)} className="space-y-0">
              <CalendarExtraFormFields
                control={editExtraForm.control}
                errors={editExtraForm.formState.errors}
                setValue={editExtraForm.setValue}
                getValues={editExtraForm.getValues}
                idPrefix="edit-extra-"
                titleLabel={
                  editingAppointment.kind === "block" ? "Motivo do bloqueio" : "Título do evento"
                }
              />
              <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full sm:order-first sm:w-auto"
                  onClick={() => {
                    setAppointmentToDeleteId(editingAppointment.id);
                    setIsEditDialogOpen(false);
                  }}
                >
                  Excluir da agenda
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:ml-auto sm:w-auto"
                  disabled={isMutatingAgenda}
                >
                  {replaceAppointment.isPending ? "Salvando…" : "Salvar alterações"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
