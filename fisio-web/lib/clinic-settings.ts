"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeWorkingWeekdays } from "@/lib/schedule-utils";

const STORAGE_KEY = "fisio_clinic_settings_v1";

export type ClinicSettings = {
  clinicName: string;
  therapistName: string;
  /** Telefone profissional (exibido em mensagens / contato) */
  therapistPhone: string;
  /** Intervalo sugerido entre visitas para deslocamento (minutos) */
  defaultTravelBufferMinutes: number;
  /**
   * Dias em que atende (0 = domingo … 6 = sábado, como `Date.getDay()`).
   * Usado no dashboard (gráfico da semana) e na agenda (dias clicáveis).
   */
  workingWeekdays: number[];
  /** Capacidade de referência para o card “Ocupação” no dashboard (sessões/dia). */
  maxSessionsPerDay: number;
};

function clampSessions(n: unknown): number {
  if (typeof n === "number" && Number.isFinite(n)) {
    return Math.min(24, Math.max(1, Math.round(n)));
  }
  return 8;
}

const defaults: ClinicSettings = {
  clinicName: "FisioSystem",
  therapistName: "Julli Severina",
  therapistPhone: "",
  defaultTravelBufferMinutes: 20,
  workingWeekdays: [1, 2, 3, 4, 5],
  maxSessionsPerDay: 8,
};

function load(): ClinicSettings {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<ClinicSettings>;
    return {
      ...defaults,
      ...parsed,
      workingWeekdays: normalizeWorkingWeekdays(parsed.workingWeekdays),
      maxSessionsPerDay: clampSessions(parsed.maxSessionsPerDay),
    };
  } catch {
    return defaults;
  }
}

function save(next: ClinicSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function getClinicSettings(): ClinicSettings {
  return load();
}

export function setClinicSettings(partial: Partial<ClinicSettings>): ClinicSettings {
  const prev = load();
  const next: ClinicSettings = {
    ...prev,
    ...partial,
    workingWeekdays:
      partial.workingWeekdays !== undefined
        ? normalizeWorkingWeekdays(partial.workingWeekdays)
        : prev.workingWeekdays,
    maxSessionsPerDay:
      partial.maxSessionsPerDay !== undefined
        ? clampSessions(partial.maxSessionsPerDay)
        : prev.maxSessionsPerDay,
  };
  save(next);
  return next;
}

export function useClinicSettings(): {
  settings: ClinicSettings;
  setSettings: (partial: Partial<ClinicSettings>) => void;
} {
  const [settings, setState] = useState<ClinicSettings>(defaults);

  useEffect(() => {
    setState(load());
  }, []);

  const setSettings = useCallback((partial: Partial<ClinicSettings>) => {
    setState((prev) => {
      const next: ClinicSettings = {
        ...prev,
        ...partial,
        workingWeekdays:
          partial.workingWeekdays !== undefined
            ? normalizeWorkingWeekdays(partial.workingWeekdays)
            : prev.workingWeekdays,
        maxSessionsPerDay:
          partial.maxSessionsPerDay !== undefined
            ? clampSessions(partial.maxSessionsPerDay)
            : prev.maxSessionsPerDay,
      };
      save(next);
      return next;
    });
  }, []);

  return { settings, setSettings };
}
