# Step-by-step - correção de Dialog e anamnese em bloco único

## Objetivo

1. Resolver erro de acessibilidade do `DialogContent` exigindo `DialogTitle`.
2. Dar sequência no backlog implementando anamnese em bloco único editável.

## Etapas executadas

1. Ajuste no componente base `DialogContent` para adicionar fallback acessível:
   - se não houver `DialogTitle` no conteúdo, injeta título oculto com `VisuallyHidden`.
2. Criação de editor de texto rico leve (`contentEditable`) para anamnese:
   - negrito;
   - itálico;
   - sublinhado;
   - lista;
   - lista numerada;
   - título.
3. Migração da anamnese para modelo de bloco único:
   - schema de formulário alterado para `anamneseTexto`;
   - tela de anamnese atualizada para usar editor único + seleção de paciente.
4. Compatibilidade com dados antigos:
   - função que converte registros legados (campos separados) para HTML do novo editor ao editar/visualizar.
5. Atualização do `TODO.md` movendo tarefa da anamnese para `Concluido`.

## Arquivos modificados

- `components/ui/dialog.tsx`
- `components/ui/rich-text-editor.tsx` (novo)
- `app/(app)/anamnese/page.tsx`
- `lib/schemas/anamnese-form.ts`
- `lib/types.ts`
- `docs/TODO.md`

## Decisões arquiteturais

- O fallback de `DialogTitle` no componente base evita recorrência do erro em modais atuais e futuros.
- O editor rico foi implementado sem dependências externas para manter simplicidade do projeto.
- O domínio de anamnese preserva compatibilidade com estrutura legada, enquanto o fluxo novo passa a priorizar texto único.
