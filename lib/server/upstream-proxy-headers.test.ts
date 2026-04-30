import { describe, expect, it } from "vitest";

import { filterUpstreamProxyHeaders } from "@/lib/server/upstream-proxy-headers";

describe("filterUpstreamProxyHeaders", () => {
  it("remove content-encoding (body já decodificado pelo fetch no servidor)", () => {
    const upstream = new Response("{}", {
      headers: {
        "Content-Type": "application/json",
        "Content-Encoding": "gzip",
      },
    });
    const h = filterUpstreamProxyHeaders(upstream);
    expect(h.get("Content-Encoding")).toBeNull();
    expect(h.get("Content-Type")).toBe("application/json");
  });

  it("remove hop-by-hop incluindo content-length", () => {
    const upstream = new Response("x", {
      headers: {
        "Content-Type": "text/plain",
        "Content-Length": "1",
        Connection: "keep-alive",
      },
    });
    const h = filterUpstreamProxyHeaders(upstream);
    expect(h.get("content-length")).toBeNull();
    expect(h.get("connection")).toBeNull();
    expect(h.get("Content-Type")).toBe("text/plain");
  });

  it("remove set-cookie do upstream", () => {
    const upstream = new Response("{}", {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "foo=bar; Path=/",
      },
    });
    const h = filterUpstreamProxyHeaders(upstream);
    expect(h.get("Set-Cookie")).toBeNull();
  });
});
