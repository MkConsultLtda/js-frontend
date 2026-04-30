/**
 * Cabeçalhos do upstream (Spring) que não devem ser repassados ao browser
 * ao fazer proxy com body já materializado (arrayBuffer).
 */
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

/**
 * Filtra cabeçalhos do `fetch` server-side → cliente.
 * - hop-by-hop: o runtime já tratou ou são inválidos na resposta downstream.
 * - `content-encoding`: o `fetch` do Node costuma entregar body já decodificado;
 *   repassar `gzip` com JSON plain quebra o parse no browser ("Failed to fetch" / corpo inválido).
 * - `set-cookie` do upstream: cookies de sessão são definidos só pelo Next (`attachRefreshedTokensIfNeeded`).
 */
export function filterUpstreamProxyHeaders(upstream: Response): Headers {
  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    if (lower === "content-encoding") return;
    if (lower === "set-cookie") return;
    out.set(key, value);
  });
  return out;
}
