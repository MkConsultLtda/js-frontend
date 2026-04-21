# Step-by-step - evolução com filtro por nome

## Objetivo

Atender à tarefa de backlog para a tela de evolução:

- mover o filtro para abaixo do título;
- permitir busca por digitação do nome do paciente.

## Etapas executadas

1. Remoção do filtro por `Select` (paciente por id).
2. Inclusão de campo `Input` abaixo do título da página.
3. Criação de estado `patientNameFilter` para busca textual.
4. Atualização da filtragem para `includes` em `patientName`.
5. Ajuste do comportamento de reset de formulário para manter fluxo com `pacienteId` da URL.
6. Atualização do `TODO.md` movendo tarefa para `Concluido`.

## Arquivos modificados

- `app/(app)/evolucao/page.tsx`
- `docs/TODO.md`

## Decisões arquiteturais

- Busca textual por nome foi priorizada por ser mais rápida para uso no dia a dia da clínica.
- O filtro foi posicionado próximo ao título para reduzir deslocamento visual e facilitar descoberta da funcionalidade.
