import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    coverage: {
      provider: "v8",
      include: ["lib/auth-me-api.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
    /**
     * Playwright usa `*.spec.ts` em `e2e/` — não coletar esses arquivos no Vitest (evita
     * "test.describe() to be called here").
     * Mantém exclusões comuns alinhadas ao default do Vitest + `e2e/`.
     */
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
      "**/e2e/**",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
