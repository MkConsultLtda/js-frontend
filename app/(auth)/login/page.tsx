"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatUserFacingApiError, type ApiErrorBody } from "@/lib/api/backend-client";
import { BRAND_LOGO, BRAND_NAME } from "@/lib/brand";

const ALLOWED_APP_PATH_PREFIXES = [
  "/dashboard",
  "/agenda",
  "/pacientes",
  "/anamnese",
  "/evolucao",
  "/financeiro",
  "/configuracoes",
  "/perfil",
] as const;

function safeRedirectFromQuery(): string {
  if (typeof window === "undefined") return "/dashboard";
  const from = new URLSearchParams(window.location.search).get("from");
  if (!from) return "/dashboard";

  // Reject encoded / backslash tricks before decoding.
  if (
    from.includes("\\") ||
    from.includes("%5c") ||
    from.includes("%5C") ||
    /%2[fF]%2[fF]/.test(from) ||
    /%00|%0[dD]|%0[aA]/.test(from)
  ) {
    return "/dashboard";
  }

  let path: string;
  try {
    path = decodeURIComponent(from);
  } catch {
    return "/dashboard";
  }

  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    path.includes("\0") ||
    /[\r\n]/.test(path) ||
    path.includes("://")
  ) {
    return "/dashboard";
  }

  const allowed = ALLOWED_APP_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  return allowed ? path : "/dashboard";
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "same-origin",
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as ApiErrorBody | null;
        const err = new Error(
          payload?.message?.trim() || "Falha no login.",
        ) as Error & { body?: ApiErrorBody };
        err.body = payload ?? undefined;
        throw err;
      }

      const target = safeRedirectFromQuery();
      // Navegação completa: garante que o GET seguinte (proxy/borda) já envia os cookies HttpOnly.
      // router.replace + refresh pode correr antes do browser consolidar Set-Cookie → loop /login ↔ /dashboard.
      window.location.assign(target);
    } catch (err) {
      toast.error(formatUserFacingApiError(err, "Não foi possível entrar."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center">
        <Image
          src={BRAND_LOGO}
          alt={BRAND_NAME}
          width={280}
          height={72}
          priority
          unoptimized
          className="h-12 w-auto"
        />
        <p className="text-muted-foreground">Entre na sua conta</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <LoginForm />
    </div>
  );
}
