"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMockData } from "@/components/mock-data-provider";
import type { Anamnese } from "@/lib/types";
import { FileText, Save, User } from "lucide-react";

function AnamnesePageContent() {
  const searchParams = useSearchParams();
  const pacienteIdParam = searchParams.get("pacienteId");

  const { patients, anamneses, addAnamnese, updateAnamnese } = useMockData();

  const [selectedPatient, setSelectedPatient] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [editingAnamnese, setEditingAnamnese] = React.useState<Anamnese | null>(null);

  const [formData, setFormData] = React.useState<Partial<Anamnese>>({
    queixaPrincipal: "",
    historiaDoenca: "",
    antecedentesFamiliares: "",
    medicamentos: "",
    alergias: "",
    habitosVida: "",
    exameFisico: "",
    diagnosticoFisioterapico: "",
    objetivosTratamento: "",
  });

  React.useEffect(() => {
    if (pacienteIdParam) {
      setSelectedPatient(pacienteIdParam);
    }
  }, [pacienteIdParam]);

  const filteredAnamneses = React.useMemo(() => {
    if (!pacienteIdParam) return anamneses;
    const pid = Number(pacienteIdParam);
    return anamneses.filter((a) => a.patientId === pid);
  }, [anamneses, pacienteIdParam]);

  const handleSave = () => {
    if (!selectedPatient) return;

    const patient = patients.find((p) => p.id.toString() === selectedPatient);
    if (!patient) return;

    const base: Omit<Anamnese, "id"> = {
      patientId: patient.id,
      patientName: patient.name,
      dataColeta: editingAnamnese
        ? editingAnamnese.dataColeta
        : new Date().toLocaleDateString("pt-BR"),
      queixaPrincipal: formData.queixaPrincipal || "",
      historiaDoenca: formData.historiaDoenca || "",
      antecedentesFamiliares: formData.antecedentesFamiliares || "",
      medicamentos: formData.medicamentos || "",
      alergias: formData.alergias || "",
      habitosVida: formData.habitosVida || "",
      exameFisico: formData.exameFisico || "",
      diagnosticoFisioterapico: formData.diagnosticoFisioterapico || "",
      objetivosTratamento: formData.objetivosTratamento || "",
    };

    if (editingAnamnese) {
      updateAnamnese({ ...editingAnamnese, ...base, id: editingAnamnese.id });
      setEditingAnamnese(null);
    } else {
      addAnamnese(base);
    }

    setIsCreating(false);
    setFormData({
      queixaPrincipal: "",
      historiaDoenca: "",
      antecedentesFamiliares: "",
      medicamentos: "",
      alergias: "",
      habitosVida: "",
      exameFisico: "",
      diagnosticoFisioterapico: "",
      objetivosTratamento: "",
    });
    if (!pacienteIdParam) setSelectedPatient("");
  };

  const handleEdit = (anamnese: Anamnese) => {
    setEditingAnamnese(anamnese);
    setSelectedPatient(anamnese.patientId.toString());
    setFormData({
      queixaPrincipal: anamnese.queixaPrincipal,
      historiaDoenca: anamnese.historiaDoenca,
      antecedentesFamiliares: anamnese.antecedentesFamiliares,
      medicamentos: anamnese.medicamentos,
      alergias: anamnese.alergias,
      habitosVida: anamnese.habitosVida,
      exameFisico: anamnese.exameFisico,
      diagnosticoFisioterapico: anamnese.diagnosticoFisioterapico,
      objetivosTratamento: anamnese.objetivosTratamento,
    });
    setIsCreating(true);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Anamnese</h1>
          <p className="text-muted-foreground">Avaliação inicial dos pacientes</p>
          {pacienteIdParam && (
            <p className="text-sm text-muted-foreground mt-2">
              Filtrando por paciente.{" "}
              <Link href="/anamnese" className="text-primary underline-offset-4 hover:underline">
                Ver todos
              </Link>
            </p>
          )}
        </div>
        <Button
          onClick={() => {
            setIsCreating(!isCreating);
            if (isCreating) {
              setEditingAnamnese(null);
              setFormData({});
              if (!pacienteIdParam) setSelectedPatient("");
            }
          }}
        >
          <FileText className="h-4 w-4 mr-2" />
          {isCreating ? "Cancelar" : "Nova anamnese"}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingAnamnese ? "Editar anamnese" : "Nova anamnese"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patient">Paciente</Label>
                <Select
                  value={selectedPatient}
                  onValueChange={setSelectedPatient}
                  disabled={!!pacienteIdParam}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="queixa">Queixa principal</Label>
              <Textarea
                id="queixa"
                value={formData.queixaPrincipal}
                onChange={(e) =>
                  setFormData({ ...formData, queixaPrincipal: e.target.value })
                }
                placeholder="Descreva a queixa principal do paciente"
              />
            </div>

            <div>
              <Label htmlFor="historia">História da doença atual</Label>
              <Textarea
                id="historia"
                value={formData.historiaDoenca}
                onChange={(e) =>
                  setFormData({ ...formData, historiaDoenca: e.target.value })
                }
                placeholder="Histórico detalhado da doença"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="antecedentes">Antecedentes familiares</Label>
                <Textarea
                  id="antecedentes"
                  value={formData.antecedentesFamiliares}
                  onChange={(e) =>
                    setFormData({ ...formData, antecedentesFamiliares: e.target.value })
                  }
                  placeholder="Doenças na família"
                />
              </div>
              <div>
                <Label htmlFor="medicamentos">Medicamentos</Label>
                <Textarea
                  id="medicamentos"
                  value={formData.medicamentos}
                  onChange={(e) =>
                    setFormData({ ...formData, medicamentos: e.target.value })
                  }
                  placeholder="Medicamentos em uso"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alergias">Alergias</Label>
                <Input
                  id="alergias"
                  value={formData.alergias}
                  onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
                  placeholder="Alergias conhecidas"
                />
              </div>
              <div>
                <Label htmlFor="habitos">Hábitos de vida</Label>
                <Textarea
                  id="habitos"
                  value={formData.habitosVida}
                  onChange={(e) =>
                    setFormData({ ...formData, habitosVida: e.target.value })
                  }
                  placeholder="Atividade física, fumo, etc."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="exame">Exame físico</Label>
              <Textarea
                id="exame"
                value={formData.exameFisico}
                onChange={(e) => setFormData({ ...formData, exameFisico: e.target.value })}
                placeholder="Achados do exame físico"
              />
            </div>

            <div>
              <Label htmlFor="diagnostico">Diagnóstico fisioterapêutico</Label>
              <Textarea
                id="diagnostico"
                value={formData.diagnosticoFisioterapico}
                onChange={(e) =>
                  setFormData({ ...formData, diagnosticoFisioterapico: e.target.value })
                }
                placeholder="Diagnóstico fisioterapêutico"
              />
            </div>

            <div>
              <Label htmlFor="objetivos">Objetivos do tratamento</Label>
              <Textarea
                id="objetivos"
                value={formData.objetivosTratamento}
                onChange={(e) =>
                  setFormData({ ...formData, objetivosTratamento: e.target.value })
                }
                placeholder="Objetivos a serem alcançados"
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setEditingAnamnese(null);
                  setFormData({});
                  if (!pacienteIdParam) setSelectedPatient("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {filteredAnamneses.map((anamnese) => (
          <Card key={anamnese.id}>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <CardTitle>{anamnese.patientName}</CardTitle>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {anamnese.dataColeta}
                  <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                    <Link href={`/pacientes/${anamnese.patientId}`}>Prontuário</Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Queixa principal:</strong> {anamnese.queixaPrincipal}
                </div>
                <div>
                  <strong>Diagnóstico:</strong> {anamnese.diagnosticoFisioterapico}
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => handleEdit(anamnese)}>
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAnamneses.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma anamnese para exibir com os filtros atuais.
        </p>
      )}
    </div>
  );
}

export default function AnamnesePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-muted-foreground">Carregando anamneses…</div>
      }
    >
      <AnamnesePageContent />
    </Suspense>
  );
}
