/**
 * Evita corrida na rotação do refresh token (keep-alive + save + múltiplas abas).
 * Requisições concorrentes com o mesmo refresh reutilizam a mesma Promise.
 */
const inflight = new Map<string, Promise<unknown>>();

export async function withRefreshMutex<T>(
  refreshToken: string,
  fn: () => Promise<T>,
): Promise<T> {
  const key = refreshToken;
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}
