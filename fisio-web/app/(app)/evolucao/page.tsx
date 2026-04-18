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
import { EVOLUCAO_TIPOS_SESSAO } from "@/lib/constants";
import type { Evolucao } from "@/lib/types";
import { TrendingUp, Save, Calendar, User } from "lucide-react";

function EvolucaoPageContent() {
  const searchParams = useSearchParams();
  const pacienteIdParam = searchParams.get("pacienteId");

  const { patients, evolucoes, addEvolucao, updateEvolucao } = useMockData();

  const [selectedPatient, setSelectedPatient] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [editingEvolucao, setEditingEvolucao] = React.useState<Evolucao | null>(null);

  const [formData, setFormData] = React.useState<Partial<Evolucao>>({
    tipoSessao: "",
    objetivosSessao: "",
    atividadesRealizadas: "",
    respostaPaciente: "",
    dorPre: 0,
    dorPos: 0,
    observacoes: "",
    planoProximaSessao: "",
  });

  React.useEffect(() => {
    if (pacienteIdParam) {
      setSelectedPatient(pacienteIdParam);
    }
  }, [pacienteIdParam]);

  const filteredEvolucoes = React.useMemo(() => {
    if (!pacienteIdParam) return evolucoes;
    const pid = Number(pacienteIdParam);
    return evolucoes.filter((e) => e.patientId === pid);
  }, [evolucoes, pacienteIdParam]);

  const handleSave = () => {
    if (!selectedPatient) return;

    const patient = patients.find((p) => p.id.toString() === selectedPatient);
    if (!patient) return;

    const base: Omit<Evolucao, "id"> = {
      patientId: patient.id,
      patientName: patient.name,
      dataSessao: editingEvolucao
        ? editingEvolucao.dataSessao
        : new Date().toLocaleDateString("pt-BR"),
      tipoSessao: formData.tipoSessao || "",
      objetivosSessao: formData.objetivosSessao || "",
      atividadesRealizadas: formData.atividadesRealizadas || "",
      respostaPaciente: formData.respostaPaciente || "",
      dorPre: Number(formData.dorPre) || 0,
      dorPos: Number(formData.dorPos) || 0,
      observacoes: formData.observacoes || "",
      planoProximaSessao: formData.planoProximaSessao || "",
    };

    if (editingEvolucao) {
      updateEvolucao({ ...editingEvolucao, ...base, id: editingEvolucao.id });
      setEditingEvolucao(null);
    } else {
      addEvolucao(base);
    }

    setIsCreating(false);
    setFormData({
      tipoSessao: "",
      objetivosSessao: "",
      atividadesRealizadas: "",
      respostaPaciente: "",
      dorPre: 0,
      dorPos: 0,
      observacoes: "",
      planoProximaSessao: "",
    });
    if (!pacienteIdParam) setSelectedPatient("");
  };

  const handleEdit = (evolucao: Evolucao) => {
    setEditingEvolucao(evolucao);
    setSelectedPatient(evolucao.patientId.toString());
    setFormData({
      tipoSessao: evolucao.tipoSessao,
      objetivosSessao: evolucao.objetivosSessao,
      atividadesRealizadas: evolucao.atividadesRealizadas,
      respostaPaciente: evolucao.respostaPaciente,
      dorPre: evolucao.dorPre,
      dorPos: evolucao.dorPos,
      observacoes: evolucao.observacoes,
      planoProximaSessao: evolucao.planoProximaSessao,
    });
    setIsCreating(true);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evolução</h1>
          <p className="text-muted-foreground">Registro do progresso dos pacientes</p>
          {pacienteIdParam && (
            <p className="text-sm text-muted-foreground mt-2">
              Filtrando por paciente.{" "}
              <Link href="/evolucao" className="text-primary underline-offset-4 hover:underline">
                Ver todos
              </Link>
            </p>
          )}
        </div>
        <Button
          onClick={() => {
            setIsCreating(!isCreating);
            if (isCreating) {
              setEditingEvolucao(null);
              setFormData({});
              if (!pacienteIdParam) setSelectedPatient("");
            }
          }}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          {isCreating ? "Cancelar" : "Novo registro"}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingEvolucao ? "Editar evolução" : "Novo registro de evolução"}
            </CardTitle>
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
              <div>
                <Label htmlFor="tipo">Tipo de sessão</Label>
                <Select
                  value={formData.tipoSessao}
                  onValueChange={(value) => setFormData({ ...formData, tipoSessao: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVOLUCAO_TIPOS_SESSAO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="objetivos">Objetivos da sessão</Label>
              <Textarea
                id="objetivos"
                value={formData.objetivosSessao}
                onChange={(e) =>
                  setFormData({ ...formData, objetivosSessao: e.target.value })
                }
                placeholder="Objetivos específicos desta sessão"
              />
            </div>

            <div>
              <Label htmlFor="atividades">Atividades realizadas</Label>
              <Textarea
                id="atividades"
                value={formData.atividadesRealizadas}
                onChange={(e) =>
                  setFormData({ ...formData, atividadesRealizadas: e.target.value })
                }
                placeholder="Descreva as atividades realizadas"
              />
            </div>

            <div>
              <Label htmlFor="resposta">Resposta do paciente</Label>
              <Textarea
                id="resposta"
                value={formData.respostaPaciente}
                onChange={(e) =>
                  setFormData({ ...formData, respostaPaciente: e.target.value })
                }
                placeholder="Como o paciente respondeu aos tratamentos"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dorPre">Dor pré-sessão (0–10)</Label>
                <Input
                  id="dorPre"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.dorPre}
                  onChange={(e) =>
                    setFormData({ ...formData, dorPre: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="dorPos">Dor pós-sessão (0–10)</Label>
                <Input
                  id="dorPos"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.dorPos}
                  onChange={(e) =>
                    setFormData({ ...formData, dorPos: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações gerais sobre a sessão"
              />
            </div>

            <div>
              <Label htmlFor="plano">Plano para próxima sessão</Label>
              <Textarea
                id="plano"
                value={formData.planoProximaSessao}
                onChange={(e) =>
                  setFormData({ ...formData, planoProximaSessao: e.target.value })
                }
                placeholder="Planejamento para a próxima sessão"
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
                  setEditingEvolucao(null);
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
        {filteredEvolucoes.map((evolucao) => (
          <Card key={evolucao.id}>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <CardTitle>{evolucao.patientName}</CardTitle>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {evolucao.dataSessao}
                  <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                    <Link href={`/pacientes/${evolucao.patientId}`}>Prontuário</Link>
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">{evolucao.tipoSessao}</div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <strong>Dor pré:</strong> {evolucao.dorPre}/10
                </div>
                <div>
                  <strong>Dor pós:</strong> {evolucao.dorPos}/10
                </div>
              </div>
              <div className="mb-4">
                <strong>Objetivos:</strong> {evolucao.objetivosSessao}
              </div>
              <div className="mb-4">
                <strong>Atividades:</strong> {evolucao.atividadesRealizadas}
              </div>
              <Button variant="outline" size="sm" onClick={() => handleEdit(evolucao)}>
                Editar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvolucoes.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma evolução para exibir com os filtros atuais.
        </p>
      )}
    </div>
  );
}

export default function EvolucaoPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-muted-foreground">Carregando evoluções…</div>
      }
    >
      <EvolucaoPageContent />
    </Suspense>
  );
}
