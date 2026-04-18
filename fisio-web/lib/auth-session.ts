import { MOCK_SESSION_COOKIE } from "@/lib/session-constants";

export { MOCK_SESSION_COOKIE };

export function setMockSessionCookie(): void {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${MOCK_SESSION_COOKIE}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function clearMockSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${MOCK_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
