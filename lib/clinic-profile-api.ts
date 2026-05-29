import { backendApiPath, backendJson } from "@/lib/api/backend-client";

/** Dados institucionais da clínica persistidos na API (contato e LGPD). */
export type ClinicProfile = {
  name: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  contactEmail: string;
  contactPhone: string;
  dpoName: string;
  dpoEmail: string;
};

/** Campos editáveis pela clínica (o nome de exibição é gerido em outro fluxo). */
export type ClinicProfileUpdate = Omit<ClinicProfile, "name">;

const SETTINGS_PATH = "clinic/settings";

export async function fetchClinicProfile(): Promise<ClinicProfile> {
  return backendJson<ClinicProfile>(backendApiPath(SETTINGS_PATH), { cache: "no-store" });
}

export async function updateClinicProfile(body: ClinicProfileUpdate): Promise<ClinicProfile> {
  return backendJson<ClinicProfile>(backendApiPath(SETTINGS_PATH), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
