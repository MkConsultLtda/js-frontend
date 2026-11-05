# Step-by-step — Correção das logos (SVG inválido) + páginas legais

**Data:** 28/05/2026

## Parte 1 — Correção: logos não carregavam

### Diagnóstico

- Os arquivos eram servidos com HTTP 200 (`image/svg+xml`) e o HTML referenciava
  `src="/brand/js-logo.svg"` corretamente.
- A causa real era **XML inválido**: o caractere `·` (U+00B7) e `í` (U+00ED) foram
  gravados como **bytes Latin-1 isolados** (`0xB7`, `0xED`) em vez de UTF-8
  (`0xC2 0xB7`, `0xC3 0xAD`). Bytes UTF-8 inválidos fazem o parser de XML do
  navegador rejeitar o SVG → imagem quebrada.

### Correção

- Reescritos `public/brand/js-logo.svg`, `js-logo-dark.svg`, `js-icon.svg` e
  `app/icon.svg` em **ASCII puro**, usando a entidade XML `&#183;` para o separador
  e removendo acentos de `aria-label`. Validados como XML bem-formado (0 bytes não-ASCII).
- Mantido `unoptimized` no `next/image` para SVG (evita o bloqueio de otimização de
  SVG do Next sem habilitar `dangerouslyAllowSVG` global).

## Parte 2 — Páginas legais (LGPD / COFFITO)

### Objetivo

Publicar Política de Privacidade e Termos de Uso (itens pendentes do `INDICE-MESTRE.md`)
e ligar os links no rodapé da landing.

### Arquivos criados

| Arquivo | Função |
|---------|--------|
| `components/legal/legal-shell.tsx` | Layout reutilizável (logo, voltar, container tipográfico) |
| `app/termos-de-uso/page.tsx` | Termos de Uso (a partir do template `js-fisio-termos-de-uso.md`) |
| `app/politica-de-privacidade/page.tsx` | Política LGPD (template padrão: dados, base legal, retenção, direitos, DPO) |

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `components/landing/landing-cta-footer.tsx` | Links de Política/Termos no rodapé |

### Decisões

- Rotas **públicas** no nível raiz (`/termos-de-uso`, `/politica-de-privacidade`):
  não entram no `matcher` do `proxy.ts`, logo são acessíveis sem login.
- Shell único (`LegalShell`) evita duplicação de cabeçalho/rodapé/tipografia (DRY).
- Campos a preencher pela clínica ficam marcados como `[INSERIR ...]`.

### Verificação

- `npm run build`: sucesso; `/termos-de-uso` e `/politica-de-privacidade` como estáticas (○).
- SVGs validados como XML bem-formado e servidos com 200.

## Pendências relacionadas

- Substituir os campos `[INSERIR ...]` (cidade/UF, e-mail, telefone, DPO, nº CREFITO).
- Página de consentimento LGPD no cadastro de paciente (BLOCO 1 — backend + banco).
