"use client";

import { startTransition, useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SessionKeepAlive } from "@/components/session-keep-alive";
import { SidebarNav } from "@/components/sidebar-nav";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "fisio:sidebar-collapsed";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1") {
        startTransition(() => setSidebarCollapsed(true));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setCollapsed = (next: boolean) => {
    setSidebarCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="flex h-dvh max-h-dvh bg-background text-foreground">
      <SessionKeepAlive />
      <aside
        className={cn(
          "hidden shrink-0 border-r border-sidebar-border transition-[width] duration-200 md:flex md:flex-col",
          sidebarCollapsed ? "md:w-[4.25rem]" : "md:w-64",
        )}
      >
        <SidebarNav
          compact={sidebarCollapsed}
          onToggleCompact={() => setCollapsed(!sidebarCollapsed)}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-2 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="min-w-0 truncate font-semibold">FisioSystem</span>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-[max(0.75rem,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch]">
          {children}
        </main>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          showCloseButton={false}
          id="mobile-navigation"
          className="md:hidden left-0 top-0 h-dvh max-h-dvh w-[min(18rem,88vw)] translate-x-0 translate-y-0 rounded-none border-r p-0 sm:left-0 sm:top-0 sm:h-dvh sm:w-[min(18rem,88vw)] sm:max-h-dvh sm:translate-x-0 sm:translate-y-0"
        >
          <SidebarNav
            onNavigate={() => setMobileOpen(false)}
            headerAction={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu de navegação"
              >
                <X className="h-5 w-5" />
              </Button>
            }
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
