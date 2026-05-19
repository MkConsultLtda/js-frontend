/**
 * Todas as chamadas passam pelo route handler `/api/backend/*`,
 * que repassa o cookie HttpOnly ao Spring (ver docs de produção).
 */
export type ApiErrorBody = {
  code?: string;
  message?: string;
  details?: unknown[];
};

export type ApiClientError = Error & { status?: number; body?: ApiErrorBody };

function firstApiValidationDetail(details: unknown[]): string | undefined {
  for (const d of details) {
    if (d != null && typeof d === "object") {
      const o = d as Record<string, unknown>;
      const field = o.field ?? o.path;
      const msg = o.message;
      if (typeof msg === "string" && msg.trim()) {
        const label = typeof field === "string" && field ? `${field}: ` : "";
        return `${label}${msg}`.trim();
      }
    }
  }
  return undefined;
}

function firstApiRuleCode(details: unknown[]): string | undefined {
  for (const d of details) {
    if (d != null && typeof d === "object") {
      const o = d as Record<string, unknown>;
      const ruleCode = o.ruleCode;
      if (typeof ruleCode === "string" && ruleCode.trim()) {
        return ruleCode.trim();
      }
    }
  }
  return undefined;
}

/**
 * Mensagem para toast/UI a partir de erro lançado por `backendJson` / `backendBlob`
 * (inclui detalhe para `VALIDATION` e `BUSINESS_RULE` quando disponíveis).
 */
export function formatUserFacingApiError(error: unknown, fallbackMessage: string): string {
  if (!(error instanceof Error)) return fallbackMessage;
  const base = error.message.trim() || fallbackMessage;
  const body = (error as ApiClientError).body;
  const code = body?.code;
  const details = body?.details;
  if (!code || !Array.isArray(details) || details.length === 0) return base;
  if (code === "VALIDATION") {
    const extra = firstApiValidationDetail(details);
    if (extra) return `${base} — ${extra}`;
  }
  if (code === "BUSINESS_RULE") {
    const ruleCode = firstApiRuleCode(details);
    if (ruleCode) return `${base} — regra: ${ruleCode}`;
  }
  return base;
}

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

async function parseBackendJsonResponse<T>(res: Response): Promise<T> {
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

async function fetchBackendJsonResponse(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers as Record<string, string>),
    },
  });
}

async function throwIfBackendError(res: Response): Promise<void> {
  if (res.ok) return;
  const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
  const message = err?.message ?? res.statusText ?? "Falha na requisição";
  const e = new Error(message) as ApiClientError;
  e.status = res.status;
  e.body = err ?? undefined;
  throw e;
}

/** Renova sessão e repete a requisição uma vez em 401 (mutations, evolução, etc.). */
export async function tryRefreshSession(): Promise<boolean> {
  const refreshRes = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });
  return refreshRes.ok;
}

export async function backendJson<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  let res = await fetchBackendJsonResponse(input, init);
  if (res.status === 401) {
    const renewed = await tryRefreshSession();
    if (renewed) {
      res = await fetchBackendJsonResponse(input, init);
    }
  }
  await throwIfBackendError(res);
  return parseBackendJsonResponse<T>(res);
}

export async function backendBlob(path: string, init?: RequestInit): Promise<Blob> {
  const res = await fetch(backendApiPath(path), {
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    const message = err?.message ?? res.statusText ?? "Falha na requisição";
    const e = new Error(message) as ApiClientError;
    e.status = res.status;
    e.body = err ?? undefined;
    throw e;
  }
  return res.blob();
}
