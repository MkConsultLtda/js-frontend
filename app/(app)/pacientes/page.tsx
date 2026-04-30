"use client";

import * as React from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  MoreVertical,
  Activity,
  Trash2,
  Edit,
  UserPlus,
  GraduationCap,
  BriefcaseBusiness,
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PatientFormRows } from "@/components/pacientes/patient-form-fields";
import {
  dtoPatientCreateFromFormValues,
  patientToReplaceBodyFromDomain,
} from "@/lib/api/fisio-api";
import { usePatientMutations, usePatientsSearch } from "@/lib/api/hooks/use-fisio";
import {
  emptyPatientCreateFormValues,
  patientFromEditForm,
  patientToEditFormValues,
} from "@/lib/patient-form-map";
import { ageFromBirthDateIso, formatCepDisplay } from "@/lib/patient-utils";
import {
  patientCreateFormSchema,
  patientEditFormSchema,
  type PatientCreateFormValues,
  type PatientEditFormValues,
} from "@/lib/schemas/patient-form";
import type { Patient } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function PacientesPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const { data: patientPage, isLoading, error } = usePatientsSearch(searchTerm);
  const { createPatient, replacePatient, deletePatient } = usePatientMutations();
  const patients = patientPage?.content ?? [];

  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">(
    "all"
  );
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingPatient, setEditingPatient] = React.useState<Patient | null>(null);
  const [patientToDeleteId, setPatientToDeleteId] = React.useState<number | null>(null);

  const addForm = useForm<PatientCreateFormValues>({
    resolver: zodResolver(patientCreateFormSchema),
    defaultValues: emptyPatientCreateFormValues,
  });

  const editForm = useForm<PatientEditFormValues>({
    resolver: zodResolver(patientEditFormSchema),
    defaultValues: {
      ...emptyPatientCreateFormValues,
      status: "active",
    },
  });

  const filteredPatients = patients.filter((patient) => {
    const matchesStatus =
      statusFilter === "all" || patient.status === statusFilter;
    return matchesStatus;
  });

  const onCreateSubmit = async (data: PatientCreateFormValues) => {
    if (createPatient.isPending) return;
    try {
      await createPatient.mutateAsync(dtoPatientCreateFromFormValues(data));
      setIsAddModalOpen(false);
      addForm.reset(emptyPatientCreateFormValues);
      toast.success("Paciente cadastrado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível cadastrar.");
    }
  };

  const startEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setIsEditModalOpen(true);
  };

  React.useEffect(() => {
    if (!editingPatient || !isEditModalOpen) return;
    editForm.reset(patientToEditFormValues(editingPatient));
  }, [editingPatient, isEditModalOpen, editForm]);

  const onEditSubmit = async (data: PatientEditFormValues) => {
    if (!editingPatient) return;
    if (replacePatient.isPending) return;
    try {
      const updated = patientFromEditForm(editingPatient, data);
      await replacePatient.mutateAsync({
        id: updated.id,
        body: patientToReplaceBodyFromDomain(updated),
      });
      setIsEditModalOpen(false);
      setEditingPatient(null);
      toast.success("Paciente atualizado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar alterações.");
    }
  };

  const dialogClass =
    "max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-2xl gap-0 py-6";

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">
            Cadastro completo para atendimento domiciliar: endereço, contato e dados clínicos.
          </p>
        </div>

        <Dialog
          open={isAddModalOpen}
          onOpenChange={(open) => {
            setIsAddModalOpen(open);
            if (open) {
              addForm.reset(emptyPatientCreateFormValues);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo paciente
            </Button>
          </DialogTrigger>
          <DialogContent className={dialogClass}>
            <DialogHeader>
              <DialogTitle>Cadastrar novo paciente</DialogTitle>
              <DialogDescription>
                Inclua endereço e formas de contato — essenciais para visitas em domicílio.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={addForm.handleSubmit(onCreateSubmit)}
              className="flex flex-col gap-4 py-4"
            >
              <PatientFormRows form={addForm} idPrefix="add" />
              <DialogFooter className="flex justify-end pt-2 sm:justify-end">
                <Button type="submit" disabled={createPatient.isPending}>
                  {createPatient.isPending ? "Salvando…" : "Salvar paciente"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, diagnóstico, e-mail ou endereço..."
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

      {error && (
        <p className="text-sm text-destructive">
          Não foi possível carregar os pacientes. Verifique sessão ou conexão com a API.
        </p>
      )}
      {isLoading && patients.length === 0 && (
        <p className="text-sm text-muted-foreground">Carregando pacientes…</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => {
          const age = ageFromBirthDateIso(patient.birthDate);
          const cidadeUf = `${patient.address.cidade} – ${patient.address.uf}`;
          return (
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
                    <p className="text-xs text-muted-foreground">
                      {age} anos · {cidadeUf}
                    </p>
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
                      onClick={() => setPatientToDeleteId(patient.id)}
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
                    <span className="font-medium shrink-0">Diagnóstico clínico:</span>
                    <span className="text-muted-foreground truncate">{patient.diagnosis}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground line-clamp-2">
                      {patient.address.logradouro}, {patient.address.numero}
                      {patient.address.complemento ? `, ${patient.address.complemento}` : ""} ·{" "}
                      {patient.address.bairro} · CEP {formatCepDisplay(patient.address.cep)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{patient.phone}</span>
                  </div>
                  {patient.responsiblePhone ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">
                        Responsável: {patient.responsiblePhone}
                      </span>
                    </div>
                  ) : null}
                  {patient.profession ? (
                    <div className="flex items-center gap-2 text-sm">
                      <BriefcaseBusiness className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{patient.profession}</span>
                    </div>
                  ) : null}
                  {patient.educationLevel ? (
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{patient.educationLevel}</span>
                    </div>
                  ) : null}
                  {patient.referralSource ? (
                    <div className="text-xs">
                      <span className="rounded-full bg-violet-100 px-2 py-1 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300">
                        Indicação: {patient.referralSource}
                      </span>
                    </div>
                  ) : null}
                  {patient.email ? (
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate text-muted-foreground">{patient.email}</span>
                    </div>
                  ) : null}
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
          );
        })}
      </div>

      {editingPatient && (
        <Dialog
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) setEditingPatient(null);
          }}
        >
          <DialogContent className={dialogClass}>
            <DialogHeader>
              <DialogTitle>Editar paciente</DialogTitle>
              <DialogDescription>
                Atualize as informações de {editingPatient.name}.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="flex flex-col gap-4 py-4"
            >
              <PatientFormRows form={editForm} idPrefix="edit" />
              <div className="grid grid-cols-4 items-start gap-4 w-full">
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
                  <FormFieldError message={editForm.formState.errors.status?.message} />
                </div>
              </div>
              <DialogFooter className="flex justify-end pt-2 sm:justify-end">
                <Button type="submit" disabled={replacePatient.isPending}>
                  {replacePatient.isPending ? "Salvando…" : "Salvar alterações"}
                </Button>
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

      <ConfirmDialog
        open={patientToDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPatientToDeleteId(null);
        }}
        title="Excluir paciente?"
        description="A exclusão é lógica no servidor — agendamentos e prontuário vinculados seguem as regras do backend."
        confirmLabel="Excluir paciente"
        variant="destructive"
        onConfirm={async () => {
          if (patientToDeleteId == null) return;
          try {
            await deletePatient.mutateAsync(patientToDeleteId);
            toast.success("Paciente removido.");
            setPatientToDeleteId(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Não foi possível excluir.");
          }
        }}
      />
    </div>
  );
}
