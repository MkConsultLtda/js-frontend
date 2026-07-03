export type NameSortOrder = "name-asc" | "name-desc";
export type DateSortOrder = "date-desc" | "date-asc";
export type AgendaDaySortOrder = "time" | "name-asc" | "name-desc";

export function sortByName<T extends { name: string }>(items: T[], order: NameSortOrder): T[] {
  const dir = order === "name-asc" ? 1 : -1;
  return [...items].sort((a, b) => dir * a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
}

export function sortByPatientName<T extends { patientName: string }>(
  items: T[],
  order: NameSortOrder,
): T[] {
  const dir = order === "name-asc" ? 1 : -1;
  return [...items].sort(
    (a, b) => dir * a.patientName.localeCompare(b.patientName, "pt-BR", { sensitivity: "base" }),
  );
}

export function sortEvolucoes<T extends { patientName: string; dataSessao: string }>(
  items: T[],
  order: NameSortOrder | DateSortOrder,
): T[] {
  const copy = [...items];
  if (order === "date-desc" || order === "date-asc") {
    const dir = order === "date-desc" ? -1 : 1;
    return copy.sort((a, b) => dir * a.dataSessao.localeCompare(b.dataSessao));
  }
  return sortByPatientName(copy, order);
}

export function sortAnamneses<T extends { patientName: string; dataColeta: string }>(
  items: T[],
  order: NameSortOrder | DateSortOrder,
): T[] {
  const copy = [...items];
  if (order === "date-desc" || order === "date-asc") {
    const dir = order === "date-desc" ? -1 : 1;
    return copy.sort((a, b) => dir * a.dataColeta.localeCompare(b.dataColeta));
  }
  return sortByPatientName(copy, order);
}

export function sortAgendaDay<T extends { time: string; patientName: string }>(
  items: T[],
  order: AgendaDaySortOrder,
): T[] {
  const copy = [...items];
  if (order === "time") {
    return copy.sort((a, b) => a.time.localeCompare(b.time));
  }
  return sortByPatientName(copy, order);
}
