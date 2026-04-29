import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  backendApiUrl,
  secureCookie,
} from "@/lib/server-auth";

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type ApiErrorResponse = {
  code?: string;
  message?: string;
  details?: unknown[];
};

function clearSessionResponse(status: number, body: ApiErrorResponse): NextResponse {
  const fail = NextResponse.json(body, { status });
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

function applyTokenCookies(res: NextResponse, data: TokenResponse): void {
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
}

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

/**
 * Resolve access token (com refresh se necessário) para encaminhar ao Spring.
 * Em falha, devolve resposta JSON 401 com cookies limpos (igual ao fluxo de /api/auth/me).
 */
export async function resolveAccessTokenForBackendProxy(): Promise<
  | { ok: true; accessToken: string; refreshed?: TokenResponse }
  | { ok: false; response: NextResponse }
> {
  const store = await cookies();
  let accessToken = store.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  if (!accessToken && !refreshToken) {
    return {
      ok: false,
      response: clearSessionResponse(401, {
        code: "UNAUTHORIZED",
        message: "Sessão não autenticada",
        details: [],
      }),
    };
  }

  let refreshed: TokenResponse | undefined;
  if (!accessToken && refreshToken) {
    const tokens = await refreshTokens(refreshToken);
    if (!tokens) {
      return {
        ok: false,
        response: clearSessionResponse(401, {
          code: "UNAUTHORIZED",
          message: "Sessão expirada",
          details: [],
        }),
      };
    }
    refreshed = tokens;
    accessToken = tokens.accessToken;
  }

  if (!accessToken) {
    return {
      ok: false,
      response: clearSessionResponse(401, {
        code: "UNAUTHORIZED",
        message: "Sessão inválida",
        details: [],
      }),
    };
  }

  return { ok: true, accessToken, refreshed };
}

export function attachRefreshedTokensIfNeeded(
  res: NextResponse,
  refreshed: TokenResponse | undefined,
): NextResponse {
  if (refreshed) applyTokenCookies(res, refreshed);
  return res;
}

/**
 * Chamada quando o upstream retorna 401: tenta um refresh único e devolve novo access ou null.
 */
export async function tryRecoverFromUnauthorizedWithRefresh(): Promise<
  TokenResponse | NextResponse | null
> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return clearSessionResponse(401, {
      code: "UNAUTHORIZED",
      message: "Sessão inválida ou expirada",
      details: [],
    });
  }
  const tokens = await refreshTokens(refreshToken);
  if (!tokens) {
    return clearSessionResponse(401, {
      code: "UNAUTHORIZED",
      message: "Sessão inválida ou expirada",
      details: [],
    });
  }
  return tokens;
}
