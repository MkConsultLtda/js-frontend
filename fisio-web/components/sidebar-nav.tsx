"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { APP_NAV, Activity } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type Props = {
  /** Chamado após navegar (ex.: fechar drawer no mobile) */
  onNavigate?: () => void;
  className?: string;
  /** Ex.: botão fechar no drawer */
  headerAction?: ReactNode;
};

export function SidebarNav({ onNavigate, className, headerAction }: Props) {
  const pathname = usePathname();

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground", className)}>
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
        <Activity className="h-6 w-6 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate text-lg font-bold">FisioSystem</span>
        {headerAction}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {APP_NAV.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 shrink-0",
                  isActive
                    ? "text-sidebar-accent-foreground"
                    : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            JS
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Dr. Julli</p>
            <p className="truncate text-xs text-muted-foreground">Fisioterapeuta</p>
          </div>
        </div>
      </div>
    </div>
  );
}
