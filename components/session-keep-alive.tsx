"use client";

import { useEffect, useRef } from "react";

/** Access token ~15 min; renova a cada 7 min (antes de expirar). */
const REFRESH_MS = 7 * 60 * 1000;

/** Janela mínima entre renovações para evitar disparos concorrentes (ex.: troca de abas). */
const MIN_REFRESH_INTERVAL_MS = 60 * 1000;

/**
 * Renova cookies de sessão antes do access token expirar (complementa o refresh reativo em 401).
 * Uma falha proativa NÃO invalida a sessão — o backend tolera refresh concorrente e o logout
 * autoritativo ocorre apenas em requisições reais (/api/auth/me e proxy).
 */
export function SessionKeepAlive() {
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    const refresh = async () => {
      const now = Date.now();
      if (now - lastRefreshAt.current < MIN_REFRESH_INTERVAL_MS) return;
      lastRefreshAt.current = now;
      try {
        await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
      } catch {
        /* rede indisponível — não invalidar sessão */
      }
    };
    const id = window.setInterval(refresh, REFRESH_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return null;
}
