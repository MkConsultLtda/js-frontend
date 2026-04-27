# Step-by-step - migração do editor da anamnese para TipTap

## Objetivo

Resolver de forma definitiva os problemas de formatação no bloco de texto da anamnese:

- título;
- lista;
- lista numerada;
- suporte estável para tabulação;
- tamanho da fonte.

## Etapas executadas

1. Análise do editor customizado baseado em `contentEditable`.
2. Substituição por framework robusto (`TipTap`) no componente `RichTextEditor`.
3. Configuração do editor com extensões:
   - `StarterKit` (base com heading/listas);
   - `Underline`;
   - `TextStyle` (estilo de texto/tamanho de fonte);
   - `Placeholder`.
4. Implementação de toolbar com:
   - negrito, itálico, sublinhado;
   - título (H2) e subtítulo (H3);
   - lista e lista numerada;
   - tamanho de fonte (A-, A, A+);
   - limpar formatação;
   - desfazer/refazer.
5. Ajuste de `Tab` para não sair do editor.
6. Validação com lint dos arquivos alterados.

## Arquivos modificados

- `components/ui/rich-text-editor.tsx`
- `package.json`
- `package-lock.json`

## Dependências adicionadas

- `@tiptap/react`
- `@tiptap/starter-kit`
- `@tiptap/extension-underline`
- `@tiptap/extension-text-style`
- `@tiptap/extension-placeholder`

## Decisões arquiteturais

- A migração para TipTap reduz risco de regressão de seleção/cursor comum em `contentEditable` puro.
- O editor continua desacoplado da página e com API simples (`value`/`onChange`), facilitando reaproveitamento em outras telas.
