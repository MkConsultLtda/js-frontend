# Step-by-step — Responsividade fase 2: agenda no mobile

Data: 2026-05-28
Roadmap: §4 (Responsividade) — fase 2, foco na agenda.

## Problema

A vista semanal da agenda (`agenda-week-view.tsx`) usa uma grade de 24h × 7 dias com `min-w-[720px]`,
forçando scroll horizontal duplo em celulares. A lista de atendimentos do dia também exibia até 7 botões por
card, empilhando em várias linhas no mobile.

## Abordagem

Introduzido um hook de breakpoint para alternar a UI de forma programática (em vez de só classes Tailwind),
renderizando uma versão compacta da semana abaixo de `lg` (1024px). A lista detalhada do dia (já existente,
abaixo do calendário) continua sendo a fonte de detalhe.

## Arquivos

| Arquivo | Mudança |
|---------|---------|
| `lib/hooks/use-is-mobile.ts` | **Novo.** `useIsMobile(breakpoint = 1024)` com `matchMedia`, SSR-safe (inicia `false`, ajusta no mount). |
| `components/agenda/agenda-week-mobile.tsx` | **Novo.** Faixa de 7 dias selecionáveis (dia da semana, número, contador de atendimentos, marcador de feriado), com navegação prev/Hoje/next. Reaproveita `getWeekDatesContaining`, `toLocalDateString`, `isWorkingDate`, `holidaysForDate`. |
| `app/(app)/agenda/page.tsx` | Importa o hook e o componente; no modo semana, renderiza `AgendaWeekMobile` quando `isMobile`, senão `AgendaWeekView`. |
| `components/agenda/agenda-appointment-list.tsx` | Barra de ações vira **linha única rolável** no mobile (`overflow-x-auto`), mantendo `flex-wrap` em `sm+`. |

## Comportamento

- **Desktop (≥1024px):** inalterado — grade semanal completa com horários.
- **Mobile/tablet (<1024px), vista semana:** faixa compacta de dias; tocar num dia foca a lista de atendimentos abaixo.
- **Vista mês:** mantida (grade de 7 colunas é tocável; aceitável no mobile).
- **Lista do dia:** ações em uma linha deslizável (não empilham mais em 3 linhas).

## Validação
- `npm run lint`: sem novos erros.
- `npm run build`: sucesso.

## Pendente / melhorias futuras
- Vista mensal: chips de atendimento ainda truncam bastante em telas muito estreitas.
- Avaliar shadcn `Sheet` para o menu lateral mobile (hoje via `Dialog` em `app-shell.tsx`).
- Extrair um componente `FormRow` compartilhado para o padrão de formulário responsivo (reduz duplicação).
