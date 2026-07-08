# Step-by-step — Responsividade mobile/tablet (fase 1)

Data: 2026-05-28
Roadmap: §4 (Responsividade). Fase 1: correções de maior impacto e menor risco (somente classes Tailwind).

## Contexto

A Julli atende em domicílio, então o uso no celular é frequente. Auditoria identificou os principais pontos
de ruptura: formulários em `grid-cols-4` apertados em dialogs, `p-8` universal comprimindo o conteúdo, títulos
`text-3xl` grandes demais, grid de 3 colunas em tablet e nome do paciente sem truncamento.

## Correções aplicadas

### 1. Formulários empilham no mobile
Padrão `grid grid-cols-4` + `Label text-right` (label fixo em 25% mesmo em telas estreitas) trocado por
`grid-cols-1` no mobile (label acima do campo) e `sm:grid-cols-4` a partir de 640px. Label só alinha à direita
em `sm+`.

- `components/pacientes/patient-form-fields.tsx` (15 linhas)
- `components/agenda/appointment-form-fields.tsx` (8 linhas)
- `components/agenda/calendar-extra-form-fields.tsx` (7 linhas)

Antes: `grid grid-cols-4 items-start gap-4` + `text-right pt-2`
Depois: `grid grid-cols-1 gap-1.5 sm:grid-cols-4 sm:items-start sm:gap-4` + `sm:text-right sm:pt-2`

### 2. Padding e títulos das páginas
Todas as rotas `app/(app)/`: `p-8` → `p-4 sm:p-6 lg:p-8`; títulos `text-3xl` → `text-2xl sm:text-3xl`.

- `dashboard`, `agenda`, `pacientes`, `pacientes/[id]`, `evolucao`, `anamnese`, `configuracoes`, `perfil`.

### 3. Evolução e prontuário
- `evolucao/page.tsx`: grid do formulário `md:grid-cols-3` → `sm:grid-cols-2 lg:grid-cols-3` (evita 3 colunas espremidas no tablet).
- `pacientes/[id]/page.tsx`: nome do paciente com `min-w-0` + `truncate` e ícone `shrink-0` (evita estouro de nomes longos); lista "Próximos agendamentos" empilha no mobile (`flex-col` → `sm:flex-row`).

### 4. Anamnese
- `anamnese/page.tsx`: container `prose` recebeu `overflow-x-auto` para HTML clínico com tabelas/conteúdo largo.

## Validação
- `npm run lint`: sem novos erros.
- `npm run build`: sucesso (TypeScript OK, 22 rotas geradas).

## Pendente (fase 2 — maior esforço, decisão de UX)
- **Agenda — vista semanal** (`agenda-week-view.tsx`, `min-w-[720px]`): hoje força scroll horizontal no mobile.
  Ideal: alternar para vista lista/dia abaixo de `lg`. Requer hook de breakpoint (`useIsMobile`) ou renderização condicional.
- **Agenda — vista mensal** (`agenda-month-view.tsx`, grid 7 colunas): chips truncados em telas pequenas.
- **Lista de atendimentos do dia** (`agenda-appointment-list.tsx`): até 7 botões por card — agrupar em um menu "Ações" no mobile.
- Avaliar instalar shadcn `Sheet` para substituir o `Dialog` lateral do menu mobile (melhoria de UX).
