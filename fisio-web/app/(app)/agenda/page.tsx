"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AppointmentFormFields,
  type AppointmentFormState,
} from "@/components/agenda/appointment-form-fields";
import { useMockData } from "@/components/mock-data-provider";
import { parseLocalDate, toLocalDateString } from "@/lib/date-utils";
import type { Appointment } from "@/lib/types";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Search,
  Activity,
  Edit,
  Trash2,
} from "lucide-react";

const dayNames = ["D", "S", "T", "Q", "Q", "S", "S"];

function emptyForm(selectedDate: string): AppointmentFormState {
  return {
    patientId: "",
    date: selectedDate,
    time: "",
    duration: "50",
    type: "",
    status: "confirmed",
    notes: "",
  };
}

export default function AgendaPage() {
  const {
    patients,
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
  } = useMockData();

  const patientOptions = patients.map((p) => ({ id: p.id, name: p.name }));

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
  const [formData, setFormData] = React.useState<AppointmentFormState>(() =>
    emptyForm(toLocalDateString(new Date()))
  );

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || apt.status === statusFilter;
    const matchesDate = apt.date === selectedDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const navigateMonth = (direction: "prev" | "next" | "today") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (direction === "next") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setTime(Date.now());
    }
    setCurrentDate(newDate);
    setSelectedDate(toLocalDateString(newDate));
  };

  const getDaysInCurrentMonth = () =>
    new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();

  const firstWeekdayOfMonth = () =>
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handleSelectDay = (day: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(day);
    setCurrentDate(newDate);
    setSelectedDate(toLocalDateString(newDate));
  };

  const selectedDay = parseLocalDate(selectedDate).getDate();

  const resetForm = () => {
    setFormData(emptyForm(selectedDate));
  };

  const handleCreateAppointment = () => {
    if (!formData.patientId || !formData.time || !formData.type) return;
    const patient = patients.find((p) => p.id === parseInt(formData.patientId, 10));
    if (!patient) return;

    addAppointment({
      patientId: patient.id,
      patientName: patient.name,
      date: formData.date,
      time: formData.time,
      duration: parseInt(formData.duration, 10),
      type: formData.type,
      status: formData.status,
      notes: formData.notes || undefined,
    });
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEditAppointment = () => {
    if (!editingAppointment) return;
    if (!formData.patientId || !formData.time || !formData.type) return;
    const patient = patients.find((p) => p.id === parseInt(formData.patientId, 10));
    if (!patient) return;

    updateAppointment({
      ...editingAppointment,
      patientId: patient.id,
      patientName: patient.name,
      date: formData.date,
      time: formData.time,
      duration: parseInt(formData.duration, 10),
      type: formData.type,
      status: formData.status,
      notes: formData.notes,
    });
    setIsEditDialogOpen(false);
    setEditingAppointment(null);
    resetForm();
  };

  const openEditModal = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      patientId: appointment.patientId.toString(),
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration.toString(),
      type: appointment.type,
      status: appointment.status,
      notes: appointment.notes ?? "",
    });
    setIsEditDialogOpen(true);
  };

  React.useEffect(() => {
    if (isEditDialogOpen) return;
    setFormData((prev) => ({ ...prev, date: selectedDate }));
  }, [selectedDate, isEditDialogOpen]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie seus agendamentos e consultas
          </p>
        </div>
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (open) resetForm();
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
            <AppointmentFormFields
              formData={formData}
              onChange={setFormData}
              patients={patientOptions}
              idPrefix="create-"
            />
            <DialogFooter>
              <Button type="button" onClick={handleCreateAppointment}>
                Criar Agendamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="space-y-4">
          <CardHeader className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <CardTitle className="text-lg">Calendário</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("today")}>
                Hoje
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {currentDate.toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase text-muted-foreground">
              {dayNames.map((day, index) => (
                <div key={index}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 42 }).map((_, index) => {
                const dayNumber = index - firstWeekdayOfMonth() + 1;
                const isActive =
                  dayNumber >= 1 && dayNumber <= getDaysInCurrentMonth();
                const isSelected = isActive && dayNumber === selectedDay;
                const hasAppointments =
                  isActive &&
                  appointments.some((apt) => {
                    const appointmentDate = parseLocalDate(apt.date);
                    return (
                      appointmentDate.getFullYear() === currentDate.getFullYear() &&
                      appointmentDate.getMonth() === currentDate.getMonth() &&
                      appointmentDate.getDate() === dayNumber
                    );
                  });

                return (
                  <button
                    type="button"
                    key={index}
                    disabled={!isActive}
                    onClick={() => isActive && handleSelectDay(dayNumber)}
                    className={`h-10 rounded-lg border text-sm transition ${
                      !isActive
                        ? "bg-transparent text-muted-foreground pointer-events-none"
                        : isSelected
                          ? "bg-primary text-white border-primary"
                          : "bg-background hover:bg-muted"
                    } ${hasAppointments && !isSelected ? "ring-1 ring-primary/30" : ""}`}
                  >
                    {isActive ? dayNumber : ""}
                  </button>
                );
              })}
            </div>
            <div className="rounded-xl border bg-muted p-4 text-sm text-muted-foreground">
              Dia selecionado:{" "}
              <span className="font-semibold text-foreground">
                {parseLocalDate(selectedDate).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Pacientes deste dia</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filteredAppointments.length} agendamento(s) para{" "}
                  {parseLocalDate(selectedDate).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar paciente ou tipo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full sm:w-72"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="confirmed">Confirmados</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="cancelled">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardContent>
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
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex flex-col gap-4 rounded-lg border p-4 transition hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {appointment.time}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {appointment.patientName}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Activity className="h-4 w-4" />
                              {appointment.type}
                            </span>
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                appointment.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : appointment.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {appointment.status === "confirmed"
                                ? "Confirmado"
                                : appointment.status === "pending"
                                  ? "Pendente"
                                  : "Cancelado"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(appointment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteAppointment(appointment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
            <DialogDescription>
              Modifique os detalhes do agendamento.
            </DialogDescription>
          </DialogHeader>
          <AppointmentFormFields
            formData={formData}
            onChange={setFormData}
            patients={patientOptions}
            idPrefix="edit-"
          />
          <DialogFooter>
            <Button type="button" onClick={handleEditAppointment}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
