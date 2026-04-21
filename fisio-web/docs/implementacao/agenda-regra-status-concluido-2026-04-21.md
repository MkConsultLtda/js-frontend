# Step-by-step - regra de status concluído na agenda

## Objetivo

Atender a tarefa de backlog sobre atualização de status:

- impedir conclusão de atendimento sem evolução vinculada.

## Etapas executadas

1. Inclusão de `evolucoes` no escopo da `AgendaPage`.
2. Criação de helper para verificar evolução por paciente + data do atendimento.
3. Validação no submit de criação de sessão:
   - se status for `completed` e não houver evolução da data, bloqueia salvamento com feedback.
4. Validação no submit de edição de sessão:
   - mesma regra de bloqueio para atualização de status.
5. Atualização do `TODO.md` movendo a tarefa para `Concluido`.

## Arquivos modificados

- `app/(app)/agenda/page.tsx`
- `docs/TODO.md`

## Decisões arquiteturais

- Vínculo evolucão-atendimento adotado por `patientId + data` para manter simplicidade sem nova modelagem de relacionamento.
- Regra foi aplicada no ponto de persistência (submit), garantindo integridade mesmo em edição manual de formulário.
