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

export function secureCookie(): boolean {
  return process.env.NODE_ENV === "production";
}

export const ACCESS_TOKEN_COOKIE_NAME = ACCESS_TOKEN_COOKIE;
export const REFRESH_TOKEN_COOKIE_NAME = REFRESH_TOKEN_COOKIE;
