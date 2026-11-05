"use client";

import { useEffect, useState } from "react";

/** Breakpoint `lg` do Tailwind: abaixo disso tratamos como mobile/tablet. */
const DEFAULT_BREAKPOINT = 1024;

/**
 * Retorna `true` quando a viewport é menor que o breakpoint (padrão: `lg`).
 * SSR-safe: começa como `false` e ajusta após a montagem.
 */
export function useIsMobile(breakpoint: number = DEFAULT_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
