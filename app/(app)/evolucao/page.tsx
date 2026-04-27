"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { FormFieldError } from "@/components/form-field-error";
import { useMockData } from "@/components/mock-data-provider";
import { EVOLUCAO_TIPOS_SESSAO } from "@/lib/constants";
import {
  evolucaoFormSchema,
  emptyEvolucaoForm,
  type EvolucaoFormValues,
} from "@/lib/schemas/evolucao-form";
import { formatIsoDateToBR, parseBRDate, toLocalDateString } from "@/lib/date-utils";
import type { Evolucao } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TrendingUp, Save, Calendar, User } from "lucide-react";

function toDateInputValue(brDate: string): string {
  const isValidBr = /^\d{2}\/\d{2}\/\d{4}$/.test(brDate);
  if (!isValidBr) return toLocalDateString(new Date());
  return toLocalDateString(parseBRDate(brDate));
}

function EvolucaoPageContent() {
  const searchParams = useSearchParams();
  const pacienteIdParam = searchParams.get("pacienteId");

  const { patients, evolucoes, addEvolucao, updateEvolucao } = useMockData();

  const [isCreating, setIsCreating] = React.useState(false);
  const [editingEvolucao, setEditingEvolucao] = React.useState<Evolucao | null>(null);
  const [patientNameFilter, setPatientNameFilter] = React.useState("");

  const form = useForm<EvolucaoFormValues>({
    resolver: zodResolver(evolucaoFormSchema),
    defaultValues: emptyEvolucaoForm(pacienteIdParam),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = form;

  React.useEffect(() => {
    if (!pacienteIdParam) {
      setPatientNameFilter("");
      return;
    }
    const patient = patients.find((p) => p.id === Number(pacienteIdParam));
    setPatientNameFilter(patient?.name ?? "");
  }, [pacienteIdParam, patients]);

  const filteredEvolucoes = React.useMemo(() => {
    const query = patientNameFilter.trim().toLowerCase();
    if (!query) return evolucoes;
    return evolucoes.filter((e) => e.patientName.toLowerCase().includes(query));
  }, [evolucoes, patientNameFilter]);

  React.useEffect(() => {
    if (editingEvolucao || !isCreating) return;
    setValue("patientId", pacienteIdParam ?? "");
  }, [pacienteIdParam, editingEvolucao, isCreating, setValue]);

  const onSubmit = (values: EvolucaoFormValues) => {
    const patient = patients.find((p) => p.id.toString() === values.patientId);
    if (!patient) return;

    const base: Omit<Evolucao, "id"> = {
      patientId: patient.id,
      patientName: patient.name,
      dataSessao: formatIsoDateToBR(values.dataSessao),
      tipoSessao: values.tipoSessao,
      sinaisVitaisInicio: values.sinaisVitaisInicio.trim() || undefined,
      sinaisVitaisFim: values.sinaisVitaisFim.trim() || undefined,
      objetivosSessao: values.objetivosSessao,
      atividadesRealizadas: values.atividadesRealizadas,
      respostaPaciente: values.respostaPaciente,
      dorPre: values.dorPre,
      dorPos: values.dorPos,
      observacoes: values.observacoes,
      planoProximaSessao: values.planoProximaSessao,
    };

    if (editingEvolucao) {
      updateEvolucao({ ...editingEvolucao, ...base, id: editingEvolucao.id });
      setEditingEvolucao(null);
    } else {
      addEvolucao(base);
    }

    setIsCreating(false);
    reset(emptyEvolucaoForm(pacienteIdParam));
  };

  const handleEdit = (evolucao: Evolucao) => {
    setEditingEvolucao(evolucao);
    reset({
      patientId: evolucao.patientId.toString(),
      dataSessao: toDateInputValue(evolucao.dataSessao),
      tipoSessao: evolucao.tipoSessao,
      sinaisVitaisInicio: evolucao.sinaisVitaisInicio ?? "",
      sinaisVitaisFim: evolucao.sinaisVitaisFim ?? "",
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

  const closeForm = () => {
    setIsCreating(false);
    setEditingEvolucao(null);
    reset(emptyEvolucaoForm(pacienteIdParam));
  };

  const toggleCreate = () => {
    if (isCreating) {
      closeForm();
    } else {
      setEditingEvolucao(null);
      reset(emptyEvolucaoForm(pacienteIdParam));
      setIsCreating(true);
    }
  };

  const fieldClass = (hasError: boolean) => cn(hasError && "border-destructive");

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evolução</h1>
          <p className="text-muted-foreground">Registro do progresso dos pacientes</p>
          <div className="mt-3 max-w-md space-y-1">
            <Label htmlFor="evo-filter-name" className="text-xs text-muted-foreground">
              Buscar por nome do paciente
            </Label>
            <Input
              id="evo-filter-name"
              value={patientNameFilter}
              onChange={(e) => setPatientNameFilter(e.target.value)}
              placeholder="Digite o nome do paciente..."
            />
          </div>
          {pacienteIdParam && (
            <p className="text-sm text-muted-foreground mt-2">
              Filtrando por paciente.{" "}
              <Link href="/evolucao" className="text-primary underline-offset-4 hover:underline">
                Ver todos
              </Link>
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Button type="button" onClick={toggleCreate}>
            <TrendingUp className="h-4 w-4 mr-2" />
            {isCreating ? "Cancelar" : "Novo registro"}
          </Button>
        </div>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingEvolucao ? "Editar evolução" : "Novo registro de evolução"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="evo-patient">Paciente</Label>
                  <Controller
                    name="patientId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!!pacienteIdParam}
                      >
                        <SelectTrigger
                          id="evo-patient"
                          className={fieldClass(!!errors.patientId)}
                          aria-invalid={!!errors.patientId}
                          aria-describedby={
                            errors.patientId ? "evo-patient-error" : undefined
                          }
                        >
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
                    )}
                  />
                  <FormFieldError message={errors.patientId?.message} id="evo-patient-error" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="evo-data-sessao">Data da sessão</Label>
                  <Input
                    id="evo-data-sessao"
                    type="date"
                    className={fieldClass(!!errors.dataSessao)}
                    aria-invalid={!!errors.dataSessao}
                    aria-describedby={errors.dataSessao ? "evo-data-sessao-error" : undefined}
                    {...register("dataSessao")}
                  />
                  <FormFieldError
                    message={errors.dataSessao?.message}
                    id="evo-data-sessao-error"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="evo-tipo">Tipo de sessão</Label>
                  <Controller
                    name="tipoSessao"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="evo-tipo"
                          className={fieldClass(!!errors.tipoSessao)}
                          aria-invalid={!!errors.tipoSessao}
                          aria-describedby={
                            errors.tipoSessao ? "evo-tipo-error" : undefined
                          }
                        >
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
                    )}
                  />
                  <FormFieldError message={errors.tipoSessao?.message} id="evo-tipo-error" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="evo-sinais-inicio">Sinais vitais - início</Label>
                  <Input
                    id="evo-sinais-inicio"
                    className={fieldClass(!!errors.sinaisVitaisInicio)}
                    aria-invalid={!!errors.sinaisVitaisInicio}
                    aria-describedby={
                      errors.sinaisVitaisInicio ? "evo-sinais-inicio-error" : undefined
                    }
                    placeholder="Ex.: PA 130/80 · FC 76 · SpO2 98%"
                    {...register("sinaisVitaisInicio")}
                  />
                  <FormFieldError
                    message={errors.sinaisVitaisInicio?.message}
                    id="evo-sinais-inicio-error"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="evo-sinais-fim">Sinais vitais - fim</Label>
                  <Input
                    id="evo-sinais-fim"
                    className={fieldClass(!!errors.sinaisVitaisFim)}
                    aria-invalid={!!errors.sinaisVitaisFim}
                    aria-describedby={errors.sinaisVitaisFim ? "evo-sinais-fim-error" : undefined}
                    placeholder="Ex.: PA 125/78 · FC 72 · SpO2 99%"
                    {...register("sinaisVitaisFim")}
                  />
                  <FormFieldError
                    message={errors.sinaisVitaisFim?.message}
                    id="evo-sinais-fim-error"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="evo-objetivos">Objetivos da sessão</Label>
                <Textarea
                  id="evo-objetivos"
                  className={fieldClass(!!errors.objetivosSessao)}
                  aria-invalid={!!errors.objetivosSessao}
                  aria-describedby={
                    errors.objetivosSessao ? "evo-obj-error" : undefined
                  }
                  placeholder="Objetivos específicos desta sessão"
                  {...register("objetivosSessao")}
                />
                <FormFieldError
                  message={errors.objetivosSessao?.message}
                  id="evo-obj-error"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="evo-atividades">Atividades realizadas</Label>
                <Textarea
                  id="evo-atividades"
                  className={fieldClass(!!errors.atividadesRealizadas)}
                  aria-invalid={!!errors.atividadesRealizadas}
                  aria-describedby={
                    errors.atividadesRealizadas ? "evo-atv-error" : undefined
                  }
                  placeholder="Descreva as atividades realizadas"
                  {...register("atividadesRealizadas")}
                />
                <FormFieldError
                  message={errors.atividadesRealizadas?.message}
                  id="evo-atv-error"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="evo-resposta">Resposta do paciente</Label>
                <Textarea
                  id="evo-resposta"
                  className={fieldClass(!!errors.respostaPaciente)}
                  aria-invalid={!!errors.respostaPaciente}
                  aria-describedby={
                    errors.respostaPaciente ? "evo-resp-error" : undefined
                  }
                  placeholder="Como o paciente respondeu aos tratamentos"
                  {...register("respostaPaciente")}
                />
                <FormFieldError
                  message={errors.respostaPaciente?.message}
                  id="evo-resp-error"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="evo-dor-pre">Dor pré-sessão (0–10)</Label>
                  <Controller
                    name="dorPre"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="evo-dor-pre"
                        type="number"
                        min={0}
                        max={10}
                        className={fieldClass(!!errors.dorPre)}
                        aria-invalid={!!errors.dorPre}
                        aria-describedby={errors.dorPre ? "evo-dorpre-error" : undefined}
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
                  <FormFieldError message={errors.dorPre?.message} id="evo-dorpre-error" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="evo-dor-pos">Dor pós-sessão (0–10)</Label>
                  <Controller
                    name="dorPos"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="evo-dor-pos"
                        type="number"
                        min={0}
                        max={10}
                        className={fieldClass(!!errors.dorPos)}
                        aria-invalid={!!errors.dorPos}
                        aria-describedby={errors.dorPos ? "evo-dorpos-error" : undefined}
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
                  <FormFieldError message={errors.dorPos?.message} id="evo-dorpos-error" />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="evo-obs">Observações</Label>
                <Textarea
                  id="evo-obs"
                  placeholder="Observações gerais sobre a sessão"
                  {...register("observacoes")}
                />
                <FormFieldError message={errors.observacoes?.message} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="evo-plano">Plano para próxima sessão</Label>
                <Textarea
                  id="evo-plano"
                  placeholder="Planejamento para a próxima sessão"
                  {...register("planoProximaSessao")}
                />
                <FormFieldError message={errors.planoProximaSessao?.message} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancelar
                </Button>
              </div>
            </form>
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
              {(evolucao.sinaisVitaisInicio || evolucao.sinaisVitaisFim) && (
                <div className="mb-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  <div>
                    <strong>Sinais vitais (início):</strong>{" "}
                    {evolucao.sinaisVitaisInicio || "Não informado"}
                  </div>
                  <div>
                    <strong>Sinais vitais (fim):</strong> {evolucao.sinaisVitaisFim || "Não informado"}
                  </div>
                </div>
              )}
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
