import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  attachRefreshedTokensIfNeeded,
  resolveAccessTokenForBackendProxy,
  tryRecoverFromUnauthorizedWithRefresh,
  type TokenResponse,
} from "@/lib/server/backend-access";
import { filterUpstreamProxyHeaders } from "@/lib/server/upstream-proxy-headers";
import { backendApiUrl } from "@/lib/server-auth";

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

async function readRequestBody(req: NextRequest, method: string): Promise<BodyInit | undefined> {
  if (["GET", "HEAD"].includes(method)) return undefined;
  return req.blob();
}

async function forwardOnce(
  method: string,
  search: string,
  pathSegments: string[],
  accessToken: string,
  req: NextRequest,
  cachedBody: BodyInit | undefined,
): Promise<Response> {
  const url = buildTargetUrl(pathSegments, search);
  const headers = forwardHeaders(req, accessToken);

  return fetch(url, {
    method,
    headers,
    body: cachedBody,
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

  const method = req.method.toUpperCase();
  const search = req.nextUrl.search;
  const cachedBody = await readRequestBody(req, method);

  let upstream = await forwardOnce(
    method,
    search,
    path,
    session.accessToken,
    req,
    cachedBody,
  );
  let recovered: TokenResponse | undefined;

  if (upstream.status === 401) {
    const recovery = await tryRecoverFromUnauthorizedWithRefresh();
    if (recovery instanceof NextResponse) {
      return recovery;
    }
    if (recovery) {
      recovered = recovery;
      upstream = await forwardOnce(
        method,
        search,
        path,
        recovery.accessToken,
        req,
        cachedBody,
      );
    }
  }

  const body = await upstream.arrayBuffer();
  const headers = filterUpstreamProxyHeaders(upstream);
  const downstream = new NextResponse(body, {
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
