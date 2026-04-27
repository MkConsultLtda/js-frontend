"use client";

export function AgendaColorLegend() {
  const swatches: { label: string; className: string }[] = [
    { label: "Agendado", className: "bg-amber-200/80 border border-amber-400/60" },
    { label: "Confirmado", className: "bg-cyan-200/80 border border-cyan-400/60" },
    { label: "Concluído", className: "bg-emerald-200/75 border border-emerald-400/60" },
    { label: "Cancelado", className: "bg-rose-100/80 border border-rose-400/60 line-through decoration-rose-600/70" },
    { label: "Pessoal / trabalho", className: "bg-violet-300/55 border border-violet-400/60" },
    { label: "Bloqueado", className: "bg-slate-300/70 border border-slate-400/60" },
  ];

  return (
    <div className="rounded-xl border bg-gradient-to-r from-primary/5 via-violet-500/5 to-cyan-500/5 px-4 py-3 text-sm">
      <p className="mb-2 text-sm font-semibold tracking-tight text-foreground">Legenda de cores</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
        {swatches.map((item) => (
          <li key={item.label} className="inline-flex items-center gap-2">
            <span
              className={`inline-block h-3 w-5 shrink-0 rounded-sm ${item.className}`}
              aria-hidden
            />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
