"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "fisio_clinic_settings_v1";

export type ClinicSettings = {
  clinicName: string;
  therapistName: string;
  /** Telefone profissional (exibido em mensagens / contato) */
  therapistPhone: string;
  /** Intervalo sugerido entre visitas para deslocamento (minutos) */
  defaultTravelBufferMinutes: number;
};

const defaults: ClinicSettings = {
  clinicName: "FisioSystem",
  therapistName: "Julli Severina",
  therapistPhone: "",
  defaultTravelBufferMinutes: 20,
};

function load(): ClinicSettings {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<ClinicSettings>;
    return { ...defaults, ...parsed };
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
  const next = { ...load(), ...partial };
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
      const next = { ...prev, ...partial };
      save(next);
      return next;
    });
  }, []);

  return { settings, setSettings };
}
