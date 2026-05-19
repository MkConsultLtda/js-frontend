"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useClientSearchParams } from "@/lib/hooks/use-client-search-params";
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
import { formatUserFacingApiError } from "@/lib/api/backend-client";
import { evolucaoRequestBody } from "@/lib/api/fisio-api";
import {
  useAggregateEvoluco,
  useEvolucoMutations,
  usePatientsSearch,
} from "@/lib/api/hooks/use-fisio";
import {
  evolucaoFormSchema,
  emptyEvolucaoForm,
  type EvolucaoFormValues,
} from "@/lib/schemas/evolucao-form";
import {
  formatIsoDateToBR,
  normalizeTimeForInput,
  parseBRDate,
  toLocalDateString,
} from "@/lib/date-utils";
import type { Evolucao, Patient } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendingUp, Save, Calendar, User, Trash2, Eye } from "lucide-react";

function toDateInputValue(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const isValidBr = /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr);
  if (!isValidBr) return toLocalDateString(new Date());
  return toLocalDateString(parseBRDate(dateStr));
}

function formatEvolucaoDataHoraLabel(e: Evolucao): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(e.dataSessao)
    ? formatIsoDateToBR(e.dataSessao)
    : e.dataSessao;
  const h = e.horaAtendimento?.trim();
  return h ? `${d} · ${h}` : d;
}

