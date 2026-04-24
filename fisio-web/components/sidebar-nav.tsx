"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearMockSessionCookie } from "@/lib/auth-session";
import { useClinicSettings } from "@/lib/clinic-settings";
import { APP_NAV, Activity } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type Props = {
  /** Chamado após navegar (ex.: fechar drawer no mobile) */
  onNavigate?: () => void;
  className?: string;
  /** Ex.: botão fechar no drawer */
  headerAction?: ReactNode;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SidebarNav({ onNavigate, className, headerAction }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useClinicSettings();

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
      <div className="shrink-0 border-t border-sidebar-border p-4 space-y-3">
        <Link
          href="/perfil"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md p-1 -m-1 hover:bg-sidebar-accent/60 transition-colors"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {initials(settings.therapistName)}
          </div>
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-medium">{settings.therapistName}</p>
            <p className="truncate text-xs text-muted-foreground">{settings.clinicName}</p>
          </div>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            clearMockSessionCookie();
            onNavigate?.();
            router.replace("/login");
          }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sair
        </Button>
      </div>
    </div>
  );
}
