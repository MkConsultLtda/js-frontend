"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LogOut, PanelLeft, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearAuthSession } from "@/lib/auth-session";
import { useClinicSettings } from "@/lib/clinic-settings";
import { APP_NAV, Activity } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  /** Chamado após navegar (ex.: fechar drawer no mobile) */
  onNavigate?: () => void;
  className?: string;
  /** Ex.: botão fechar no drawer */
  headerAction?: ReactNode;
  /** Menu estreito (só ícones) — desktop */
  compact?: boolean;
  /** Alternar modo compacto (só desktop; omitir no drawer mobile) */
  onToggleCompact?: () => void;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SidebarNav({
  onNavigate,
  className,
  headerAction,
  compact = false,
  onToggleCompact,
}: Props) {
  const pathname = usePathname();
  const { settings } = useClinicSettings();

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground", className)}>
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-3",
          compact && "justify-center px-2",
        )}
      >
        <Activity className="h-6 w-6 shrink-0 text-primary" />
        {!compact && (
          <span className="min-w-0 flex-1 truncate text-lg font-bold">FisioSystem</span>
        )}
        {compact && <span className="sr-only">FisioSystem</span>}
        {onToggleCompact && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("shrink-0", compact ? "h-8 w-8" : "hidden md:flex h-8 w-8")}
            onClick={onToggleCompact}
            title={compact ? "Expandir menu" : "Recolher menu"}
            aria-label={compact ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            {compact ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        )}
        {headerAction}
      </div>
      <nav className={cn("flex-1 space-y-1 overflow-y-auto py-4", compact ? "px-2" : "px-3")}>
        {APP_NAV.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              title={compact ? item.name : undefined}
              onClick={onNavigate}
              className={cn(
                "group flex items-center rounded-md py-2 text-sm font-medium transition-colors",
                compact ? "justify-center px-2" : "px-3",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  !compact && "mr-3",
                  isActive
                    ? "text-sidebar-accent-foreground"
                    : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                )}
              />
              {!compact && item.name}
              {compact && <span className="sr-only">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
      <div className={cn("shrink-0 border-t border-sidebar-border space-y-3", compact ? "p-2" : "p-4")}>
        <Link
          href="/perfil"
          title={compact ? "Perfil" : undefined}
          onClick={onNavigate}
          className={cn(
            "flex rounded-md p-1 -m-1 hover:bg-sidebar-accent/60 transition-colors",
            compact ? "justify-center" : "items-center gap-3",
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {initials(settings.therapistName)}
          </div>
          {!compact && (
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium">{settings.therapistName}</p>
              <p className="truncate text-xs text-muted-foreground">{settings.clinicName}</p>
            </div>
          )}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          title={compact ? "Sair" : undefined}
          className={cn(
            "gap-2 text-muted-foreground hover:text-foreground",
            compact ? "h-9 w-full justify-center px-0" : "w-full justify-start",
          )}
          onClick={async () => {
            await clearAuthSession();
            onNavigate?.();
            toast.message("Sessão encerrada.");
            window.location.assign("/login");
          }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!compact && "Sair"}
          {compact && <span className="sr-only">Sair</span>}
        </Button>
      </div>
    </div>
  );
}
