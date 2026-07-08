import type { ClinicOperationalUpdate, ClinicSettingsApi } from "@/lib/clinic-profile-api";
import type { ClinicSettings } from "@/lib/clinic-settings-types";
import { SESSION_DURATION_OPTIONS, SESSION_TYPES } from "@/lib/constants";
import { BRAND_NAME, BRAND_OWNER } from "@/lib/brand";
import { normalizeWorkingWeekdays } from "@/lib/schedule-utils";

export const clinicSettingsDefaults: ClinicSettings = {
  clinicName: BRAND_NAME,
  therapistName: BRAND_OWNER,
  therapistPhone: "",
  defaultTravelBufferMinutes: 20,
  workingWeekdays: [1, 2, 3, 4, 5],
  maxSessionsPerDay: 8,
  sessionPrice: 150,
  monthlyRevenueGoal: 12000,
  appointmentDurations: [...SESSION_DURATION_OPTIONS],
  appointmentTypes: [...SESSION_TYPES],
};

function clampSessions(n: number): number {
  return Math.min(24, Math.max(1, Math.round(n)));
}

function clampMoney(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(100000, Math.max(0, Math.round(value * 100) / 100));
}

function normalizeDurations(values: number[]): number[] {
  const parsed = values
    .filter((v) => Number.isFinite(v) && v >= 15 && v <= 240)
    .map((v) => Math.round(v))
    .filter((v, idx, arr) => arr.indexOf(v) === idx)
    .sort((a, b) => a - b);
  return parsed.length > 0 ? parsed : [...SESSION_DURATION_OPTIONS];
}

function normalizeTypes(values: string[]): string[] {
  const parsed = values
    .map((v) => v.trim())
    .filter(Boolean)
    .filter((v, idx, arr) => arr.indexOf(v) === idx);
  return parsed.length > 0 ? parsed : [...SESSION_TYPES];
}

export function apiToClinicSettings(api: ClinicSettingsApi): ClinicSettings {
  return {
    clinicName: api.name?.trim() || clinicSettingsDefaults.clinicName,
    therapistName: api.therapistName?.trim() || clinicSettingsDefaults.therapistName,
    therapistPhone: api.therapistPhone?.trim() ?? "",
    defaultTravelBufferMinutes: Math.min(
      180,
      Math.max(0, api.defaultTravelBufferMinutes ?? 20),
    ),
    workingWeekdays: normalizeWorkingWeekdays(api.workingWeekdays),
    maxSessionsPerDay: clampSessions(api.maxSessionsPerDay ?? 8),
    sessionPrice: clampMoney(api.sessionPrice, clinicSettingsDefaults.sessionPrice),
    monthlyRevenueGoal: clampMoney(
      api.monthlyRevenueGoal,
      clinicSettingsDefaults.monthlyRevenueGoal,
    ),
    appointmentDurations: normalizeDurations(api.appointmentDurations ?? []),
    appointmentTypes: normalizeTypes(api.appointmentTypes ?? []),
  };
}

export function clinicSettingsToOperationalUpdate(
  settings: ClinicSettings,
): ClinicOperationalUpdate {
  return {
    clinicName: settings.clinicName.trim() || clinicSettingsDefaults.clinicName,
    therapistName: settings.therapistName.trim(),
    therapistPhone: settings.therapistPhone.trim(),
    defaultTravelBufferMinutes: settings.defaultTravelBufferMinutes,
    workingWeekdays: normalizeWorkingWeekdays(settings.workingWeekdays),
    maxSessionsPerDay: clampSessions(settings.maxSessionsPerDay),
    sessionPrice: clampMoney(settings.sessionPrice, clinicSettingsDefaults.sessionPrice),
    monthlyRevenueGoal: clampMoney(
      settings.monthlyRevenueGoal,
      clinicSettingsDefaults.monthlyRevenueGoal,
    ),
    appointmentDurations: normalizeDurations(settings.appointmentDurations),
    appointmentTypes: normalizeTypes(settings.appointmentTypes),
  };
}

export function mergeClinicSettings(
  prev: ClinicSettings,
  partial: Partial<ClinicSettings>,
): ClinicSettings {
  const next = { ...prev, ...partial };
  return {
    ...next,
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
}
