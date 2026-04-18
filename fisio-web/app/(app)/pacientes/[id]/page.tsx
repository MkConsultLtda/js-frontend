"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, FileText, TrendingUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMockData } from "@/components/mock-data-provider";

export default function PacienteProntuarioPage() {
  const params = useParams();
  const id = Number(params.id);
  const { patients, anamneses, evolucoes, appointments } = useMockData();

  const patient = patients.find((p) => p.id === id);

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
    .filter((a) => a.patientId === id)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 3);

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
            {patient.age} anos · {patient.diagnosis}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/agenda`}>Agenda</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{patient.phone || "—"}</CardContent>
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
      </div>

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
