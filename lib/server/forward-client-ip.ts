import { createHmac } from "node:crypto";

/**
 * Repasse do IP real do cliente ao backend (Spring), assinado com HMAC para
 * que o backend não aceite um IP forjado. Formato assinado: `${ip}|${ts}`.
 * Espelha `ClientIpSignature.java` no msorquestrador-jf.
 *
 * Requer FISIO_PROXY_SECRET (mínimo 32 caracteres) em Vercel e Railway.
 */
export const CLIENT_IP_HEADERS = {
  ip: "X-Fisio-Client-IP",
  ts: "X-Fisio-Client-Ts",
  sig: "X-Fisio-Client-Sig",
} as const;

const MIN_SECRET_LENGTH = 32;

/**
 * IP do cliente como visto pela borda (Vercel). `x-real-ip` é definido pela plataforma;
 * como fallback usa o último valor de `x-forwarded-for` (nunca o primeiro, que o cliente controla).
 */
export function clientIpFromRequest(incoming: Request): string | null {
  const realIp = incoming.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const xff = incoming.headers.get("x-forwarded-for");
  if (xff) {
    const last = xff.split(",").pop()?.trim();
    if (last) return last;
  }
  return null;
}

export function signClientIp(secret: string, ip: string, ts: number): string {
  return createHmac("sha256", secret).update(`${ip}|${ts}`).digest("hex");
}

export function forwardedForHeaders(incoming: Request): HeadersInit {
  const secret = process.env.FISIO_PROXY_SECRET ?? "";
  const ip = clientIpFromRequest(incoming);
  if (!ip || secret.length < MIN_SECRET_LENGTH) return {};
  const ts = Math.floor(Date.now() / 1000);
  return {
    [CLIENT_IP_HEADERS.ip]: ip,
    [CLIENT_IP_HEADERS.ts]: String(ts),
    [CLIENT_IP_HEADERS.sig]: signClientIp(secret, ip, ts),
  };
}
