# Step-by-step — resiliência de métricas no dashboard

## Objetivo
Evitar erro global no dashboard quando uma ou mais chamadas de evolução falharem de forma transitória, preservando as métricas disponíveis.

## Etapas executadas
1. Identificado que o dashboard agregava evoluções com `Promise.all`, falhando completamente ao primeiro erro parcial.
2. Alterada agregação para `Promise.allSettled`, mantendo resultados bem-sucedidos e descartando apenas chamadas com falha.
3. Adicionado `console.warn` para observabilidade local quando houver falha parcial.
4. Ajustada mensagem de UI para refletir sincronização parcial sem orientar incorretamente para `BACKEND_API_URL`.

## Arquivos alterados
- `lib/api/fisio-api.ts`
- `app/(app)/dashboard/page.tsx`

## Decisões arquiteturais
- Favorecida estratégia de degradação graciosa (partial data) para reduzir impacto de instabilidades transitórias.
- Mantida simplicidade do contrato atual da API, sem exigir novo endpoint agregado no backend neste momento.

---

## Atualização 2026-04-29 (sessão longa + cópia do produto)

### Problema
Após permanecer no dashboard (ex.: token de acesso ~15 min) e ocorrer novo carregamento (foco na janela, dados *stale*), falhas 401 ou rajadas de requisições paralelas geravam erro genérico e texto ainda falando em “mock”.

### Alterações
1. **`lib/api/hooks/use-fisio.ts`**: `fetchDashboardBundleWithSessionRecovery` — em 401, `POST /api/auth/refresh` e nova tentativa do bundle; `retry` para rede/5xx/429 (não duplica 401).
2. **`lib/api/fisio-api.ts`**: agregação de evoluções em lotes de 8 requisições paralelas (antes: todas de uma vez), reduzindo pressão no browser e no proxy.
3. **`app/(app)/dashboard/page.tsx`**: mensagens separadas para falha inicial (`isLoadingError`) vs falha em segundo plano (`isRefetchError`) + botão “Tentar novamente”; textos do resumo e do gráfico sem referência a mock.
4. **Cópia profissional**: `configuracoes/page.tsx`, `perfil/page.tsx`, `lib/types.ts` (JSDoc), `lib/patient-pdf.ts` (cabeçalho do PDF).

### Arquivos tocados nesta atualização
- `lib/api/hooks/use-fisio.ts`
- `lib/api/fisio-api.ts`
- `app/(app)/dashboard/page.tsx`
- `app/(app)/configuracoes/page.tsx`
- `app/(app)/perfil/page.tsx`
- `lib/types.ts`
- `lib/patient-pdf.ts`
- `docs/implementacao/step-by-step-dashboard-resiliencia-metricas-2026-04-29.md`
