"use client";

export function AgendaColorLegend() {
  const swatches: { label: string; className: string }[] = [
    { label: "Agendado", className: "bg-amber-200/70 border border-amber-400/50" },
    { label: "Confirmado", className: "bg-sky-200/60 border border-sky-400/50" },
    { label: "Concluído", className: "bg-emerald-200/55 border border-emerald-400/50" },
    { label: "Cancelado", className: "bg-red-100/70 border border-red-400/50 line-through decoration-red-600/60" },
    { label: "Pessoal / trabalho", className: "bg-violet-300/45 border border-violet-400/50" },
    { label: "Bloqueado", className: "bg-slate-300/60 border border-slate-400/50" },
  ];

  return (
    <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
      <p className="mb-2 font-medium text-foreground">Legenda de cores</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {swatches.map((item) => (
          <li key={item.label} className="inline-flex items-center gap-2">
            <span
              className={`inline-block h-3 w-5 shrink-0 rounded-sm ${item.className}`}
              aria-hidden
            />
            <span>{item.label}</span>
          </li>
        ))}
        <li className="inline-flex items-center gap-2">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400" aria-hidden>
            Feriado
          </span>
          <span className="text-muted-foreground">texto no topo do dia (estilo Google)</span>
        </li>
      </ul>
    </div>
  );
}
