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

async function fetchMe(accessToken: string) {
  return fetch(`${backendApiUrl()}/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
}

export async function GET() {
  const store = await cookies();
  let accessToken = store.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Sessão não autenticada", details: [] },
      { status: 401 },
    );
  }

  let meRes: Response | null = null;
  if (accessToken) {
    meRes = await fetchMe(accessToken);
  }

  let refreshed: TokenResponse | null = null;
  if ((!meRes || meRes.status === 401) && refreshToken) {
    const refreshRes = await fetch(`${backendApiUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (refreshRes.ok) {
      refreshed = (await refreshRes.json()) as TokenResponse;
      accessToken = refreshed.accessToken;
      meRes = await fetchMe(accessToken);
    }
  }

  if (!meRes || !meRes.ok) {
    const error =
      ((await meRes?.json().catch(() => null)) as ApiErrorResponse | null) ??
      { code: "UNAUTHORIZED", message: "Sessão inválida", details: [] };
    const fail = NextResponse.json(error, { status: meRes?.status ?? 401 });
    fail.cookies.set(ACCESS_TOKEN_COOKIE_NAME, "", {
      httpOnly: true,
      secure: secureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    fail.cookies.set(REFRESH_TOKEN_COOKIE_NAME, "", {
      httpOnly: true,
      secure: secureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return fail;
  }

  const meData = await meRes.json();
  const res = NextResponse.json(meData);
  if (refreshed) {
    const maxAge = Math.max(60, refreshed.expiresIn || 900);
    res.cookies.set(ACCESS_TOKEN_COOKIE_NAME, refreshed.accessToken, {
      httpOnly: true,
      secure: secureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge,
    });
    res.cookies.set(REFRESH_TOKEN_COOKIE_NAME, refreshed.refreshToken, {
      httpOnly: true,
      secure: secureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return res;
}