export default function EvolucaoPage() {
  const searchParams = useClientSearchParams();
  const pacienteIdParam = searchParams.get("pacienteId");
  const dataSessaoParam = searchParams.get("dataSessao");
  const horaAtendimentoParam = searchParams.get("horaAtendimento");

  const {
    data: patientPage,
    isLoading: isPatientsLoading,
    error: patientsError,
  } = usePatientsSearch("");
  const patients: Patient[] = React.useMemo(
    () => patientPage?.content ?? [],
    [patientPage],
  );
  const y = React.useMemo(() => new Date().getFullYear(), []);
  const evWindow = React.useMemo(
    () => ({ from: `${y}-01-01`, to: `${y}-12-31` }),
    [y],
  );
  const {
    data: evolucoes = [],
    isLoading: isEvolucoesLoading,
    error: evolucoesError,
  } = useAggregateEvoluco(evWindow.from, evWindow.to, true);
  const { createEvo, replaceEvo, deleteEvo } = useEvolucoMutations(evWindow.from, evWindow.to);

  const [isCreating, setIsCreating] = React.useState(false);
  const [editingEvolucao, setEditingEvolucao] = React.useState<Evolucao | null>(null);
  const [patientNameFilter, setPatientNameFilter] = React.useState("");
  const [evolucaoToDeleteId, setEvolucaoToDeleteId] = React.useState<number | null>(null);
  const [viewingEvolucao, setViewingEvolucao] = React.useState<Evolucao | null>(null);
  const agendaPrefillDone = React.useRef(false);

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
    formState: { errors, isSubmitting },
  } = form;

  React.useEffect(() => {
    if (!pacienteIdParam) {
      setPatientNameFilter("");
      return;
    }
    const patient = patients.find((p) => p.id === Number(pacienteIdParam));
    setPatientNameFilter(patient?.name ?? "");
  }, [pacienteIdParam, patients]);

  React.useEffect(() => {
    if (agendaPrefillDone.current) return;
    if (!pacienteIdParam || !dataSessaoParam || !/^\d{4}-\d{2}-\d{2}$/.test(dataSessaoParam)) return;
    if (!patients.some((p) => String(p.id) === pacienteIdParam)) return;
    agendaPrefillDone.current = true;
    setEditingEvolucao(null);
    setIsCreating(true);
    const horaPre = normalizeTimeForInput(horaAtendimentoParam ?? "");
    reset({
      ...emptyEvolucaoForm(pacienteIdParam),
      patientId: pacienteIdParam,
      dataSessao: dataSessaoParam,
      horaAtendimento: horaPre,
    });
  }, [dataSessaoParam, horaAtendimentoParam, pacienteIdParam, patients, reset]);

  const filteredEvolucoes = React.useMemo(() => {
    const query = patientNameFilter.trim().toLowerCase();
    if (!query) return evolucoes;
    return evolucoes.filter((e) => e.patientName.toLowerCase().includes(query));
  }, [evolucoes, patientNameFilter]);

  React.useEffect(() => {
    if (editingEvolucao || !isCreating) return;
    setValue("patientId", pacienteIdParam ?? "");
  }, [pacienteIdParam, editingEvolucao, isCreating, setValue]);

  const onSubmit = async (values: EvolucaoFormValues) => {
    if (createEvo.isPending || replaceEvo.isPending) return;
    const patient = patients.find((p) => p.id.toString() === values.patientId);
    if (!patient) return;

    try {
      if (editingEvolucao) {
        await replaceEvo.mutateAsync({
          id: editingEvolucao.id,
          body: evolucaoRequestBody(values),
        });
      } else {
        await createEvo.mutateAsync(evolucaoRequestBody(values));
      }
      setEditingEvolucao(null);
      setIsCreating(false);
      reset(emptyEvolucaoForm(pacienteIdParam));
      toast.success("Evolução salva.");
    } catch (err) {
      toast.error(formatUserFacingApiError(err, "Não foi possível salvar."));
    }
  };

  const handleEdit = (evolucao: Evolucao) => {
    setEditingEvolucao(evolucao);
    reset({
      patientId: evolucao.patientId.toString(),
      dataSessao: toDateInputValue(evolucao.dataSessao),
      horaAtendimento: normalizeTimeForInput(evolucao.horaAtendimento ?? "") || "",
      sinaisVitaisInicio: evolucao.sinaisVitaisInicio ?? "",
      sinaisVitaisFim: evolucao.sinaisVitaisFim ?? "",
      objetivosSessao: evolucao.objetivosSessao,
      atividadesRealizadas: evolucao.atividadesRealizadas,
      respostaPaciente: evolucao.respostaPaciente,
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    spellCheck={false}
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
                <div className="space-y-1">
                  <Label htmlFor="evo-hora-atendimento">Hora do atendimento</Label>
                  <Input
                    id="evo-hora-atendimento"
                    type="time"
                    step={60}
                    className={fieldClass(!!errors.horaAtendimento)}
                    aria-invalid={!!errors.horaAtendimento}
                    aria-describedby={
                      errors.horaAtendimento ? "evo-hora-atendimento-error" : undefined
                    }
                    {...register("horaAtendimento")}
                  />
                  <FormFieldError
                    message={errors.horaAtendimento?.message}
                    id="evo-hora-atendimento-error"
                  />
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
                <Textarea spellCheck
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
                <Textarea spellCheck
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
                <Textarea spellCheck
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

              <div className="space-y-1">
                <Label htmlFor="evo-obs">Observações</Label>
                <Textarea spellCheck
                  id="evo-obs"
                  placeholder="Observações gerais sobre a sessão"
                  {...register("observacoes")}
                />
                <FormFieldError message={errors.observacoes?.message} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="evo-plano">Plano para próxima sessão</Label>
                <Textarea spellCheck
                  id="evo-plano"
                  placeholder="Planejamento para a próxima sessão"
                  {...register("planoProximaSessao")}
                />
                <FormFieldError message={errors.planoProximaSessao?.message} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  disabled={
                    createEvo.isPending || replaceEvo.isPending || isSubmitting
                  }
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createEvo.isPending || replaceEvo.isPending || isSubmitting
                    ? "Salvando…"
                    : "Salvar"}
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
        {(isPatientsLoading || isEvolucoesLoading) && (
          <p className="text-sm text-muted-foreground">Carregando evoluções…</p>
        )}
        {(patientsError || evolucoesError) && (
          <p className="text-sm text-destructive">
            Não foi possível carregar os dados de evolução. Verifique conexão e sessão.
          </p>
        )}
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
                  {formatEvolucaoDataHoraLabel(evolucao)}
                  <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                    <Link href={`/pacientes/${evolucao.patientId}`}>Prontuário</Link>
                  </Button>
                </div>
              </div>
              {evolucao.tipoSessao && evolucao.tipoSessao !== "-" ? (
                <div className="text-sm text-muted-foreground">{evolucao.tipoSessao}</div>
              ) : null}
            </CardHeader>
            <CardContent>
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
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setViewingEvolucao(evolucao)}
                >
                  <Eye className="h-4 w-4" />
                  Ver detalhes
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(evolucao)}>
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setEvolucaoToDeleteId(evolucao.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={viewingEvolucao !== null}
        onOpenChange={(open) => {
          if (!open) setViewingEvolucao(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[min(90dvh,calc(100dvh-2rem))] overflow-y-auto">
          {viewingEvolucao ? (
            <>
              <DialogHeader>
                <DialogTitle>Evolução — {viewingEvolucao.patientName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="text-muted-foreground">
                  {formatEvolucaoDataHoraLabel(viewingEvolucao)}
                </div>
                {viewingEvolucao.tipoSessao && viewingEvolucao.tipoSessao !== "-" ? (
                  <div>
                    <span className="font-medium text-foreground">Tipo: </span>
                    {viewingEvolucao.tipoSessao}
                  </div>
                ) : null}
                {(viewingEvolucao.sinaisVitaisInicio || viewingEvolucao.sinaisVitaisFim) && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <span className="font-medium text-foreground">Sinais vitais (início): </span>
                      {viewingEvolucao.sinaisVitaisInicio || "—"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Sinais vitais (fim): </span>
                      {viewingEvolucao.sinaisVitaisFim || "—"}
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="font-medium text-foreground">Objetivos da sessão</div>
                  <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3">
                    {viewingEvolucao.objetivosSessao}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-foreground">Atividades realizadas</div>
                  <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3">
                    {viewingEvolucao.atividadesRealizadas}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-foreground">Resposta do paciente</div>
                  <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3">
                    {viewingEvolucao.respostaPaciente}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-foreground">Observações</div>
                  <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3">
                    {viewingEvolucao.observacoes || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-foreground">Plano para a próxima sessão</div>
                  <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3">
                    {viewingEvolucao.planoProximaSessao || "—"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!viewingEvolucao) return;
                      handleEdit(viewingEvolucao);
                      setViewingEvolucao(null);
                    }}
                  >
                    Editar este registro
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={evolucaoToDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setEvolucaoToDeleteId(null);
        }}
        title="Excluir evolução?"
        description="A exclusão é lógica no servidor. Atendimentos da agenda não são revertidos automaticamente."
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={async () => {
          if (evolucaoToDeleteId == null) return;
          try {
            await deleteEvo.mutateAsync(evolucaoToDeleteId);
            toast.success("Evolução removida.");
          } catch (err) {
            toast.error(formatUserFacingApiError(err, "Não foi possível excluir."));
            throw err;
          }
        }}
      />

      {filteredEvolucoes.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma evolução para exibir com os filtros atuais.
        </p>
      )}
    </div>
  );
}
