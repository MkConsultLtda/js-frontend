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
import { CalendarExtraFormFields } from "@/components/agenda/calendar-extra-form-fields";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useMockData } from "@/components/mock-data-provider";
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
import { parseLocalDate, toLocalDateString } from "@/lib/date-utils";
import {
  closestWorkingDayInWeek,
  isWorkingDate,
  normalizeWorkingWeekdays,
} from "@/lib/schedule-utils";
import { isSessionAppointment, type Appointment } from "@/lib/types";
import { ChevronDown, Plus } from "lucide-react";

type AgendaViewMode = "month" | "week";

export default function AgendaPage() {
  const {
    patients,
    appointments,
    holidays,
    addAppointment,
    updateAppointment,
    deleteAppointment,
  } = useMockData();

  const { settings } = useClinicSettings();
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
    [settings.workingWeekdays]
  );

  const [viewMode, setViewMode] = React.useState<AgendaViewMode>("month");
  const [currentDate, setCurrentDate] = React.useState(() => new Date());
  const [selectedDate, setSelectedDate] = React.useState(() =>
    toLocalDateString(new Date())
  );
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createKind, setCreateKind] = React.useState<"session" | "block" | "personal">("session");
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] =
    React.useState<Appointment | null>(null);
  const [appointmentToDeleteId, setAppointmentToDeleteId] = React.useState<number | null>(
    null
  );

  const createForm = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: emptyAppointmentForm(toLocalDateString(new Date())),
  });

  const editForm = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: emptyAppointmentForm(toLocalDateString(new Date())),
  });

  const createExtraForm = useForm<CalendarExtraFormValues>({
    resolver: zodResolver(calendarExtraFormSchema),
    defaultValues: emptyCalendarExtraForm(toLocalDateString(new Date())),
  });

  const editExtraForm = useForm<CalendarExtraFormValues>({
    resolver: zodResolver(calendarExtraFormSchema),
    defaultValues: emptyCalendarExtraForm(toLocalDateString(new Date())),
  });

  const filteredAppointments = appointments.filter((apt) => {
    if (!isSessionAppointment(apt)) return false;
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    const matchesDate = apt.date === selectedDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

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

  const onCreateSessionSubmit = (values: AppointmentFormValues) => {
    const patient = patients.find((p) => p.id === parseInt(values.patientId, 10));
    if (!patient) return;

    addAppointment({
      kind: "session",
      patientId: patient.id,
      patientName: patient.name,
      date: values.date,
      time: values.time,
      duration: parseInt(values.duration, 10),
      type: values.type,
      status: values.status,
      notes: values.notes?.trim() || undefined,
      paymentStatus: values.paymentStatus,
    });
    setCreateOpen(false);
    createForm.reset(emptyAppointmentForm(selectedDate));
    toast.success("Agendamento criado.");
  };

  const onCreateExtraSubmit = (values: CalendarExtraFormValues) => {
    const kind = createKind === "block" ? "block" : "personal";
    addAppointment({
      kind,
      patientId: 0,
      patientName: values.title.trim(),
      date: values.date,
      time: values.time,
      duration: parseInt(values.duration, 10),
      type: kind === "block" ? "Bloqueio" : "Evento pessoal",
      status: "confirmed",
      notes: values.notes?.trim() || undefined,
      paymentStatus: "pending",
    });
    setCreateOpen(false);
    createExtraForm.reset(emptyCalendarExtraForm(selectedDate));
    toast.success(kind === "block" ? "Horário bloqueado." : "Evento adicionado.");
  };

  const onEditSessionSubmit = (values: AppointmentFormValues) => {
    if (!editingAppointment) return;
    const patient = patients.find((p) => p.id === parseInt(values.patientId, 10));
    if (!patient) return;

    updateAppointment({
      ...editingAppointment,
      patientId: patient.id,
      patientName: patient.name,
      date: values.date,
      time: values.time,
      duration: parseInt(values.duration, 10),
      type: values.type,
      status: values.status,
      notes: values.notes?.trim() || undefined,
      paymentStatus: values.paymentStatus,
    });
    setIsEditDialogOpen(false);
    setEditingAppointment(null);
    editForm.reset(emptyAppointmentForm(selectedDate));
    toast.success("Agendamento atualizado.");
  };

  const onEditExtraSubmit = (values: CalendarExtraFormValues) => {
    if (!editingAppointment || isSessionAppointment(editingAppointment)) return;
    updateAppointment({
      ...editingAppointment,
      patientName: values.title.trim(),
      date: values.date,
      time: values.time,
      duration: parseInt(values.duration, 10),
      notes: values.notes?.trim() || undefined,
    });
    setIsEditDialogOpen(false);
    setEditingAppointment(null);
    editExtraForm.reset(emptyCalendarExtraForm(selectedDate));
    toast.success("Registro atualizado.");
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
        notes: appointment.notes ?? "",
      });
    } else {
      editExtraForm.reset({
        title: appointment.patientName,
        date: appointment.date,
        time: appointment.time,
        duration: String(appointment.duration) as CalendarExtraFormValues["duration"],
        notes: appointment.notes ?? "",
      });
    }
    setIsEditDialogOpen(true);
  };

  const handleTogglePayment = (appointment: Appointment) => {
    if (!isSessionAppointment(appointment)) return;
    updateAppointment({
      ...appointment,
      paymentStatus: appointment.paymentStatus === "paid" ? "pending" : "paid",
    });
    toast.message(
      appointment.paymentStatus === "paid"
        ? "Marcado como pagamento pendente."
        : "Marcado como pago."
    );
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
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
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
                  createForm.reset(emptyAppointmentForm(selectedDate));
                  setCreateOpen(true);
                }}
              >
                Atendimento (paciente)
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
                Evento pessoal / trabalho fixo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (open) {
                if (createKind === "session") {
                  createForm.reset(emptyAppointmentForm(selectedDate));
                } else {
                  createExtraForm.reset(emptyCalendarExtraForm(selectedDate));
                }
              }
            }}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {createKind === "session"
                    ? "Novo atendimento"
                    : createKind === "block"
                      ? "Bloquear horário"
                      : "Evento pessoal ou trabalho"}
                </DialogTitle>
                <DialogDescription>
                  {createKind === "session"
                    ? "Agende uma sessão para um paciente."
                    : createKind === "block"
                      ? "Reserve o intervalo na agenda (não aparece como atendimento na lista do dia)."
                      : "Marque compromissos pessoais ou trabalho fixo (cor roxa na grade)."}
                </DialogDescription>
              </DialogHeader>
              {createKind === "session" ? (
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
                  />
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="submit">Criar</Button>
                  </DialogFooter>
                </form>
              ) : (
                <form
                  onSubmit={createExtraForm.handleSubmit(onCreateExtraSubmit)}
                  className="space-y-0"
                >
                  <CalendarExtraFormFields
                    control={createExtraForm.control}
                    errors={createExtraForm.formState.errors}
                    idPrefix="create-extra-"
                    titleLabel={createKind === "block" ? "Motivo do bloqueio" : "Título do evento"}
                  />
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="submit">Adicionar</Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <AgendaColorLegend />

      <div className="space-y-6">
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
          filteredAppointments={filteredAppointments}
          dayAppointments={dayAppointments}
          patients={patients}
          settings={settings}
          onEdit={openEditModal}
          onDeleteRequest={setAppointmentToDeleteId}
          onTogglePayment={handleTogglePayment}
        />
      </div>

      <ConfirmDialog
        open={appointmentToDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setAppointmentToDeleteId(null);
        }}
        title="Excluir registro da agenda?"
        description="Esta ação não pode ser desfeita. O item será removido do mock local."
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => {
          if (appointmentToDeleteId == null) return;
          deleteAppointment(appointmentToDeleteId);
          toast.success("Registro excluído.");
          setAppointmentToDeleteId(null);
        }}
      />

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingAppointment(null);
            editForm.reset(emptyAppointmentForm(selectedDate));
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
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="submit">Salvar alterações</Button>
              </DialogFooter>
            </form>
          ) : editingAppointment ? (
            <form onSubmit={editExtraForm.handleSubmit(onEditExtraSubmit)} className="space-y-0">
              <CalendarExtraFormFields
                control={editExtraForm.control}
                errors={editExtraForm.formState.errors}
                idPrefix="edit-extra-"
                titleLabel={
                  editingAppointment.kind === "block" ? "Motivo do bloqueio" : "Título do evento"
                }
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="submit">Salvar alterações</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
