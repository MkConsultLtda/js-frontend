"use client";

import { useEffect } from "react";

/** Access token ~15 min; renova a cada 7 min (antes de expirar). */
const REFRESH_MS = 7 * 60 * 1000;

export const SESSION_EXPIRED_EVENT = "fisio:session-expired";

/** Renova cookies de sessão antes do access token expirar (complementa o refresh reativo em 401). */
export function SessionKeepAlive() {
  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) {
          window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
        }
      } catch {
        /* rede indisponível — não invalidar sessão */
      }
    };
    const id = window.setInterval(refresh, REFRESH_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return null;
}
