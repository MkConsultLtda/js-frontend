import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/session-constants";

const DEFAULT_API_URL = "http://localhost:8080/v1";

export function backendApiUrl(): string {
  const raw =
    process.env.BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_URL;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

/**
 * Atributo `Secure` nos cookies HttpOnly.
 * Em produção sobre HTTPS (Vercel, etc.) deve ser true.
 * Com `next start` em http://localhost o browser rejeita cookies Secure se NODE_ENV=production —
 * usa o pedido para detetar localhost ou `x-forwarded-proto: http`.
 * Defina COOKIE_SECURE=false para forçar Secure=false só em diagnóstico.
 */
export function secureCookie(incoming?: Request): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  if (process.env.COOKIE_SECURE === "false") return false;
  if (!incoming) return true;

  const proto = incoming.headers.get("x-forwarded-proto");
  if (proto === "http") return false;

  const hostRaw =
    incoming.headers.get("x-forwarded-host") ?? incoming.headers.get("host") ?? "";
  const host = hostRaw.split(",")[0]?.trim() ?? "";
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) return false;

  return true;
}

export const ACCESS_TOKEN_COOKIE_NAME = ACCESS_TOKEN_COOKIE;
export const REFRESH_TOKEN_COOKIE_NAME = REFRESH_TOKEN_COOKIE;
