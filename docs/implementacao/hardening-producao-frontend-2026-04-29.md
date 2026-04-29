# Step-by-step — hardening de produção no frontend

## Objetivo

- Aplicar ajustes de segurança e estabilidade para release de produção.
- Reduzir risco de CVEs do framework e melhorar postura de proteção de rotas/headers.

## Etapas executadas

1. **Atualização do framework**
   - Atualizado `next` de `16.1.4` para `16.2.4`.
   - Atualizado `eslint-config-next` para `16.2.4` (compatibilidade da toolchain).

2. **Migração de convenção de borda (Next 16)**
   - Removido `middleware.ts` (convenção depreciada).
   - Criado `proxy.ts` com mesma lógica de autenticação por cookie.
   - Incluído `"/perfil/:path*"` no `matcher` para proteger também a tela de perfil.

3. **Headers de segurança**
   - Ajustado `next.config.ts` com:
     - `Content-Security-Policy` (baseline para app/router e assets).
     - `Strict-Transport-Security` somente em `NODE_ENV=production`.
     - Mantidos `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

4. **Validação técnica**
   - `npm run lint` executado com sucesso (somente warnings não bloqueantes em `perfil/page.tsx`).
   - `npm run test` executado com sucesso.
   - `npm run build` executado com sucesso após limpeza de cache `.next` (necessária após upgrade).
   - `npm audit --omit=dev` reexecutado: removidos advisories high anteriores; restam apontamentos moderados transitivos reportados pelo npm para cadeia `next -> postcss`.

## Arquivos alterados

- `package.json`
- `package-lock.json`
- `next.config.ts`
- `proxy.ts` (novo)
- `middleware.ts` (removido)

## Decisões arquiteturais

- **Proxy em vez de middleware**: alinhamento com recomendação oficial do Next 16, evitando depreciação no pipeline.
- **HSTS condicionado a produção**: evita efeitos colaterais em ambiente local e mantém política rígida no deploy real.
- **CSP baseline pragmática**: adicionada sem bloquear funcionamento atual; endurecimento adicional pode ser feito em iteração seguinte com revisão por rota.
