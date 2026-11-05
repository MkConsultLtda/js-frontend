import type { NextConfig } from "next";

/** CSP de páginas é definido no proxy.ts, com nonce por requisição. Aqui fica só a da API. */
const API_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https:",
  "connect-src 'self' https:",
  "form-action 'self'",
  "script-src 'self'",
].join("; ");

/** Headers de segurança para produção e operação em Vercel/Node */
const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  async headers() {
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
      {
        source: "/api/:path*",
        headers: [...securityHeaders, { key: "Content-Security-Policy", value: API_CSP }],
      },
    ];
  },
};

export default nextConfig;
