"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormFieldError } from "@/components/form-field-error";
import { anamneseRequestBody } from "@/lib/api/fisio-api";
import {
  useAggregateAnamneses,
  useAnamneseMutations,
  usePatientsSearch,
} from "@/lib/api/hooks/use-fisio";
import {
  anamneseFormSchema,
  emptyAnamneseForm,
  type AnamneseFormValues,
} from "@/lib/schemas/anamnese-form";
import type { Anamnese } from "@/lib/types";
import { FileText, Save, User } from "lucide-react";

function normalizeAnamneseHtml(raw: string): string {
  if (!raw.trim()) return "";
  return raw;
}

function legacyAnamneseToHtml(anamnese: Anamnese): string {
  if (anamnese.anamneseTexto?.trim()) return anamnese.anamneseTexto;
  const sections = [
    { title: "Queixa principal", body: anamnese.queixaPrincipal },
    { title: "História da doença atual", body: anamnese.historiaDoenca },
    { title: "Antecedentes familiares", body: anamnese.antecedentesFamiliares },
    { title: "Medicamentos", body: anamnese.medicamentos },
    { title: "Alergias", body: anamnese.alergias },
    { title: "Hábitos de vida", body: anamnese.habitosVida },
    { title: "Exame físico", body: anamnese.exameFisico },
    { title: "Diagnóstico fisioterapêutico", body: anamnese.diagnosticoFisioterapico },
    { title: "Objetivos do tratamento", body: anamnese.objetivosTratamento },
  ];
  return sections
    .filter((section) => section.body?.trim())
    .map((section) => `<h3>${section.title}</h3><p>${section.body}</p>`)
    .join("");
}

function AnamnesePageContent() {
  const searchParams = useSearchParams();
  const pacienteIdParam = searchParams.get("pacienteId");

  const { data: patientPage } = usePatientsSearch("");
  const patients = patientPage?.content ?? [];
  const { data: anamneses = [] } = useAggregateAnamneses(true);
  const { createAnam, replaceAnam } = useAnamneseMutations();

  const [isCreating, setIsCreating] = React.useState(false);
  const [editingAnamnese, setEditingAnamnese] = React.useState<Anamnese | null>(null);

  const form = useForm<AnamneseFormValues>({
    resolver: zodResolver(anamneseFormSchema),
    defaultValues: emptyAnamneseForm(pacienteIdParam),
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = form;

  React.useEffect(() => {
    if (editingAnamnese || !isCreating) return;
    setValue("patientId", pacienteIdParam ?? "");
  }, [pacienteIdParam, editingAnamnese, isCreating, setValue]);

  const filteredAnamneses = React.useMemo(() => {
    if (!pacienteIdParam) return anamneses;
    const pid = Number(pacienteIdParam);
    return anamneses.filter((a) => a.patientId === pid);
  }, [anamneses, pacienteIdParam]);

  const onSubmit = async (values: AnamneseFormValues) => {
    const patient = patients.find((p) => p.id.toString() === values.patientId);
    if (!patient) return;

    const normalizedHtml = normalizeAnamneseHtml(values.anamneseTexto);
    try {
      if (editingAnamnese) {
        await replaceAnam.mutateAsync({
          id: editingAnamnese.id,
          body: anamneseRequestBody(
            {
              patientId: values.patientId,
              anamneseTexto: normalizedHtml,
            },
            { dataColeta: editingAnamnese.dataColeta },
          ),
        });
        toast.success("Anamnese atualizada.");
      } else {
        await createAnam.mutateAsync(
          anamneseRequestBody(
            {
              patientId: values.patientId,
              anamneseTexto: normalizedHtml,
            },
            null,
          ),
        );
        toast.success("Anamnese registrada.");
      }
      setEditingAnamnese(null);
      setIsCreating(false);
      reset(emptyAnamneseForm(pacienteIdParam));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    }
  };

  const handleEdit = (anamnese: Anamnese) => {
    setEditingAnamnese(anamnese);
    reset({
      patientId: anamnese.patientId.toString(),
      anamneseTexto: legacyAnamneseToHtml(anamnese),
    });
    setIsCreating(true);
  };

  const closeForm = () => {
    setIsCreating(false);
    setEditingAnamnese(null);
    reset(emptyAnamneseForm(pacienteIdParam));
  };

  const toggleCreate = () => {
    if (isCreating) {
      closeForm();
    } else {
      setEditingAnamnese(null);
      reset(emptyAnamneseForm(pacienteIdParam));
      setIsCreating(true);
    }
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
        <Button type="button" onClick={toggleCreate}>
          <FileText className="h-4 w-4 mr-2" />
          {isCreating ? "Cancelar" : "Nova anamnese"}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingAnamnese ? "Editar anamnese" : "Nova anamnese"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="anam-patient">Paciente</Label>
                  <Controller
                    name="patientId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!!pacienteIdParam}
                      >
                        <SelectTrigger id="anam-patient" aria-invalid={!!errors.patientId}>
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
                  <FormFieldError message={errors.patientId?.message} id="anam-patient-error" />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="anam-texto">Anamnese (bloco único)</Label>
                <Controller
                  name="anamneseTexto"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Escreva a anamnese completa. Use os botões para negrito, itálico, listas e títulos."
                      ariaInvalid={!!errors.anamneseTexto}
                    />
                  )}
                />
                <FormFieldError message={errors.anamneseTexto?.message} id="anam-texto-error" />
                <p className="text-xs text-muted-foreground">
                  Dica: use títulos curtos para organizar seções clínicas dentro do mesmo texto.
                </p>
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
                  <strong>Resumo:</strong> avaliação registrada em {anamnese.dataColeta}
                </div>
              </div>
              <div
                className="prose prose-sm mt-4 max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: legacyAnamneseToHtml(anamnese) }}
              />
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
