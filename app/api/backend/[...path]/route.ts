import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  attachRefreshedTokensIfNeeded,
  resolveAccessTokenForBackendProxy,
  tryRecoverFromUnauthorizedWithRefresh,
  type TokenResponse,
} from "@/lib/server/backend-access";
import { backendApiUrl } from "@/lib/server-auth";

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

function buildTargetUrl(pathSegments: string[], search: string): string {
  const base = backendApiUrl();
  const path = pathSegments.map(encodeURIComponent).join("/");
  return `${base}/${path}${search}`;
}

function forwardHeaders(req: NextRequest, accessToken: string): Headers {
  const out = new Headers();
  out.set("Authorization", `Bearer ${accessToken}`);
  const accept = req.headers.get("accept");
  if (accept) out.set("Accept", accept);
  const contentType = req.headers.get("content-type");
  if (contentType) out.set("Content-Type", contentType);
  const acceptLanguage = req.headers.get("accept-language");
  if (acceptLanguage) out.set("Accept-Language", acceptLanguage);
  return out;
}

function copyUpstreamHeaders(upstream: Response): Headers {
  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    out.set(key, value);
  });
  return out;
}

async function forwardOnce(
  req: NextRequest,
  pathSegments: string[],
  accessToken: string,
): Promise<Response> {
  const method = req.method.toUpperCase();
  const search = req.nextUrl.search;
  const url = buildTargetUrl(pathSegments, search);
  const headers = forwardHeaders(req, accessToken);

  let body: BodyInit | undefined;
  if (!["GET", "HEAD"].includes(method)) {
    body = await req.blob();
  }

  return fetch(url, {
    method,
    headers,
    body,
    cache: "no-store",
  });
}

function attachTokenRefresh(
  downstream: NextResponse,
  initialRefreshed: TokenResponse | undefined,
  retryRefreshed: TokenResponse | undefined,
): NextResponse {
  const bag = retryRefreshed ?? initialRefreshed;
  return attachRefreshedTokensIfNeeded(downstream, bag);
}

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (!path?.length) {
    return NextResponse.json({ code: "NOT_FOUND", message: "Recurso inválido", details: [] }, {
      status: 404,
    });
  }

  const session = await resolveAccessTokenForBackendProxy();
  if (!session.ok) {
    return session.response;
  }

  let upstream = await forwardOnce(req, path, session.accessToken);
  let recovered: TokenResponse | undefined;

  if (upstream.status === 401) {
    const recovery = await tryRecoverFromUnauthorizedWithRefresh();
    if (recovery instanceof NextResponse) {
      return recovery;
    }
    if (recovery) {
      recovered = recovery;
      upstream = await forwardOnce(req, path, recovery.accessToken);
    }
  }

  const headers = copyUpstreamHeaders(upstream);
  const downstream = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });

  attachTokenRefresh(downstream, session.refreshed, recovered);
  return downstream;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
