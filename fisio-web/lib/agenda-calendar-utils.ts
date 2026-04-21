import { addDays, startOfWeekSunday } from "@/lib/date-utils";

export function getWeekDatesContaining(date: Date): Date[] {
  const start = startOfWeekSunday(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function parseTimeToMinutes(time: string): number {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  return h * 60 + m;
}

/**
 * Grade semanal: dia completo 00:00 → 24:00 (meia-noite do dia seguinte),
 * para permitir rolagem por todas as horas.
 */
export const WEEK_VIEW_DAY_RANGE = { startMin: 0, endMin: 24 * 60 } as const;

export function hourTicks(startMin: number, endMin: number): number[] {
  const ticks: number[] = [];
  const first = Math.ceil(startMin / 60) * 60;
  for (let t = first; t < endMin; t += 60) {
    ticks.push(t);
  }
  return ticks;
}

export type WeekAppointmentLayoutItem<T> = {
  item: T;
  startMin: number;
  endMin: number;
  columnIndex: number;
  columnCount: number;
};

type NormalizedRange = {
  startMin: number;
  endMin: number;
};

function normalizeRange(range: NormalizedRange): NormalizedRange | null {
  if (!Number.isFinite(range.startMin) || !Number.isFinite(range.endMin)) {
    return null;
  }
  if (range.endMin <= range.startMin) {
    return null;
  }
  return range;
}

/**
 * Distribui itens da semana em colunas quando houver sobreposição de horários.
 * Isso evita blocos totalmente sobrepostos e melhora leitura em dias congestionados.
 */
export function buildWeekOverlapLayout<T>(
  items: T[],
  getRange: (item: T) => NormalizedRange | null
): WeekAppointmentLayoutItem<T>[] {
  if (items.length === 0) return [];

  const prepared = items
    .map((item) => {
      const normalized = normalizeRange(getRange(item) ?? { startMin: NaN, endMin: NaN });
      if (!normalized) return null;
      return { item, ...normalized };
    })
    .filter((entry): entry is { item: T; startMin: number; endMin: number } => entry !== null)
    .sort((a, b) => (a.startMin === b.startMin ? a.endMin - b.endMin : a.startMin - b.startMin));

  if (prepared.length === 0) return [];

  const active: Array<{
    endMin: number;
    columnIndex: number;
  }> = [];
  const layout: Array<{
    item: T;
    startMin: number;
    endMin: number;
    columnIndex: number;
    groupId: number;
  }> = [];
  const groupMaxColumns = new Map<number, number>();
  let groupId = -1;

  for (const entry of prepared) {
    for (let i = active.length - 1; i >= 0; i -= 1) {
      if (active[i].endMin <= entry.startMin) {
        active.splice(i, 1);
      }
    }

    if (active.length === 0) {
      groupId += 1;
    }

    const usedColumns = new Set(active.map((slot) => slot.columnIndex));
    let columnIndex = 0;
    while (usedColumns.has(columnIndex)) {
      columnIndex += 1;
    }

    layout.push({
      item: entry.item,
      startMin: entry.startMin,
      endMin: entry.endMin,
      columnIndex,
      groupId,
    });
    active.push({
      endMin: entry.endMin,
      columnIndex,
    });

    const currentMax = groupMaxColumns.get(groupId) ?? 1;
    if (active.length > currentMax) {
      groupMaxColumns.set(groupId, active.length);
    } else if (!groupMaxColumns.has(groupId)) {
      groupMaxColumns.set(groupId, currentMax);
    }
  }

  return layout.map((entry) => ({
    item: entry.item,
    startMin: entry.startMin,
    endMin: entry.endMin,
    columnIndex: entry.columnIndex,
    columnCount: groupMaxColumns.get(entry.groupId) ?? 1,
  }));
}
