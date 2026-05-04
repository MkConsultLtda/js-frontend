"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  /** Se rejeitar, o diálogo permanece aberto (ex.: falha de rede). */
  onConfirm: () => void | Promise<void>;
};

/**
 * Confirmação acessível (Radix Dialog + foco) em substituição a `window.confirm`.
 * Aguarda `onConfirm` antes de fechar, evitando fechar cedo e duplo clique.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
}: Props) {
  const [pending, setPending] = React.useState(false);

  const handleConfirm = async () => {
    setPending(true);
    try {
      await Promise.resolve(onConfirm());
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        onEscapeKeyDown={() => {
          if (!pending) onOpenChange(false);
        }}
        role="alertdialog"
        aria-modal="true"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={pending}
            onClick={() => void handleConfirm()}
          >
            {pending ? "Aguarde…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
