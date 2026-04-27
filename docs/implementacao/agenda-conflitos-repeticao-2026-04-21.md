# Step-by-step - agenda (conflitos e ajustes de horarios)

## Objetivo

Executar tarefas prioritárias do backlog da agenda sem API:

- validação de conflito de horário com confirmação explícita;
- suporte a bloqueio/evento de dia inteiro;
- suporte a bloqueio/evento por início e fim;
- suporte a repetição semanal em dias selecionados.

## Etapas executadas

1. Criação de utilitário de agendamento em `lib/agenda-scheduling.ts` para:
   - cálculo de duração por faixa de horário;
   - verificação de sobreposição entre horários;
   - formatação de faixas para mensagens de conflito.
2. Evolução do schema de extras de agenda (`calendar-extra-form`) para suportar:
   - `isAllDay`;
   - `endTime`;
   - `repeatEnabled`;
   - `repeatWeekdays`;
   - `repeatUntil`;
   - validações condicionais.
3. Atualização do formulário de bloqueio/evento para capturar:
   - início/fim;
   - dia inteiro;
   - repetição semanal com seleção de dias.
4. Implementação de detecção de conflito no `AgendaPage`:
   - criação;
   - edição;
   - sessão e extras.
5. Inclusão de `ConfirmDialog` para conflitos:
   - usuário escolhe revisar horário ou salvar mesmo assim.
6. Implementação de criação em lote para repetição semanal de bloqueios/eventos.
7. Atualização do `TODO.md` movendo tarefas concluídas para `Concluido`.

## Arquivos modificados

- `app/(app)/agenda/page.tsx`
- `components/agenda/calendar-extra-form-fields.tsx`
- `lib/schemas/calendar-extra-form.ts`
- `lib/agenda-scheduling.ts` (novo)
- `docs/TODO.md`

## Decisões arquiteturais

- A validação de conflito foi centralizada na página da agenda para reaproveitar o mesmo fluxo de confirmação nas ações de criar/editar.
- O cálculo de duração ficou baseado em início/fim para extras, mantendo consistência com o requisito de bloqueio por período.
- A repetição foi implementada em lote no front (sem scheduler externo), adequada ao contexto mock/local.
