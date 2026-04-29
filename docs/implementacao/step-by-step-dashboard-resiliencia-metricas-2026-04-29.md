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
