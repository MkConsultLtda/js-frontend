"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppAreaError({ error, reset }: Props) {
  useEffect(() => {
    // Erro técnico: em produção enviar para serviço de monitoramento (ex.: Sentry), sem dados sensíveis.
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <div className="space-y-1 max-w-md">
        <h1 className="text-lg font-semibold">Algo deu errado nesta área</h1>
        <p className="text-sm text-muted-foreground">
          Tente novamente. Se o problema continuar, volte ao início e evite repetir a mesma ação até
          atualizarmos o sistema.
        </p>
        {error.digest ? (
          <p className="text-xs text-muted-foreground/80">Referência: {error.digest}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" onClick={() => reset()}>
          Tentar novamente
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Ir para o início</Link>
        </Button>
      </div>
    </div>
  );
}
