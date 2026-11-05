import "server-only";

import { backendApiUrl } from "@/lib/server-auth";

/** Dados institucionais públicos, expostos para os documentos legais. */
export type PublicClinicProfile = {
  cnpj: string;
  address: string;
  city: string;
  state: string;
  contactEmail: string;
  contactPhone: string;
  dpoName: string;
  dpoEmail: string;
  responsibleName: string;
  responsibleCrefito: string;
};

/**
 * Busca os dados públicos da clínica (server-side). Retorna `null` em caso de
 * falha para que as páginas legais renderizem com textos de fallback.
 */
export async function fetchPublicClinicProfile(): Promise<PublicClinicProfile | null> {
  try {
    const res = await fetch(`${backendApiUrl()}/public/clinic-profile`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicClinicProfile;
  } catch {
    return null;
  }
}

/** Cidade/UF formatada, ou string vazia se não preenchido. */
export function formatCityState(profile: PublicClinicProfile | null): string {
  if (!profile) return "";
  const city = profile.city.trim();
  const state = profile.state.trim();
  if (city && state) return `${city}/${state}`;
  return city || state;
}
