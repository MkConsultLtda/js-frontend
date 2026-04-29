# Implementação backlog segurança/qualidade — 2026-04-29

## Escopo executado

Execução sequencial das três atividades abertas no backlog:

1. Endurecimento de CSP por rota.
2. Revisão do alerta transitivo `next -> postcss` no `npm audit`.
3. Redução de warnings na tela de perfil.

## Step-by-step

### 1) Endurecer CSP por rota

- **Arquivo alterado:** `next.config.ts`
- **Ações:**
  - Refatorada a montagem da CSP para função `buildCsp`.
  - Criado mapeamento por rota:
    - `/api/:path*` com `script-src 'self'`.
    - `/:path*` com baseline atual para páginas.
  - Removido `'unsafe-eval'` de produção (mantido apenas em ambientes não-prod).
- **Decisão arquitetural:**
  - Endurecimento incremental para reduzir risco de regressão visual/funcional no App Router.
  - Priorizada restrição forte nas rotas de API, onde não há necessidade de scripts inline.

### 2) Revisar alerta transitivo do `npm audit`

- **Arquivos alterados:** `docs/operacao/configuracao-producao-integracao-back-front.md`
- **Ações:**
  - Executado `npm audit --json`.
  - Validada árvore com `npm ls next postcss`.
  - Documentada decisão técnica para não aplicar downgrade sugerido automaticamente.
- **Decisão arquitetural:**
  - Manter compatibilidade e estabilidade da stack (Next 16), aceitando risco transitivo temporário até correção oficial.
  - Formalizado checklist operacional para revalidação em upgrades.

### 3) Ajustar warnings da página de perfil

- **Arquivo alterado:** `app/(app)/perfil/page.tsx`
- **Ações:**
  - Substituído `watch("photoDataUrl")` por `useWatch({ control, name })`.
  - Substituído `<img>` por `next/image` com `unoptimized` para suportar preview por `data URL`.
- **Decisão arquitetural:**
  - Redução de ruído no CI sem criar exceções de lint.
  - Preservada UX atual de preview local da foto.

## Validação

- `npm run lint` ✅
- `npm run build` ✅

## Arquivos modificados

- `next.config.ts`
- `app/(app)/perfil/page.tsx`
- `docs/operacao/configuracao-producao-integracao-back-front.md`
- `docs/TODO.md`
- `docs/implementacao/backlog-seguranca-qualidade-2026-04-29.md`
