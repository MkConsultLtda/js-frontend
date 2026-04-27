# Agenda — visualização mês / semana (estilo calendário)

## Objetivo

Atender ao pedido de uma agenda mais próxima do Google Agenda: calendário com atendimentos visíveis no próprio grid (mês) e visão semanal com grade de horários e blocos proporcionais à duração, facilitando enxergar horários livres.

## Arquivos criados

| Arquivo | Função |
|--------|--------|
| `lib/agenda-calendar-utils.ts` | Semana a partir do domingo (alinhado ao grid mensal), parsing de horário, faixa horária dinâmica da semana, ticks de hora. |
| `components/agenda/agenda-month-view.tsx` | Calendário mensal com células altas; até 3 atendimentos por dia + contador “+N”. |
| `components/agenda/agenda-week-view.tsx` | Sete colunas, eixo de horas à esquerda, blocos posicionados por início e duração. |
| `components/agenda/agenda-appointment-list.tsx` | Lista de detalhes do dia (busca, status, ações) extraída da página. |

## Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `app/(app)/agenda/page.tsx` | Estado `viewMode` (mês \| semana), navegação por mês ou por semana, composição dos novos componentes. |

## Decisões

- **Sem nova dependência** de calendário: implementação com Tailwind e utilitários locais, alinhado ao restante do projeto.
- **Semana começando no domingo**, igual ao grid mensal já existente (cabeçalhos D S T Q Q S S).
- **Faixa horária na semana**: calculada a partir dos atendimentos da semana (com limites 06:00–23:00); sem atendimentos, usa 08:00–18:00 como referência visual.
- **Lista “Detalhes do dia”** mantida abaixo do calendário para não perder busca, filtros e ações (mapa, WhatsApp, pagamento, editar, excluir).

## Próximas melhorias possíveis

- Colisão visual quando dois atendimentos se sobrepõem (colunas / empilhamento).
- Horário de expediente configurável nas Configurações (em vez de só inferir pela lista).
- Arrastar para mudar horário (requer mais estado e regras de negócio).
