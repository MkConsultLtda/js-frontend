/** yyyy-mm-dd no fuso local */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** dd/mm/aaaa → Date local */
export function parseBRDate(date: string): Date {
  const [d, m, y] = date.split("/").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

/** Segunda-feira da semana que contém `date` */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Conta agendamentos por dia útil (seg–sáb) na semana que contém `reference` */
export function countAppointmentsByWeekday(
  appointments: { date: string }[],
  reference: Date
): { label: string; count: number; dateKey: string }[] {
  const monday = startOfWeekMonday(reference);
  const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return labels.map((label, i) => {
    const day = addDays(monday, i);
    const dateKey = toLocalDateString(day);
    const count = appointments.filter((a) => a.date === dateKey).length;
    return { label, count, dateKey };
  });
}
