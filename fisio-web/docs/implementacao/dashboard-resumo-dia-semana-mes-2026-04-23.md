# Step-by-step - resumo diário, semanal e mensal no dashboard

## Objetivo

Cumprir o item de backlog de métricas para o dia a dia e visão semanal/mensal, reutilizando dados já existentes (agenda e evolução).

## Etapas

1. Função `brDateToIsoDate` em `lib/date-utils.ts` para alinhar datas de evolução (`dd/mm/aaaa`) a `yyyy-mm-dd` nas comparações de intervalo.
2. Inclusão de `evolucoes` do `useMockData` no dashboard.
3. Cálculo de totais: sessões, concluídas, canceladas, evoluções por intervalo, recebido e estimativa de a receber (sessões com pagamento pendente, não canceladas, × valor da sessão em Configurações).
4. Novo card com tabela **Hoje | Semana | Mês** (semana = segunda a domingo, igual ao agregado já usado no dashboard).
5. Atualização do `docs/TODO.md` (backlog → concluído).

## Arquivos

- `lib/date-utils.ts` — helper de conversão de data BR → ISO.
- `app/(app)/dashboard/page.tsx` — métricas e UI do resumo.
- `docs/TODO.md` — tarefa marcada como concluída.

## Decisões

- Estimativa financeira "a receber" usa o mesmo preço de sessão das configurações, sem desconto ou múltiplas tabelas de preço (mock).
- Evoluções filtradas pela **data da sessão** do registro, alinhado à tela de evolução.
