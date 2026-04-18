"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SESSION_TYPES } from "@/lib/constants";
import type { AppointmentStatus } from "@/lib/types";

export type AppointmentFormState = {
  patientId: string;
  date: string;
  time: string;
  duration: string;
  type: string;
  status: AppointmentStatus;
  notes: string;
};

type PatientOption = { id: number; name: string };

type Props = {
  formData: AppointmentFormState;
  onChange: (next: AppointmentFormState) => void;
  patients: PatientOption[];
  idPrefix?: string;
};

export function AppointmentFormFields({
  formData,
  onChange,
  patients,
  idPrefix = "",
}: Props) {
  const set = (patch: Partial<AppointmentFormState>) =>
    onChange({ ...formData, ...patch });

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${idPrefix}patient`} className="text-right">
          Paciente
        </Label>
        <Select
          value={formData.patientId}
          onValueChange={(value) => set({ patientId: value })}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Selecione um paciente" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((patient) => (
              <SelectItem key={patient.id} value={patient.id.toString()}>
                {patient.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${idPrefix}date`} className="text-right">
          Data
        </Label>
        <Input
          id={`${idPrefix}date`}
          type="date"
          value={formData.date}
          onChange={(e) => set({ date: e.target.value })}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${idPrefix}time`} className="text-right">
          Horário
        </Label>
        <Input
          id={`${idPrefix}time`}
          type="time"
          value={formData.time}
          onChange={(e) => set({ time: e.target.value })}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${idPrefix}duration`} className="text-right">
          Duração
        </Label>
        <Select
          value={formData.duration}
          onValueChange={(value) => set({ duration: value })}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 minutos</SelectItem>
            <SelectItem value="50">50 minutos</SelectItem>
            <SelectItem value="60">1 hora</SelectItem>
            <SelectItem value="90">1h 30min</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${idPrefix}type`} className="text-right">
          Tipo
        </Label>
        <Select value={formData.type} onValueChange={(value) => set({ type: value })}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Tipo de sessão" />
          </SelectTrigger>
          <SelectContent>
            {SESSION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${idPrefix}status`} className="text-right">
          Status
        </Label>
        <Select
          value={formData.status}
          onValueChange={(value: AppointmentStatus) => set({ status: value })}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${idPrefix}notes`} className="text-right">
          Observações
        </Label>
        <Textarea
          id={`${idPrefix}notes`}
          value={formData.notes}
          onChange={(e) => set({ notes: e.target.value })}
          className="col-span-3"
          placeholder="Observações adicionais..."
        />
      </div>
    </div>
  );
}
