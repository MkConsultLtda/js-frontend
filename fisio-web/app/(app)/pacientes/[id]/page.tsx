"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Mail,
  MapPin,
  Phone,
  TrendingUp,
  User,
  BriefcaseBusiness,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMockData } from "@/components/mock-data-provider";
import { formatIsoDateToBR } from "@/lib/date-utils";
import {
  ageFromBirthDateIso,
  formatAddressOneLine,
  formatCepDisplay,
} from "@/lib/patient-utils";
import { isSessionAppointment } from "@/lib/types";

export default function PacienteProntuarioPage() {
  const params = useParams();
  const id = Number(params.id);
  const { patients, anamneses, evolucoes, appointments } = useMockData();

  const patient = patients.find((p) => p.id === id);

  const evolucoesRecentes = useMemo(() => {
    if (!patient) return [];
    return evolucoes
      .filter((e) => e.patientId === id)
      .sort((a, b) => b.dataSessao.localeCompare(a.dataSessao))
      .slice(0, 5);
  }, [evolucoes, id, patient]);

  if (!patient) {
    return (
      <div className="p-8 space-y-4">
        <Button variant="ghost" asChild className="gap-2 w-fit">
          <Link href="/pacientes">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <p className="text-muted-foreground">Paciente não encontrado.</p>
      </div>
    );
  }

  const anamneseCount = anamneses.filter((a) => a.patientId === id).length;
  const evolucaoCount = evolucoes.filter((e) => e.patientId === id).length;

  const proximos = appointments
    .filter((a) => isSessionAppointment(a) && a.patientId === id)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 3);

  const age = ageFromBirthDateIso(patient.birthDate);
  const nascimento = formatIsoDateToBR(patient.birthDate);
  const enderecoLinha = formatAddressOneLine(patient.address);

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" asChild className="gap-2 -ml-2 w-fit">
            <Link href="/pacientes">
              <ArrowLeft className="h-4 w-4" />
              Pacientes
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <User className="h-8 w-8 text-primary" />
            {patient.name}
          </h1>
          <p className="text-muted-foreground">
            {age} anos · Nasc. {nascimento} · {patient.diagnosis}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/agenda`}>Agenda</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2 border-primary/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço para atendimento domiciliar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>{enderecoLinha}</p>
            <p className="text-xs text-muted-foreground">
              CEP armazenado: {formatCepDisplay(patient.address.cep)} (somente números no cadastro)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{patient.phone || "—"}</p>
            {patient.responsiblePhone ? (
              <p className="text-muted-foreground">Responsável: {patient.responsiblePhone}</p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-mail
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm break-all">
            {patient.email || "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {patient.status === "active" ? "Ativo" : "Inativo"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Última sessão
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{patient.lastSession}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4" />
              Profissão
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{patient.profession || "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Escolaridade
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{patient.educationLevel || "—"}</CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Indicação</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{patient.referralSource || "Não informado"}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Evoluções recentes
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Últimos registros mockados deste paciente (ordem por data da sessão).
          </p>
        </CardHeader>
        <CardContent>
          {evolucoesRecentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma evolução registrada ainda.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {evolucoesRecentes.map((e) => (
                <li key={e.id} className="rounded-lg border border-border/70 p-3">
                  <p className="font-medium text-foreground">
                    {e.dataSessao} · {e.tipoSessao}
                  </p>
                  <p className="text-muted-foreground line-clamp-2 mt-1">{e.objetivosSessao}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dor {e.dorPre} → {e.dorPos}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/evolucao?pacienteId=${id}`}>Ver todas as evoluções</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Anamnese
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {anamneseCount} registro(s) mockado(s) para este paciente
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/anamnese?pacienteId=${id}`}>Ver / editar anamneses</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Evolução
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {evolucaoCount} registro(s) mockado(s) para este paciente
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/evolucao?pacienteId=${id}`}>Ver / editar evoluções</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximos agendamentos (mock)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proximos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum agendamento futuro encontrado para este paciente.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {proximos.map((a) => (
                <li
                  key={a.id}
                  className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0"
                >
                  <span>
                    {a.date} às {a.time}
                  </span>
                  <span className="text-muted-foreground">{a.type}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
