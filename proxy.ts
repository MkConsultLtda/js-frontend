import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./lib/session-constants";

export function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!access && !refresh) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/agenda/:path*",
    "/pacientes/:path*",
    "/anamnese/:path*",
    "/evolucao/:path*",
    "/financeiro",
    "/financeiro/:path*",
    "/configuracoes/:path*",
    "/perfil/:path*",
  ],
};
