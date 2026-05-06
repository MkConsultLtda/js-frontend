import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  backendApiUrl,
  secureCookie,
} from "@/lib/server-auth";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type ApiErrorResponse = {
  code?: string;
  message?: string;
  details?: unknown[];
};

const loginBodySchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(120),
});

export async function POST(req: Request) {
  const parsed = loginBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { code: "VALIDATION", message: "Dados de entrada inválidos", details: parsed.error.issues },
      { status: 400 },
    );
  }
  const body = parsed.data;
  const loginUrl = `${backendApiUrl()}/auth/login`;

  let upstream: Response;
  try {
    upstream = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (cause) {
    const message =
      cause instanceof Error
        ? cause.message
        : "Falha de rede ao contactar o servidor da API.";
    console.error("[auth/login] upstream unreachable:", loginUrl, cause);
    return NextResponse.json(
      {
        code: "SERVICE_UNAVAILABLE",
        message:
          "Não foi possível contactar o backend. Confirme que a API está a correr e que BACKEND_API_URL no Next aponta para o Spring (ex.: http://localhost:8080/v1).",
        details: [{ message }],
      },
      { status: 503 },
    );
  }

  if (!upstream.ok) {
    const error =
      ((await upstream.json().catch(() => null)) as ApiErrorResponse | null) ??
      { code: "UNAUTHORIZED", message: "Falha no login", details: [] };
    return NextResponse.json(error, { status: upstream.status });
  }

  const data = (await upstream.json()) as LoginResponse;
  if (!data.accessToken?.trim() || !data.refreshToken?.trim()) {
    console.error("[auth/login] token em falta na resposta JSON do backend.");
    return NextResponse.json(
      {
        code: "INVALID_RESPONSE",
        message: "Resposta inválida do servidor de autenticação (tokens em falta).",
        details: [],
      },
      { status: 502 },
    );
  }
  const res = NextResponse.json({ ok: true });
  const maxAge = Math.max(60, data.expiresIn || 900);

  res.cookies.set(ACCESS_TOKEN_COOKIE_NAME, data.accessToken, {
    httpOnly: true,
    secure: secureCookie(req),
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  res.cookies.set(REFRESH_TOKEN_COOKIE_NAME, data.refreshToken, {
    httpOnly: true,
    secure: secureCookie(req),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
