import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  backendApiUrl,
  secureCookie,
} from "@/lib/server-auth";

type ApiErrorResponse = {
  code?: string;
  message?: string;
  details?: unknown[];
};

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

const profileBodySchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(30).optional().nullable(),
  crefito: z.string().min(1).max(32),
  professionalTitle: z.string().min(1).max(120),
  professionalEmail: z.string().email().max(120),
  notes: z.string().max(500).optional().nullable(),
  photoDataUrl: z.string().max(600_000).optional().nullable(),
});

async function refreshTokens(refreshToken: string): Promise<TokenResponse | null> {
  const refreshRes = await fetch(`${backendApiUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  if (!refreshRes.ok) return null;
  return (await refreshRes.json()) as TokenResponse;
}

function clearAuthCookies(res: NextResponse, req: Request) {
  res.cookies.set(ACCESS_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: secureCookie(req),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set(REFRESH_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: secureCookie(req),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function PATCH(req: Request) {
  const store = await cookies();
  const parsed = profileBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { code: "VALIDATION", message: "Dados de entrada inválidos", details: parsed.error.issues },
      { status: 400 },
    );
  }
  const body = parsed.data;
  let accessToken = store.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Sessão inválida", details: [] }, { status: 401 });
  }

  if (!accessToken && refreshToken) {
    const refreshed = await refreshTokens(refreshToken);
    accessToken = refreshed?.accessToken;
  }

  if (!accessToken) {
    const fail = NextResponse.json({ code: "UNAUTHORIZED", message: "Sessão inválida", details: [] }, { status: 401 });
    clearAuthCookies(fail, req);
    return fail;
  }

  let upstream = await fetch(`${backendApiUrl()}/auth/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (upstream.status === 401 && refreshToken) {
    const refreshed = await refreshTokens(refreshToken);
    if (refreshed) {
      upstream = await fetch(`${backendApiUrl()}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshed.accessToken}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });
    }
  }

  if (!upstream.ok) {
    const error =
      ((await upstream.json().catch(() => null)) as ApiErrorResponse | null) ??
      { code: "VALIDATION", message: "Falha ao atualizar perfil", details: [] };
    const fail = NextResponse.json(error, { status: upstream.status });
    if (upstream.status === 401) clearAuthCookies(fail, req);
    return fail;
  }

  const meData = await upstream.json();
  return NextResponse.json(meData);
}
