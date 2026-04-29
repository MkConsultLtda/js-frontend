import type { NextConfig } from "next";

const CSP_BASE = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https:",
  "connect-src 'self' https:",
  "form-action 'self'",
];

const buildCsp = (scriptDirectives: string[]) =>
  [...CSP_BASE, `script-src ${scriptDirectives.join(" ")}`].join("; ");

/** Headers de segurança para produção e operação em Vercel/Node */
const nextConfig: NextConfig = {
  async headers() {
    const baselineScriptSrc = ["'self'", "'unsafe-inline'"];
    if (process.env.NODE_ENV !== "production") {
      baselineScriptSrc.push("'unsafe-eval'");
    }

    const cspBySource: { source: string; csp: string }[] = [
      {
        source: "/api/:path*",
        csp: buildCsp(["'self'"]),
      },
      {
        source: "/:path*",
        csp: buildCsp(baselineScriptSrc),
      },
    ];

    const securityHeaders: { key: string; value: string }[] = [
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];
    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }

    return [
      ...cspBySource.map(({ source, csp }) => ({
        source,
        headers: [...securityHeaders, { key: "Content-Security-Policy", value: csp }],
      })),
    ];
  },
};

export default nextConfig;
