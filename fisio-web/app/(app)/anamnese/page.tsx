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
import {
  anamneseFormSchema,
  emptyAnamneseForm,
  type AnamneseFormValues,
} from "@/lib/schemas/anamnese-form";
import type { Anamnese } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FileText, Save, User } from "lucide-react";

function AnamnesePageContent() {
  const searchParams = useSearchParams();
  const pacienteIdParam = searchParams.get("pacienteId");

  const { patients, anamneses, addAnamnese, updateAnamnese } = useMockData();

  const [isCreating, setIsCreating] = React.useState(false);
  const [editingAnamnese, setEditingAnamnese] = React.useState<Anamnese | null>(null);

  const form = useForm<AnamneseFormValues>({
    resolver: zodResolver(anamneseFormSchema),
    defaultValues: emptyAnamneseForm(pacienteIdParam),
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
    if (editingAnamnese || !isCreating) return;
    setValue("patientId", pacienteIdParam ?? "");
  }, [pacienteIdParam, editingAnamnese, isCreating, setValue]);

  const filteredAnamneses = React.useMemo(() => {
    if (!pacienteIdParam) return anamneses;
    const pid = Number(pacienteIdParam);
    return anamneses.filter((a) => a.patientId === pid);
  }, [anamneses, pacienteIdParam]);

  const onSubmit = (values: AnamneseFormValues) => {
    const patient = patients.find((p) => p.id.toString() === values.patientId);
    if (!patient) return;

    const { patientId: _pid, ...clinical } = values;
    const base: Omit<Anamnese, "id"> = {
      patientId: patient.id,
      patientName: patient.name,
      dataColeta: editingAnamnese
        ? editingAnamnese.dataColeta
        : new Date().toLocaleDateString("pt-BR"),
      ...clinical,
    };

    if (editingAnamnese) {
      updateAnamnese({ ...editingAnamnese, ...base, id: editingAnamnese.id });
      setEditingAnamnese(null);
    } else {
      addAnamnese(base);
    }

    setIsCreating(false);
    reset(emptyAnamneseForm(pacienteIdParam));
  };

  const handleEdit = (anamnese: Anamnese) => {
    setEditingAnamnese(anamnese);
    reset({
      patientId: anamnese.patientId.toString(),
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

  const fieldClass = (hasError: boolean) => cn(hasError && "border-destructive");

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
                        <SelectTrigger
                          id="anam-patient"
                          className={fieldClass(!!errors.patientId)}
                          aria-invalid={!!errors.patientId}
                          aria-describedby={
                            errors.patientId ? "anam-patient-error" : undefined
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
                  <FormFieldError message={errors.patientId?.message} id="anam-patient-error" />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="anam-queixa">Queixa principal</Label>
                <Textarea
                  id="anam-queixa"
                  className={fieldClass(!!errors.queixaPrincipal)}
                  aria-invalid={!!errors.queixaPrincipal}
                  aria-describedby={
                    errors.queixaPrincipal ? "anam-queixa-error" : undefined
                  }
                  placeholder="Descreva a queixa principal do paciente"
                  {...register("queixaPrincipal")}
                />
                <FormFieldError
                  message={errors.queixaPrincipal?.message}
                  id="anam-queixa-error"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="anam-historia">História da doença atual</Label>
                <Textarea
                  id="anam-historia"
                  className={fieldClass(!!errors.historiaDoenca)}
                  aria-invalid={!!errors.historiaDoenca}
                  aria-describedby={
                    errors.historiaDoenca ? "anam-historia-error" : undefined
                  }
                  placeholder="Histórico detalhado da doença"
                  {...register("historiaDoenca")}
                />
                <FormFieldError
                  message={errors.historiaDoenca?.message}
                  id="anam-historia-error"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="anam-antecedentes">Antecedentes familiares</Label>
                  <Textarea
                    id="anam-antecedentes"
                    className={fieldClass(!!errors.antecedentesFamiliares)}
                    aria-invalid={!!errors.antecedentesFamiliares}
                    placeholder="Doenças na família"
                    {...register("antecedentesFamiliares")}
                  />
                  <FormFieldError message={errors.antecedentesFamiliares?.message} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="anam-medicamentos">Medicamentos</Label>
                  <Textarea
                    id="anam-medicamentos"
                    className={fieldClass(!!errors.medicamentos)}
                    placeholder="Medicamentos em uso"
                    {...register("medicamentos")}
                  />
                  <FormFieldError message={errors.medicamentos?.message} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="anam-alergias">Alergias</Label>
                  <Input
                    id="anam-alergias"
                    className={fieldClass(!!errors.alergias)}
                    placeholder="Alergias conhecidas"
                    {...register("alergias")}
                  />
                  <FormFieldError message={errors.alergias?.message} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="anam-habitos">Hábitos de vida</Label>
                  <Textarea
                    id="anam-habitos"
                    className={fieldClass(!!errors.habitosVida)}
                    placeholder="Atividade física, fumo, etc."
                    {...register("habitosVida")}
                  />
                  <FormFieldError message={errors.habitosVida?.message} />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="anam-exame">Exame físico</Label>
                <Textarea
                  id="anam-exame"
                  className={fieldClass(!!errors.exameFisico)}
                  aria-invalid={!!errors.exameFisico}
                  aria-describedby={errors.exameFisico ? "anam-exame-error" : undefined}
                  placeholder="Achados do exame físico"
                  {...register("exameFisico")}
                />
                <FormFieldError message={errors.exameFisico?.message} id="anam-exame-error" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="anam-diagnostico">Diagnóstico fisioterapêutico</Label>
                <Textarea
                  id="anam-diagnostico"
                  className={fieldClass(!!errors.diagnosticoFisioterapico)}
                  aria-invalid={!!errors.diagnosticoFisioterapico}
                  aria-describedby={
                    errors.diagnosticoFisioterapico ? "anam-dx-error" : undefined
                  }
                  placeholder="Diagnóstico fisioterapêutico"
                  {...register("diagnosticoFisioterapico")}
                />
                <FormFieldError
                  message={errors.diagnosticoFisioterapico?.message}
                  id="anam-dx-error"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="anam-objetivos">Objetivos do tratamento</Label>
                <Textarea
                  id="anam-objetivos"
                  className={fieldClass(!!errors.objetivosTratamento)}
                  aria-invalid={!!errors.objetivosTratamento}
                  aria-describedby={
                    errors.objetivosTratamento ? "anam-obj-error" : undefined
                  }
                  placeholder="Objetivos a serem alcançados"
                  {...register("objetivosTratamento")}
                />
                <FormFieldError
                  message={errors.objetivosTratamento?.message}
                  id="anam-obj-error"
                />
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
