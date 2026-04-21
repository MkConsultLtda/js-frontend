# Step-by-step - continuidade do backlog (agenda e evolução)

## Objetivo

Dar sequência no backlog com foco nas tarefas prioritárias e de impacto direto no fluxo clínico:

- agenda com detecção de conflito e ajustes de bloqueio/evento;
- evolução com sinais vitais e filtro por paciente.

## Etapas executadas

1. Implementação de utilitário de agendamento para:
   - detectar sobreposição de horários;
   - calcular duração por início/fim;
   - formatar faixa de horário para mensagens.
2. Evolução do schema/formulário de extras da agenda com:
   - dia inteiro;
   - hora de início e fim;
   - repetição semanal por dias + data limite.
3. Implementação de confirmação explícita em caso de conflito na agenda:
   - criação/edição de sessão;
   - criação/edição de bloqueio/evento.
4. Implementação de criação em lote para repetições semanais de bloqueio/evento.
5. Atualização da evolução:
   - campos de sinais vitais no início e fim;
   - filtro por paciente na própria tela;
   - exibição dos sinais vitais nos cards.
6. Atualização do `TODO.md` movendo tarefas concluídas para a seção `Concluido`.

## Arquivos modificados

- `app/(app)/agenda/page.tsx`
- `components/agenda/calendar-extra-form-fields.tsx`
- `lib/schemas/calendar-extra-form.ts`
- `lib/agenda-scheduling.ts`
- `app/(app)/evolucao/page.tsx`
- `lib/schemas/evolucao-form.ts`
- `lib/types.ts`
- `lib/mock-seed.ts`
- `docs/TODO.md`

## Decisões arquiteturais

- A lógica de conflito foi centralizada na camada de página da agenda para reaproveitar o mesmo comportamento entre criar/editar.
- A repetição semanal foi implementada no cliente (mock local), sem scheduler externo, mantendo simplicidade.
- O filtro por paciente na evolução foi feito na própria tela (sem depender de query string), preservando o suporte ao link com `?pacienteId=`.
