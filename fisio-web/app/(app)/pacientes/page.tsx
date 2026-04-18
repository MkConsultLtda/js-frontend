"use client";

import * as React from "react";
import Link from "next/link";
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
import { useMockData } from "@/components/mock-data-provider";
import { toLocalDateString } from "@/lib/date-utils";
import type { Patient } from "@/lib/types";

export default function PacientesPage() {
  const { patients, addPatient, updatePatient, deletePatient } = useMockData();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">(
    "all"
  );
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingPatient, setEditingPatient] = React.useState<Patient | null>(null);
  const [newPatient, setNewPatient] = React.useState<Partial<Patient>>({
    name: "",
    age: 0,
    diagnosis: "",
    phone: "",
    status: "active",
    lastSession: new Date().toLocaleDateString("pt-BR"),
  });

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || patient.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddPatient = () => {
    if (!newPatient.name?.trim() || !newPatient.diagnosis?.trim()) return;

    addPatient({
      name: newPatient.name.trim(),
      age: Number(newPatient.age) || 0,
      diagnosis: newPatient.diagnosis.trim(),
      phone: newPatient.phone?.trim() ?? "",
      status: (newPatient.status as Patient["status"]) ?? "active",
      lastSession: new Date().toLocaleDateString("pt-BR"),
      registeredAt: toLocalDateString(new Date()),
    });
    setIsAddModalOpen(false);
    setNewPatient({
      name: "",
      age: 0,
      diagnosis: "",
      phone: "",
      status: "active",
      lastSession: new Date().toLocaleDateString("pt-BR"),
    });
  };

  const startEdit = (patient: Patient) => {
    setEditingPatient({ ...patient });
    setIsEditModalOpen(true);
  };

  const handleUpdatePatient = () => {
    if (!editingPatient) return;
    updatePatient(editingPatient);
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
            if (!open) {
              setNewPatient({
                name: "",
                age: 0,
                diagnosis: "",
                phone: "",
                status: "active",
                lastSession: new Date().toLocaleDateString("pt-BR"),
              });
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
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="new-name"
                  className="col-span-3"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-age" className="text-right">
                  Idade
                </Label>
                <Input
                  id="new-age"
                  type="number"
                  min={0}
                  className="col-span-3"
                  value={newPatient.age || ""}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, age: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-dx" className="text-right">
                  Diagnóstico
                </Label>
                <Input
                  id="new-dx"
                  className="col-span-3"
                  value={newPatient.diagnosis}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, diagnosis: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-phone" className="text-right">
                  Telefone
                </Label>
                <Input
                  id="new-phone"
                  className="col-span-3"
                  value={newPatient.phone}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleAddPatient}>
                Salvar paciente
              </Button>
            </DialogFooter>
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
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar paciente</DialogTitle>
              <DialogDescription>
                Atualize as informações de {editingPatient.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Nome</Label>
                <Input
                  className="col-span-3"
                  value={editingPatient.name}
                  onChange={(e) =>
                    setEditingPatient({ ...editingPatient, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Idade</Label>
                <Input
                  type="number"
                  min={0}
                  className="col-span-3"
                  value={editingPatient.age}
                  onChange={(e) =>
                    setEditingPatient({
                      ...editingPatient,
                      age: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Diagnóstico</Label>
                <Input
                  className="col-span-3"
                  value={editingPatient.diagnosis}
                  onChange={(e) =>
                    setEditingPatient({ ...editingPatient, diagnosis: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Telefone</Label>
                <Input
                  className="col-span-3"
                  value={editingPatient.phone}
                  onChange={(e) =>
                    setEditingPatient({ ...editingPatient, phone: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <Select
                  value={editingPatient.status}
                  onValueChange={(v) =>
                    setEditingPatient({
                      ...editingPatient,
                      status: v as Patient["status"],
                    })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleUpdatePatient}>
                Salvar alterações
              </Button>
            </DialogFooter>
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
