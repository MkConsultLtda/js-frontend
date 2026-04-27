import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  backendApiUrl,
  secureCookie,
} from "@/lib/server-auth";

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type ApiErrorResponse = {
  code?: string;
  message?: string;
  details?: unknown[];
};

export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Sessão expirada", details: [] },
      { status: 401 },
    );
  }

  const upstream = await fetch(`${backendApiUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const error =
      ((await upstream.json().catch(() => null)) as ApiErrorResponse | null) ??
      { code: "UNAUTHORIZED", message: "Não foi possível renovar sessão", details: [] };
    const res = NextResponse.json(error, { status: upstream.status });
    res.cookies.set(ACCESS_TOKEN_COOKIE_NAME, "", {
      httpOnly: true,
      secure: secureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    res.cookies.set(REFRESH_TOKEN_COOKIE_NAME, "", {
      httpOnly: true,
      secure: secureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  }

  const data = (await upstream.json()) as TokenResponse;
  const res = NextResponse.json({ ok: true });
  const maxAge = Math.max(60, data.expiresIn || 900);

  res.cookies.set(ACCESS_TOKEN_COOKIE_NAME, data.accessToken, {
    httpOnly: true,
    secure: secureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  res.cookies.set(REFRESH_TOKEN_COOKIE_NAME, data.refreshToken, {
    httpOnly: true,
    secure: secureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
