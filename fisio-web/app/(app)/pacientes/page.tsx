"use client";

import * as React from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Search,
  Plus,
  Phone,
  FileText,
  Calendar,
  MoreVertical,
  Activity,
  Trash2,
  Edit,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormFieldError } from "@/components/form-field-error";
import { useMockData } from "@/components/mock-data-provider";
import { toLocalDateString } from "@/lib/date-utils";
import {
  patientCreateFormSchema,
  patientEditFormSchema,
  type PatientCreateFormValues,
  type PatientEditFormValues,
} from "@/lib/schemas/patient-form";
import type { Patient } from "@/lib/types";
import { cn } from "@/lib/utils";

const defaultCreateValues: PatientCreateFormValues = {
  name: "",
  age: 0,
  diagnosis: "",
  phone: "",
};

export default function PacientesPage() {
  const { patients, addPatient, updatePatient, deletePatient } = useMockData();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">(
    "all"
  );
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingPatient, setEditingPatient] = React.useState<Patient | null>(null);

  const addForm = useForm<PatientCreateFormValues>({
    resolver: zodResolver(patientCreateFormSchema),
    defaultValues: defaultCreateValues,
  });

  const editForm = useForm<PatientEditFormValues>({
    resolver: zodResolver(patientEditFormSchema),
    defaultValues: {
      ...defaultCreateValues,
      status: "active",
    },
  });

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || patient.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const onCreateSubmit = (data: PatientCreateFormValues) => {
    addPatient({
      name: data.name,
      age: data.age,
      diagnosis: data.diagnosis,
      phone: data.phone,
      status: "active",
      lastSession: new Date().toLocaleDateString("pt-BR"),
      registeredAt: toLocalDateString(new Date()),
    });
    setIsAddModalOpen(false);
    addForm.reset(defaultCreateValues);
  };

  const startEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setIsEditModalOpen(true);
  };

  React.useEffect(() => {
    if (!editingPatient || !isEditModalOpen) return;
    editForm.reset({
      name: editingPatient.name,
      age: editingPatient.age,
      diagnosis: editingPatient.diagnosis,
      phone: editingPatient.phone,
      status: editingPatient.status,
    });
  }, [editingPatient, isEditModalOpen, editForm]);

  const onEditSubmit = (data: PatientEditFormValues) => {
    if (!editingPatient) return;
    updatePatient({
      ...editingPatient,
      name: data.name,
      age: data.age,
      diagnosis: data.diagnosis,
      phone: data.phone,
      status: data.status,
    });
    setIsEditModalOpen(false);
    setEditingPatient(null);
  };

  const handleDeletePatient = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este paciente?")) {
      deletePatient(id);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus pacientes e históricos clínicos.
          </p>
        </div>

        <Dialog
          open={isAddModalOpen}
          onOpenChange={(open) => {
            setIsAddModalOpen(open);
            if (open) {
              addForm.reset(defaultCreateValues);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo paciente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar novo paciente</DialogTitle>
              <DialogDescription>
                Preencha as informações básicas para iniciar o acompanhamento.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={addForm.handleSubmit(onCreateSubmit)} className="space-y-2">
              <div className="grid grid-cols-4 items-start gap-4 py-2">
                <Label htmlFor="add-name" className="text-right pt-2">
                  Nome
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="add-name"
                    className={cn(addForm.formState.errors.name && "border-destructive")}
                    aria-invalid={!!addForm.formState.errors.name}
                    aria-describedby={
                      addForm.formState.errors.name ? "add-name-error" : undefined
                    }
                    {...addForm.register("name")}
                  />
                  <FormFieldError
                    message={addForm.formState.errors.name?.message}
                    id="add-name-error"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="add-age" className="text-right pt-2">
                  Idade
                </Label>
                <div className="col-span-3 space-y-1">
                  <Controller
                    name="age"
                    control={addForm.control}
                    render={({ field }) => (
                      <Input
                        id="add-age"
                        type="number"
                        min={0}
                        max={130}
                        className={cn(addForm.formState.errors.age && "border-destructive")}
                        aria-invalid={!!addForm.formState.errors.age}
                        aria-describedby={
                          addForm.formState.errors.age ? "add-age-error" : undefined
                        }
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v === "" ? 0 : parseInt(v, 10));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    )}
                  />
                  <FormFieldError
                    message={addForm.formState.errors.age?.message}
                    id="add-age-error"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="add-dx" className="text-right pt-2">
                  Diagnóstico
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="add-dx"
                    className={cn(
                      addForm.formState.errors.diagnosis && "border-destructive"
                    )}
                    aria-invalid={!!addForm.formState.errors.diagnosis}
                    aria-describedby={
                      addForm.formState.errors.diagnosis ? "add-dx-error" : undefined
                    }
                    {...addForm.register("diagnosis")}
                  />
                  <FormFieldError
                    message={addForm.formState.errors.diagnosis?.message}
                    id="add-dx-error"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="add-phone" className="text-right pt-2">
                  Telefone
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="add-phone"
                    className={cn(addForm.formState.errors.phone && "border-destructive")}
                    aria-invalid={!!addForm.formState.errors.phone}
                    aria-describedby={
                      addForm.formState.errors.phone ? "add-phone-error" : undefined
                    }
                    {...addForm.register("phone")}
                  />
                  <FormFieldError
                    message={addForm.formState.errors.phone?.message}
                    id="add-phone-error"
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit">Salvar paciente</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou diagnóstico..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => (
          <Card
            key={patient.id}
            className="hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
                  {patient.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold truncate">
                    {patient.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{patient.age} anos</p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => startEdit(patient)}>
                    <Edit className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDeletePatient(patient.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium shrink-0">Diagnóstico:</span>
                  <span className="text-muted-foreground truncate">{patient.diagnosis}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Última sessão: {patient.lastSession}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                    patient.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {patient.status === "active" ? "Ativo" : "Inativo"}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8 gap-1" asChild>
                    <Link href={`/pacientes/${patient.id}`}>
                      <FileText className="h-3.5 w-3.5" />
                      Prontuário
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                    <Link href="/agenda" aria-label="Abrir agenda">
                      <Calendar className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingPatient && (
        <Dialog
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) setEditingPatient(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar paciente</DialogTitle>
              <DialogDescription>
                Atualize as informações de {editingPatient.name}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-2">
              <div className="grid grid-cols-4 items-start gap-4 py-2">
                <Label htmlFor="edit-name" className="text-right pt-2">
                  Nome
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="edit-name"
                    className={cn(editForm.formState.errors.name && "border-destructive")}
                    aria-invalid={!!editForm.formState.errors.name}
                    aria-describedby={
                      editForm.formState.errors.name ? "edit-name-error" : undefined
                    }
                    {...editForm.register("name")}
                  />
                  <FormFieldError
                    message={editForm.formState.errors.name?.message}
                    id="edit-name-error"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-age" className="text-right pt-2">
                  Idade
                </Label>
                <div className="col-span-3 space-y-1">
                  <Controller
                    name="age"
                    control={editForm.control}
                    render={({ field }) => (
                      <Input
                        id="edit-age"
                        type="number"
                        min={0}
                        max={130}
                        className={cn(editForm.formState.errors.age && "border-destructive")}
                        aria-invalid={!!editForm.formState.errors.age}
                        aria-describedby={
                          editForm.formState.errors.age ? "edit-age-error" : undefined
                        }
                        value={field.value}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v === "" ? 0 : parseInt(v, 10));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    )}
                  />
                  <FormFieldError
                    message={editForm.formState.errors.age?.message}
                    id="edit-age-error"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-dx" className="text-right pt-2">
                  Diagnóstico
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="edit-dx"
                    className={cn(
                      editForm.formState.errors.diagnosis && "border-destructive"
                    )}
                    aria-invalid={!!editForm.formState.errors.diagnosis}
                    aria-describedby={
                      editForm.formState.errors.diagnosis ? "edit-dx-error" : undefined
                    }
                    {...editForm.register("diagnosis")}
                  />
                  <FormFieldError
                    message={editForm.formState.errors.diagnosis?.message}
                    id="edit-dx-error"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-phone" className="text-right pt-2">
                  Telefone
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="edit-phone"
                    className={cn(editForm.formState.errors.phone && "border-destructive")}
                    aria-invalid={!!editForm.formState.errors.phone}
                    aria-describedby={
                      editForm.formState.errors.phone ? "edit-phone-error" : undefined
                    }
                    {...editForm.register("phone")}
                  />
                  <FormFieldError
                    message={editForm.formState.errors.phone?.message}
                    id="edit-phone-error"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-status" className="text-right pt-2">
                  Status
                </Label>
                <div className="col-span-3 space-y-1">
                  <Controller
                    name="status"
                    control={editForm.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="edit-status"
                          className={cn(
                            editForm.formState.errors.status && "border-destructive"
                          )}
                          aria-invalid={!!editForm.formState.errors.status}
                          aria-describedby={
                            editForm.formState.errors.status
                              ? "edit-status-error"
                              : undefined
                          }
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormFieldError
                    message={editForm.formState.errors.status?.message}
                    id="edit-status-error"
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit">Salvar alterações</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {filteredPatients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <UserPlus className="h-12 w-12 mb-4 opacity-20" />
          <p>Nenhum paciente encontrado.</p>
        </div>
      )}
    </div>
  );
}
