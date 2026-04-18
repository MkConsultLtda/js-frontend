import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { MOCK_SESSION_COOKIE } from "./lib/session-constants";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(MOCK_SESSION_COOKIE)?.value;
  if (token !== "1") {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/agenda/:path*",
    "/pacientes/:path*",
    "/anamnese/:path*",
    "/evolucao/:path*",
    "/configuracoes/:path*",
  ],
};
