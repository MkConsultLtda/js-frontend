# Implementação — Auth com cookies HttpOnly

## Etapas executadas

1. Substituído o fluxo de sessão mock por sessão baseada em cookies HttpOnly.
2. Criados route handlers no Next (`/api/auth/*`) para atuar como BFF:
   - `POST /api/auth/login`
   - `POST /api/auth/refresh`
   - `POST /api/auth/logout`
   - `GET /api/auth/me`
3. Cookies definidos:
   - `fisio_at` (access token)
   - `fisio_rt` (refresh token)
4. Middleware atualizado para proteger rotas privadas verificando o cookie de access.
5. Tela de login alterada para chamar o endpoint interno `/api/auth/login`.
6. Logout atualizado para chamar `/api/auth/logout`.
7. README ajustado com variáveis de ambiente para backend.

## Arquivos criados

- `lib/server-auth.ts`  
  Resolve URL do backend e constantes compartilhadas de cookies.
- `app/api/auth/login/route.ts`  
  Faz login no backend e grava cookies HttpOnly.
- `app/api/auth/refresh/route.ts`  
  Renova tokens com base no cookie de refresh.
- `app/api/auth/logout/route.ts`  
  Limpa os cookies de autenticação.
- `app/api/auth/me/route.ts`  
  Obtém `/auth/me` e tenta refresh automático se access expirar.

## Arquivos alterados

- `lib/session-constants.ts`  
  Novos nomes de cookies (`fisio_at`, `fisio_rt`).
- `lib/auth-session.ts`  
  Removeu cookie mock manual; agora chama `/api/auth/logout`.
- `middleware.ts`  
  Validação por cookie HttpOnly de access.
- `app/(auth)/login/page.tsx`  
  Login assíncrono real + feedback de erro/loading.
- `components/sidebar-nav.tsx`  
  Logout real (API) e refresh de rota.
- `app/(app)/configuracoes/page.tsx`  
  Logout real (API).
- `README.md`  
  Atualização do estado de autenticação e env vars.

## Decisões arquiteturais

- Mantido padrão BFF no Next para evitar expor tokens no JavaScript do browser.
- Cookie `Secure` habilitado apenas em produção (`NODE_ENV=production`), para funcionar em dev local HTTP.
- O refresh foi concentrado no route handler `/api/auth/me` para reduzir acoplamento nas telas.
