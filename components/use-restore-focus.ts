"use client";

import * as React from "react";

/**
 * Radix só devolve o foco ao `DialogTrigger`; em diálogos controlados sem gatilho
 * (confirmações, "ver detalhes") o foco se perde ao fechar. Este hook guarda o elemento
 * focado quando o diálogo abre e o restaura em `onCloseAutoFocus`.
 */
export function useRestoreFocus(open: boolean) {
  const openerRef = React.useRef<HTMLElement | null>(null);

  // Layout effect: roda antes do FocusScope do Radix mover o foco para dentro do diálogo.
  React.useLayoutEffect(() => {
    if (open) {
      const active = document.activeElement;
      openerRef.current =
        active instanceof HTMLElement && active !== document.body ? active : null;
    }
  }, [open]);

  return React.useCallback((event: Event) => {
    const opener = openerRef.current;
    if (opener && opener.isConnected) {
      event.preventDefault();
      opener.focus();
    }
  }, []);
}
