# Tratamento de erros — inventário e padrão (Fisio Web)

## 1. Situação atual (mock)

| Fluxo | Falha comum | Comportamento atual | Melhorar |
|-------|-------------|----------------------|----------|
| Formulários (Zod) | Validação | Mensagens no campo + Sonner (alguns fluxos) | Garantir `FormFieldError` + toast só para operações. |
| Mock / storage | `localStorage` cheio, JSON inválido | Silently ignored em vários loads | Exibir aviso e fallback seguro. |
| Rotas inexistentes | 404 | `app/not-found.tsx` (links para início, dashboard, agenda) | Manter CTA alinhado ao menu. |
| Exceção React (área /app) | Erro inesperado | **Tratado** por `app/(app)/error.tsx` (reset + link) | OK; evoluir com ID de suporte. |
| Rede (futuro API) | 401, 409, 500 | Ainda N/A | Mapear `code` (ver `api-requisitos-backend`) + toast. |

## 2. Padrão recomendado (com API)

1. **Camada de fetch:** `throw` com objeto `{ code, message, status }` ou parser central (`lib/api-client.ts`).
2. **UI:** `try/catch` em actions → `toast.error(mensagem genérica para o usuário)`; **não** exibir stack ou SQL.
3. **Formularios:** erros mapeados do backend para `setError` do react-hook-form.
4. **Log:** `console.error` / serviço com **digest** (Next) ou requestId — sem dados de paciente.
5. **Sessão expirada:** 401 global → interstitial “Sessão expirada” → login.

## 3. O que foi implementado nesta leva

- Arquivo **`app/(app)/error.tsx`**: bloco de recuperação (tentar de novo, ir ao dashboard) e `console.error` controlado.
- Arquivo **`app/not-found.tsx`**: 404 com atalhos de navegação.
- Documentação (este arquivo) e referência a códigos de API no repositório de requisitos.

## 4. Próximos passos técnicos

- [x] `app/not-found.tsx` com links úteis.
- [ ] Hook `useApiMutation` com toast padrão e retry (idempotente) — após existir `lib/api-client`.
- [ ] Integração com serviço de erros (Sentry etc.) com PII off.

## 5. Empty / loading (relacionado)

- Padronizar **skeletons** (Shadcn) em listas longas; **estado vazio** com CTA (ex.: “Criar paciente”).
