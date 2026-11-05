import { PATIENT_REFERRAL_OPTIONS } from "@/lib/constants";
import type { Patient } from "@/lib/types";

export type ReferralStatItem = {
  label: string;
  count: number;
  pct: number;
};

const UNKNOWN_LABEL = "Não informado";

function normalizeReferralLabel(raw?: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return UNKNOWN_LABEL;
  const known = PATIENT_REFERRAL_OPTIONS.find(
    (o) => o.toLowerCase() === trimmed.toLowerCase(),
  );
  return known ?? trimmed;
}

/** Agrupa pacientes ativos por origem de indicação (para gráfico do dashboard). */
export function computeReferralStats(patients: Patient[]): ReferralStatItem[] {
  const active = patients.filter((p) => p.status === "active");
  const total = active.length;
  if (total === 0) return [];

  const counts = new Map<string, number>();
  for (const p of active) {
    const label = normalizeReferralLabel(p.referralSource);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const items = [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      pct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  return items;
}

export function topReferralSource(stats: ReferralStatItem[]): string | null {
  if (stats.length === 0) return null;
  return stats[0].label === UNKNOWN_LABEL && stats.length > 1
    ? stats[1].label
    : stats[0].label;
}
