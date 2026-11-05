import { backendApiPath, backendJson } from "@/lib/api/backend-client";

/** Resposta completa de GET /v1/clinic/settings */
export type ClinicSettingsApi = {
  name: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  contactEmail: string;
  contactPhone: string;
  dpoName: string;
  dpoEmail: string;
  therapistName: string;
  therapistPhone: string;
  defaultTravelBufferMinutes: number;
  workingWeekdays: number[];
  maxSessionsPerDay: number;
  sessionPrice: number;
  monthlyRevenueGoal: number;
  appointmentDurations: number[];
  appointmentTypes: string[];
};

/** Dados institucionais (subset legível no card LGPD). */
export type ClinicProfile = Pick<
  ClinicSettingsApi,
  | "name"
  | "cnpj"
  | "address"
  | "city"
  | "state"
  | "contactEmail"
  | "contactPhone"
  | "dpoName"
  | "dpoEmail"
>;

/** Campos editáveis pela clínica no card institucional. */
export type ClinicProfileUpdate = Omit<ClinicProfile, "name">;

export type ClinicOperationalUpdate = {
  clinicName: string;
  therapistName: string;
  therapistPhone: string;
  defaultTravelBufferMinutes: number;
  workingWeekdays: number[];
  maxSessionsPerDay: number;
  sessionPrice: number;
  monthlyRevenueGoal: number;
  appointmentDurations: number[];
  appointmentTypes: string[];
};

const SETTINGS_PATH = "clinic/settings";

export async function fetchClinicSettings(): Promise<ClinicSettingsApi> {
  const raw = await backendJson<ClinicSettingsApi & { sessionPrice?: number | string }>(
    backendApiPath(SETTINGS_PATH),
    { cache: "no-store" },
  );
  return {
    ...raw,
    sessionPrice: Number(raw.sessionPrice ?? 0),
    monthlyRevenueGoal: Number(raw.monthlyRevenueGoal ?? 0),
  };
}

/** @deprecated Use fetchClinicSettings */
export const fetchClinicProfile = fetchClinicSettings;

export async function updateClinicProfile(body: ClinicProfileUpdate): Promise<ClinicSettingsApi> {
  return backendJson<ClinicSettingsApi>(backendApiPath(SETTINGS_PATH), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function updateClinicOperational(
  body: ClinicOperationalUpdate,
): Promise<ClinicSettingsApi> {
  const raw = await backendJson<ClinicSettingsApi & { sessionPrice?: number | string }>(
    backendApiPath(`${SETTINGS_PATH}/operational`),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return {
    ...raw,
    sessionPrice: Number(raw.sessionPrice ?? 0),
    monthlyRevenueGoal: Number(raw.monthlyRevenueGoal ?? 0),
  };
}
