"use client";

import * as React from "react";
import { Activity, ClipboardCheck, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  attendanceRatePercent,
  countCompletedSessions,
  sessionProgressPercent,
} from "@/lib/patient-treatment";
import { patientStatusLabel } from "@/lib/patient-labels";
import { formatIsoDateToBR } from "@/lib/date-utils";
import type { Appointment, Patient } from "@/lib/types";
import { PatientDischargeDialog } from "@/components/pacientes/patient-discharge-dialog";

type Props = {
  patient: Patient;
  patientId: number;
  appointments: Appointment[];
};

export function PatientTreatmentCard({ patient, patientId, appointments }: Props) {
  const completed = countCompletedSessions(appointments, patientId);
  const progress = sessionProgressPercent(patient.totalSessionsPlanned, completed);
  const attendance = attendanceRatePercent(appointments, patientId);
  const isDischarged = patient.status === "discharged";

  return (
    <Card className="md:col-span-2 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Tratamento e comparecimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Status clínico</p>
            <p className="font-medium">{patientStatusLabel(patient.status)}</p>
            {patient.dischargedAt ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                Alta em {formatIsoDateToBR(patient.dischargedAt)}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ClipboardCheck className="h-3 w-3" />
              Sessões concluídas
            </p>
            <p className="font-medium">
              {completed}
              {patient.totalSessionsPlanned > 0
                ? ` / ${patient.totalSessionsPlanned} planejadas`
                : " (meta não definida)"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              Taxa de comparecimento
            </p>
            <p className="font-medium">
              {attendance != null ? `${attendance}%` : "—"}
              <span className="text-xs text-muted-foreground font-normal">
                {" "}
                (concluídas ÷ concluídas + faltas)
              </span>
            </p>
          </div>
        </div>

        {progress != null ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progresso do plano</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}

        {patient.dischargeSummary?.trim() ? (
          <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Resumo da alta</p>
            <p className="whitespace-pre-wrap">{patient.dischargeSummary}</p>
          </div>
        ) : null}

        {!isDischarged ? (
          <PatientDischargeDialog patientId={patientId} patientName={patient.name} />
        ) : null}
      </CardContent>
    </Card>
  );
}
