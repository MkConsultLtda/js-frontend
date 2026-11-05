# Step-by-step — Dashboard reorganizado e módulo Financeiro

## Objetivo

Reorganizar o dashboard em zonas (Agora, Atenção, Semana, Mês) e criar a página `/financeiro` com lançamentos manuais.

## Arquivos criados/alterados

### Dashboard
- `components/dashboard/dashboard-page-content.tsx` — orquestrador com hooks
- `components/dashboard/dashboard-skeleton.tsx` — skeleton de loading
- `components/dashboard/dashboard-zone-agora.tsx` — cards, rota e agenda de hoje
- `components/dashboard/dashboard-zone-atencao.tsx` — aniversariantes, faltas, link financeiro
- `components/dashboard/dashboard-zone-semana.tsx` — gráfico e tabela resumo
- `components/dashboard/dashboard-zone-mes.tsx` — seção colapsável + relatório financeiro
- `app/(app)/dashboard/page.tsx` — wrapper fino

### Financeiro
- `app/(app)/financeiro/page.tsx` — página principal
- `components/finance/finance-scope-toggle.tsx` — filtro Profissional/Pessoal/Todos
- `components/finance/finance-summary-cards.tsx` — cards saldo/receitas/despesas/a receber
- `components/finance/finance-transaction-dialog.tsx` — formulário de lançamento
- `components/finance/finance-transactions-table.tsx` — tabela com exclusão

### Navegação
- `lib/navigation.ts` — item Financeiro com ícone Wallet

## Decisões

- Métricas centralizadas em `computeDashboardMetrics` e `sessionStatusBadge`
- Mês colapsado por padrão no mobile; expandido em telas ≥1024px
- Financeiro usa APIs em `lib/api/finance-api.ts` com escopo e mês navegável
