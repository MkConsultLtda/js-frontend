"use client";

import { useCallback, useSyncExternalStore } from "react";
import { SESSION_DURATION_OPTIONS, SESSION_TYPES } from "@/lib/constants";
import { normalizeWorkingWeekdays } from "@/lib/schedule-utils";

const STORAGE_KEY = "fisio_clinic_settings_v1";
const listeners = new Set<() => void>();

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
  /** Valor de referência por sessão para métricas financeiras no dashboard. */
  sessionPrice: number;
  /** Meta financeira mensal para cálculo de progresso. */
  monthlyRevenueGoal: number;
  /** Durações de atendimento disponíveis para seleção na agenda (minutos). */
  appointmentDurations: number[];
  /** Tipos de atendimento disponíveis para seleção na agenda. */
  appointmentTypes: string[];
};

function clampSessions(n: unknown): number {
  if (typeof n === "number" && Number.isFinite(n)) {
    return Math.min(24, Math.max(1, Math.round(n)));
  }
  return 8;
}

function clampMoney(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(100000, Math.max(0, Math.round(value * 100) / 100));
  }
  return fallback;
}

function normalizeDurations(values: unknown): number[] {
  if (!Array.isArray(values)) return [...SESSION_DURATION_OPTIONS];
  const parsed = values
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v >= 15 && v <= 240)
    .map((v) => Math.round(v))
    .filter((v, idx, arr) => arr.indexOf(v) === idx)
    .sort((a, b) => a - b);
  return parsed.length > 0 ? parsed : [...SESSION_DURATION_OPTIONS];
}

function normalizeTypes(values: unknown): string[] {
  if (!Array.isArray(values)) return [...SESSION_TYPES];
  const parsed = values
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)
    .filter((v, idx, arr) => arr.indexOf(v) === idx);
  return parsed.length > 0 ? parsed : [...SESSION_TYPES];
}

const defaults: ClinicSettings = {
  clinicName: "FisioSystem",
  therapistName: "Julli Severina",
  therapistPhone: "",
  defaultTravelBufferMinutes: 20,
  workingWeekdays: [1, 2, 3, 4, 5],
  maxSessionsPerDay: 8,
  sessionPrice: 150,
  monthlyRevenueGoal: 12000,
  appointmentDurations: [...SESSION_DURATION_OPTIONS],
  appointmentTypes: [...SESSION_TYPES],
};

let cachedSnapshot: ClinicSettings = defaults;
let cachedRawSnapshot: string | null = null;

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
      sessionPrice: clampMoney(parsed.sessionPrice, defaults.sessionPrice),
      monthlyRevenueGoal: clampMoney(parsed.monthlyRevenueGoal, defaults.monthlyRevenueGoal),
      appointmentDurations: normalizeDurations(parsed.appointmentDurations),
      appointmentTypes: normalizeTypes(parsed.appointmentTypes),
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

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    listener();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function getSnapshot(): ClinicSettings {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRawSnapshot) {
      return cachedSnapshot;
    }
    const next = load();
    cachedRawSnapshot = raw;
    cachedSnapshot = next;
    return next;
  } catch {
    return cachedSnapshot;
  }
}

function getServerSnapshot(): ClinicSettings {
  return defaults;
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
    sessionPrice:
      partial.sessionPrice !== undefined
        ? clampMoney(partial.sessionPrice, prev.sessionPrice)
        : prev.sessionPrice,
    monthlyRevenueGoal:
      partial.monthlyRevenueGoal !== undefined
        ? clampMoney(partial.monthlyRevenueGoal, prev.monthlyRevenueGoal)
        : prev.monthlyRevenueGoal,
    appointmentDurations:
      partial.appointmentDurations !== undefined
        ? normalizeDurations(partial.appointmentDurations)
        : prev.appointmentDurations,
    appointmentTypes:
      partial.appointmentTypes !== undefined
        ? normalizeTypes(partial.appointmentTypes)
        : prev.appointmentTypes,
  };
  save(next);
  cachedSnapshot = next;
  cachedRawSnapshot = JSON.stringify(next);
  emitChange();
  return next;
}

export function useClinicSettings(): {
  settings: ClinicSettings;
  setSettings: (partial: Partial<ClinicSettings>) => void;
} {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setSettings = useCallback((partial: Partial<ClinicSettings>) => {
    setClinicSettings(partial);
  }, []);

  return { settings, setSettings };
}
