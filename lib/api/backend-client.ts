/**
 * Todas as chamadas passam pelo route handler `/api/backend/*`,
 * que repassa o cookie HttpOnly ao Spring (ver docs de produção).
 */
export type ApiErrorBody = {
  code?: string;
  message?: string;
  details?: unknown[];
};

function joinPath(parts: string[]): string {
  return parts
    .map((p) => p.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}

/** Caminho sem prefixo `/v1` (a base já inclui /v1 no servidor). */
export function backendApiPath(parts: string | string[]): string {
  const path = typeof parts === "string" ? parts : joinPath(parts);
  return `/api/backend/${path}${path.endsWith("/") ? "" : ""}`;
}

/** Monta `/api/backend/patients?page=…` etc. */
export function backendApiHref(path: string, searchParams?: Record<string, string | number | undefined>) {
  const u = new URL(backendApiPath(path), "http://local");
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v !== undefined && v !== "") u.searchParams.set(k, String(v));
    });
  }
  return `${u.pathname}${u.search}`;
}

export async function backendJson<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    const message = err?.message ?? res.statusText ?? "Falha na requisição";
    const e = new Error(message) as Error & { status?: number; body?: ApiErrorBody };
    e.status = res.status;
    e.body = err ?? undefined;
    throw e;
  }
  if (res.status === 204 || res.status === 205) {
    return undefined as T;
  }
  const text = await res.text();
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return undefined as T;
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const e = new Error("Resposta inválida da API (não é JSON)") as Error & { status?: number };
    e.status = res.status;
    throw e;
  }
}

export async function backendBlob(path: string, init?: RequestInit): Promise<Blob> {
  const res = await fetch(backendApiPath(path), {
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    const message = err?.message ?? res.statusText ?? "Falha na requisição";
    const e = new Error(message) as Error & { status?: number; body?: ApiErrorBody };
    e.status = res.status;
    e.body = err ?? undefined;
    throw e;
  }
  return res.blob();
}
