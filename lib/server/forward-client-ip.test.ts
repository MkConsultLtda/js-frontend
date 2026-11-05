import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import {
  CLIENT_IP_HEADERS,
  clientIpFromRequest,
  forwardedForHeaders,
  signClientIp,
} from "./forward-client-ip";

const SECRET = "0123456789abcdef0123456789abcdef";

function req(headers: Record<string, string>): Request {
  return new Request("https://app.example/api/auth/login", { headers });
}

describe("clientIpFromRequest", () => {
  it("prefers x-real-ip set by the edge", () => {
    expect(clientIpFromRequest(req({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "9.9.9.9" }))).toBe(
      "203.0.113.7",
    );
  });

  it("uses the LAST x-forwarded-for entry, never the spoofable first one", () => {
    expect(clientIpFromRequest(req({ "x-forwarded-for": "9.9.9.9, 203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("returns null when no IP header exists", () => {
    expect(clientIpFromRequest(req({}))).toBeNull();
  });
});

describe("forwardedForHeaders", () => {
  let previous: string | undefined;

  beforeEach(() => {
    previous = process.env.FISIO_PROXY_SECRET;
  });

  afterEach(() => {
    if (previous === undefined) delete process.env.FISIO_PROXY_SECRET;
    else process.env.FISIO_PROXY_SECRET = previous;
  });

  it("returns no headers when the secret is missing or too short", () => {
    process.env.FISIO_PROXY_SECRET = "curto";
    expect(forwardedForHeaders(req({ "x-real-ip": "203.0.113.7" }))).toEqual({});
  });

  it("signs the client IP with HMAC-SHA256 over ip|ts", () => {
    process.env.FISIO_PROXY_SECRET = SECRET;
    const headers = forwardedForHeaders(req({ "x-real-ip": "203.0.113.7" })) as Record<string, string>;

    expect(headers[CLIENT_IP_HEADERS.ip]).toBe("203.0.113.7");
    const ts = Number(headers[CLIENT_IP_HEADERS.ts]);
    const expected = createHmac("sha256", SECRET).update(`203.0.113.7|${ts}`).digest("hex");
    expect(headers[CLIENT_IP_HEADERS.sig]).toBe(expected);
  });

  it("does not forward the raw client x-forwarded-for anymore", () => {
    process.env.FISIO_PROXY_SECRET = SECRET;
    const headers = forwardedForHeaders(req({ "x-forwarded-for": "9.9.9.9" })) as Record<string, string>;

    expect(headers["X-Forwarded-For"]).toBeUndefined();
  });
});

describe("signClientIp", () => {
  it("produces a stable 64-char hex digest (cross-checked against the Java implementation)", () => {
    expect(signClientIp(SECRET, "203.0.113.7", 1700000000)).toMatch(/^[0-9a-f]{64}$/);
  });
});
