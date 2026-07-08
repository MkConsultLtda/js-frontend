"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchClinicSettings,
  updateClinicOperational,
  type ClinicSettingsApi,
} from "@/lib/clinic-profile-api";
import {
  apiToClinicSettings,
  clinicSettingsDefaults,
  clinicSettingsToOperationalUpdate,
  mergeClinicSettings,
} from "@/lib/clinic-settings-mapper";
import type { ClinicSettings } from "@/lib/clinic-settings-types";
import { fisioKeys } from "@/lib/api/hooks/use-fisio";

export type { ClinicSettings } from "@/lib/clinic-settings-types";

function settingsFromCache(data: ClinicSettingsApi | undefined): ClinicSettings {
  if (!data) return clinicSettingsDefaults;
  return apiToClinicSettings(data);
}

export function useClinicSettings(): {
  settings: ClinicSettings;
  setSettings: (partial: Partial<ClinicSettings>) => Promise<void>;
  isLoading: boolean;
  isError: boolean;
} {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: fisioKeys.clinicProfile,
    queryFn: fetchClinicSettings,
    staleTime: 60_000,
    retry: (failureCount, error) => {
      const status = (error as Error & { status?: number }).status;
      if (status === 401) return false;
      return failureCount < 2;
    },
  });

  const settings = useMemo(() => settingsFromCache(query.data), [query.data]);

  const mutation = useMutation({
    mutationFn: updateClinicOperational,
    onSuccess: (data) => {
      qc.setQueryData(fisioKeys.clinicProfile, data);
    },
  });

  const setSettings = useCallback(
    async (partial: Partial<ClinicSettings>) => {
      const merged = mergeClinicSettings(settings, partial);
      const body = clinicSettingsToOperationalUpdate(merged);
      await mutation.mutateAsync(body);
    },
    [settings, mutation],
  );

  return {
    settings,
    setSettings,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/** Leitura síncrona com defaults — prefira {@link useClinicSettings} quando autenticado. */
export function getClinicSettings(): ClinicSettings {
  return clinicSettingsDefaults;
}
