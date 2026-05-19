/** Segundos Unix do claim `exp` (sem validar assinatura — só para renovação proativa no BFF). */
export function jwtExpSeconds(token: string): number | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(Buffer.from(base64, "base64").toString("utf8")) as { exp?: unknown };
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

/** Access token expira em breve (padrão: 2 min de folga). */
export function accessTokenNeedsRefresh(accessToken: string, skewSeconds = 120): boolean {
  const exp = jwtExpSeconds(accessToken);
  if (exp == null) return false;
  return exp - Math.floor(Date.now() / 1000) <= skewSeconds;
}
