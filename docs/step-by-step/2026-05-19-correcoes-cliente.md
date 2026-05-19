# Correções — relatório da cliente (19/05/2026)

## 1. Sessão expirada ao salvar evolução

### Causa
- Access token JWT expira em ~15 min; renovação reativa falhava em POST (body consumido no retry do proxy).
- Corrida entre keep-alive e salvamento na rotação do refresh token.
- Mutations (evolução) não repetiam após 401.

### Alterações
| Arquivo | Função |
|---------|--------|
| `app/api/backend/[...path]/route.ts` | Body lido uma vez antes do forward/retry |
| `lib/server/backend-access.ts` | Refresh proativo antes de expirar; mutex de refresh |
| `lib/server/jwt-utils.ts` | Leitura do `exp` do JWT |
| `lib/server/refresh-mutex.ts` | Serialização de refresh concorrente |
| `lib/api/backend-client.ts` | Retry automático em 401 após `/api/auth/refresh` |
| `components/session-keep-alive.tsx` | Intervalo 7 min; não ignora falha silenciosa |
| `app/api/auth/refresh/route.ts` | Usa refresh com mutex compartilhado |

---

## 2. Remoção dor pré/pós sessão

### Alterações frontend
- `app/(app)/evolucao/page.tsx` — formulário, lista e detalhes
- `lib/schemas/evolucao-form.ts`, `lib/types.ts`, `lib/api/fisio-api.ts`
- `app/(app)/pacientes/[id]/page.tsx`, `lib/patient-pdf.ts`

### Alterações backend
- DTOs, domínio, entidade, mapper, testes
- Migration `V11__drop_evolution_pain_columns.sql`

---

## 3. Bloqueio multi-dia (dia inteiro)

### Causa
Multi-dia dependia de “repetição semanal” + dias da semana; `repeatUntil` sozinho não gerava intervalo.

### Alterações
| Arquivo | Função |
|---------|--------|
| `lib/agenda-extra-dates.ts` | Intervalo corrido quando `isAllDay` + `repeatUntil` |
| `app/(app)/agenda/page.tsx` | Usa novo helper |
| `lib/schemas/calendar-extra-form.ts` | Validação de data final em dia inteiro |
| `components/agenda/calendar-extra-form-fields.tsx` | Label “Até (dia)” em dia inteiro |

---

## Deploy
1. Backend (`msorquestrador-jf`) com migration V11 antes ou junto do frontend.
2. Frontend (`js-frontend`) após API sem `dorPre`/`dorPos`.
