import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./lib/session-constants";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/agenda",
  "/pacientes",
  "/anamnese",
  "/evolucao",
  "/financeiro",
  "/configuracoes",
  "/perfil",
];

const isDev = process.env.NODE_ENV !== "production";

function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

/**
 * CSP de páginas com nonce por requisição. Remove 'unsafe-inline' de script-src:
 * apenas scripts com o nonce (e os que eles carregam via 'strict-dynamic') executam.
 */
function buildPageCsp(nonce: string): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ");
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https:",
    "connect-src 'self' https:",
    "form-action 'self'",
    `script-src ${scriptSrc}`,
  ].join("; ");
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const csp = buildPageCsp(nonce);

  if (isProtected(request.nextUrl.pathname)) {
    const access = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    const refresh = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    if (!access && !refresh) {
      const login = new URL("/login", request.url);
      login.searchParams.set("from", request.nextUrl.pathname);
      const redirect = NextResponse.redirect(login);
      redirect.headers.set("Content-Security-Policy", csp);
      return redirect;
    }
  }

  // O Next.js lê o nonce do cabeçalho CSP da requisição e o aplica aos seus scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|brand|favicon\\.ico|icon\\.svg|manifest\\.webmanifest).*)",
  ],
};
