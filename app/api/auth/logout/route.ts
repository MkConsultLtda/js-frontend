import { NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  backendApiUrl,
  secureCookie,
} from "@/lib/server-auth";
import { resolveAccessTokenForBackendProxy, tryRecoverFromUnauthorizedWithRefresh } from "@/lib/server/backend-access";

export async function POST() {
  const session = await resolveAccessTokenForBackendProxy();
  if (session.ok) {
    let upstream = await fetch(`${backendApiUrl()}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });
    if (upstream.status === 401) {
      const recovered = await tryRecoverFromUnauthorizedWithRefresh();
      if (recovered && !(recovered instanceof NextResponse)) {
        upstream = await fetch(`${backendApiUrl()}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${recovered.accessToken}`,
          },
          cache: "no-store",
        });
      }
    }
  }
  const res = NextResponse.json({ ok: true });
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
