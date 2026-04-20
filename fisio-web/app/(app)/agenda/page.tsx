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
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppointmentFormFields } from "@/components/agenda/appointment-form-fields";
import { AgendaAppointmentList } from "@/components/agenda/agenda-appointment-list";
import { AgendaMonthView } from "@/components/agenda/agenda-month-view";
import { AgendaWeekView } from "@/components/agenda/agenda-week-view";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useMockData } from "@/components/mock-data-provider";
import { useClinicSettings } from "@/lib/clinic-settings";
import {
  appointmentFormSchema,
  emptyAppointmentForm,
  type AppointmentFormValues,
} from "@/lib/schemas/appointment-form";
import { parseLocalDate, toLocalDateString } from "@/lib/date-utils";
import {
  closestWorkingDayInWeek,
  isWorkingDate,
  normalizeWorkingWeekdays,
} from "@/lib/schedule-utils";
import type { Appointment } from "@/lib/types";
import { Plus } from "lucide-react";

type AgendaViewMode = "month" | "week";

export default function AgendaPage() {
  const {
    patients,
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
  } = useMockData();

  const { settings } = useClinicSettings();
  const patientOptions = patients.map((p) => ({ id: p.id, name: p.name }));
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
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

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    const matchesDate = apt.date === selectedDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

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

  const onCreateSubmit = (values: AppointmentFormValues) => {
    const patient = patients.find((p) => p.id === parseInt(values.patientId, 10));
    if (!patient) return;

    addAppointment({
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
    setIsCreateDialogOpen(false);
    createForm.reset(emptyAppointmentForm(selectedDate));
    toast.success("Agendamento criado.");
  };

  const onEditSubmit = (values: AppointmentFormValues) => {
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

  const openEditModal = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    editForm.reset({
      patientId: appointment.patientId.toString(),
      date: appointment.date,
      time: appointment.time,
      duration: String(appointment.duration) as AppointmentFormValues["duration"],
      type: appointment.type,
      status: appointment.status,
      paymentStatus: appointment.paymentStatus ?? "pending",
      notes: appointment.notes ?? "",
    });
    setIsEditDialogOpen(true);
  };

  const handleTogglePayment = (appointment: Appointment) => {
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
    if (!isCreateDialogOpen || isEditDialogOpen) return;
    createForm.setValue("date", selectedDate);
  }, [selectedDate, isCreateDialogOpen, isEditDialogOpen, createForm]);

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
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              if (open) {
                createForm.reset(emptyAppointmentForm(selectedDate));
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Novo Agendamento</DialogTitle>
                <DialogDescription>
                  Crie um novo agendamento para um paciente.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={createForm.handleSubmit(onCreateSubmit)}
                className="space-y-0"
              >
                <AppointmentFormFields
                  control={createForm.control}
                  errors={createForm.formState.errors}
                  patients={patientOptions}
                  idPrefix="create-"
                />
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button type="submit">Criar agendamento</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-6">
        {viewMode === "month" ? (
          <AgendaMonthView
            currentDate={currentDate}
            selectedDate={selectedDate}
            appointments={appointments}
            workingWeekdays={workingWeekdays}
            onNavigate={navigateMonth}
            onSelectDay={handleSelectDay}
          />
        ) : (
          <AgendaWeekView
            anchorDate={currentDate}
            selectedDate={selectedDate}
            appointments={appointments}
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
        title="Excluir agendamento?"
        description="Esta ação não pode ser desfeita. O registro será removido do mock local."
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => {
          if (appointmentToDeleteId == null) return;
          deleteAppointment(appointmentToDeleteId);
          toast.success("Agendamento excluído.");
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
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar agendamento</DialogTitle>
            <DialogDescription>
              Modifique os detalhes do agendamento.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-0">
            <AppointmentFormFields
              control={editForm.control}
              errors={editForm.formState.errors}
              patients={patientOptions}
              idPrefix="edit-"
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="submit">Salvar alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
