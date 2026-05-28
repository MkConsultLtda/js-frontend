import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  secureCookie,
} from "@/lib/server-auth";
import { refreshSessionTokens, type TokenResponse } from "@/lib/server/backend-access";

type ApiErrorResponse = {
  code?: string;
  message?: string;
  details?: unknown[];
};

export async function POST(req: Request) {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Sessão expirada", details: [] },
      { status: 401 },
    );
  }

  const data = await refreshSessionTokens(refreshToken);

  if (!data) {
    // Renovação proativa (keep-alive) — uma falha aqui costuma ser corrida ou blip
    // transitório. NÃO apagamos os cookies: o logout autoritativo acontece em
    // /api/auth/me e no proxy reativo quando uma requisição real retorna 401.
    const error: ApiErrorResponse = {
      code: "UNAUTHORIZED",
      message: "Não foi possível renovar sessão",
      details: [],
    };
    return NextResponse.json(error, { status: 401 });
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
