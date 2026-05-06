# Step-by-step — hardening de autenticação frontend (2026-05-06)

## Objetivo
Endurecer o BFF de autenticação no Next.js para reduzir risco de entrada malformada e alinhar logout com revogação no backend.

## Etapas executadas
1. **Validação de entrada nos handlers de auth**
   - Arquivos:
     - `app/api/auth/login/route.ts`
     - `app/api/auth/password/route.ts`
     - `app/api/auth/profile/route.ts`
   - Ação:
     - Adicionados schemas `zod` e validação `safeParse` com retorno `400` padronizado.
   - Decisão arquitetural:
     - Validar no BFF para barrar payload inválido antes de atingir a API Java e reduzir superfície de abuso.

2. **Logout integrado com revogação no backend**
   - Arquivo:
     - `app/api/auth/logout/route.ts`
   - Ação:
     - Antes de limpar cookies, o BFF tenta chamar `POST /auth/logout` no backend com access token.
     - Em `401`, tenta recuperação por refresh e faz nova tentativa única.
   - Decisão arquitetural:
     - Manter resiliência sem quebrar UX de logout em cenário de access expirado.

3. **Hardening de cabeçalhos de script**
   - Arquivo:
     - `next.config.ts`
   - Ação:
     - Em produção, `script-src` passou a aceitar apenas `'self'` (remoção de `'unsafe-inline'`).
   - Decisão arquitetural:
     - Reduzir risco de execução de scripts inline em ambiente produtivo.

## Impacto esperado
- Menos requisições inválidas chegando ao backend.
- Logout efetivamente revoga sessão no servidor.
- Política CSP mais restritiva para scripts em produção.
