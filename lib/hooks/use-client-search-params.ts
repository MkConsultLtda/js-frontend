"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Lê `window.location.search` sem `useSearchParams`, evitando Suspense preso
 * em páginas client-only do App Router (mesma classe de problema do /login).
 */
export function useClientSearchParams(): URLSearchParams {
  const pathname = usePathname();
  const [search, setSearch] = React.useState("");

  const sync = React.useCallback(() => {
    setSearch(typeof window !== "undefined" ? window.location.search : "");
  }, []);

  React.useLayoutEffect(() => {
    sync();
  }, [pathname, sync]);

  React.useEffect(() => {
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [sync]);

  return React.useMemo(() => new URLSearchParams(search), [search]);
}
