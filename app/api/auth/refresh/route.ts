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
    const error: ApiErrorResponse = {
      code: "UNAUTHORIZED",
      message: "Não foi possível renovar sessão",
      details: [],
    };
    const res = NextResponse.json(error, { status: 401 });
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
    return res;
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
