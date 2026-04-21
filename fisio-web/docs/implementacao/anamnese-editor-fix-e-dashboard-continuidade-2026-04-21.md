# Step-by-step - correções do editor e continuidade do backlog

## Objetivo

1. Corrigir o editor da anamnese para que título/listas funcionem corretamente.
2. Corrigir comportamento da tecla `Tab` para manter o foco no bloco de texto.
3. Dar sequência no backlog com evolução do dashboard.

## Etapas executadas

1. Ajuste do editor rico (`RichTextEditor`):
   - preservação/restauração de seleção;
   - toolbar com `onMouseDown` para não perder o cursor;
   - correção do comando de título (`formatBlock` com `H3`);
   - suporte de `Tab`/`Shift+Tab` dentro do editor.
2. Evolução do dashboard:
   - métricas diárias com valor recebido;
   - métricas semanais de financeiro e cancelamento;
   - métricas mensais com gráficos (financeiro, concluídos e cancelamentos);
   - progresso de meta financeira mensal;
   - link para prontuário ao clicar no paciente da lista do dia.
3. Evolução de configurações:
   - campo de valor da sessão;
   - campo de meta financeira mensal.
4. Atualização do `TODO.md` movendo item de dashboard para concluído.

## Arquivos modificados

- `components/ui/rich-text-editor.tsx`
- `app/(app)/dashboard/page.tsx`
- `app/(app)/configuracoes/page.tsx`
- `lib/clinic-settings.ts`
- `docs/TODO.md`

## Decisões arquiteturais

- O editor mantém seleção local para garantir execução previsível dos comandos de formatação.
- Métricas financeiras usam valor de sessão e meta mensal configuráveis localmente, sem depender de API.
- Os gráficos mensais foram implementados com CSS simples para manter baixo acoplamento e sem novas dependências.
