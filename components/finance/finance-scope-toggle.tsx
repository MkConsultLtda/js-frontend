"use client";

import { Button } from "@/components/ui/button";
import type { FinancialScope } from "@/lib/api/finance-api";

export type FinanceScopeFilter = FinancialScope | "all";

const OPTIONS: { value: FinanceScopeFilter; label: string }[] = [
  { value: "professional", label: "Profissional" },
  { value: "personal", label: "Pessoal" },
  { value: "all", label: "Todos" },
];

type Props = {
  value: FinanceScopeFilter;
  onChange: (value: FinanceScopeFilter) => void;
};

export function FinanceScopeToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-lg border bg-muted/40 p-1">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          size="sm"
          variant={value === opt.value ? "default" : "ghost"}
          className="rounded-md"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
