import { NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  secureCookie,
} from "@/lib/server-auth";

export async function POST() {
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
