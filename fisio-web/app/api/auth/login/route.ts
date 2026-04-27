import { NextResponse } from "next/server";

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

export async function POST(req: Request) {
  const body = await req.json();

  const upstream = await fetch(`${backendApiUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const error =
      ((await upstream.json().catch(() => null)) as ApiErrorResponse | null) ??
      { code: "UNAUTHORIZED", message: "Falha no login", details: [] };
    return NextResponse.json(error, { status: upstream.status });
  }

  const data = (await upstream.json()) as LoginResponse;
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
