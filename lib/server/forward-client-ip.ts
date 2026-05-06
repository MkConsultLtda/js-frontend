/**
 * Cabeçalhos a juntar ao fetch server-side para o Spring ver o IP real do cliente.
 * Usado em login: {@code LoginRateLimiterFilter} usa {@code X-Forwarded-For}.
 */
export function forwardedForHeaders(incoming: Request): HeadersInit {
  const xff = incoming.headers.get("x-forwarded-for")?.trim();
  const realIp = incoming.headers.get("x-real-ip")?.trim();
  if (xff) return { "X-Forwarded-For": xff };
  if (realIp) return { "X-Forwarded-For": realIp };
  return {};
}
