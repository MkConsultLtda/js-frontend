"use client";

import { useEffect } from "react";

const REFRESH_MS = 10 * 60 * 1000;

/** Renova cookies de sessão antes do access token expirar (complementa o refresh reativo em 401). */
export function SessionKeepAlive() {
  useEffect(() => {
    const refresh = () => {
      void fetch("/api/auth/refresh", { method: "POST", credentials: "include" }).catch(() => {});
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
