# Step-by-step — Rebranding "FisioSystem" → "JS Fisioterapia" + identidade visual

**Data:** 28/05/2026
**Origem:** `files/fisiosystem-prompts-estrategia.md` (§4 Identidade Visual) e `files/INDICE-MESTRE.md`
(itens "Em progresso": *Renomear FisioSystem → JS Fisioterapia* e *Logo aplicada no sistema*).

## Objetivo

Unificar o nome do produto na interface (estava "FisioSystem", hardcoded em vários pontos)
para a marca real **JS Fisioterapia — Julli Severina · CREFITO**, aplicar o logo/ícone oficiais
e configurar metadata, favicon e manifest PWA, que estavam ausentes.

## Decisões arquiteturais

- **Fonte única de verdade (DRY):** criada a constante `lib/brand.ts` com `BRAND_NAME`,
  `BRAND_OWNER`, `BRAND_TAGLINE`, `BRAND_DESCRIPTION` e os caminhos dos assets. Nenhuma string
  de marca permanece hardcoded em componentes.
- **Assets em `public/brand/`:** SVGs servidos estaticamente, referenciados via `next/image`.
  Favicon nativo via `app/icon.svg` (convenção do App Router) — sem `.ico` binário.
- **Metadata e manifest:** usados os recursos nativos do Next 16 (`metadata` em `layout.tsx`
  e rota `app/manifest.ts`), evitando arquivos estáticos duplicados.
- **`robots: noindex`:** o sistema é uma aplicação privada de clínica; não deve ser indexado.

## Arquivos criados

| Arquivo | Função |
|---------|--------|
| `lib/brand.ts` | Constantes centrais de marca (nome, tagline, descrição, caminhos de assets) |
| `public/brand/js-logo.svg` | Logo horizontal (fundo claro) |
| `public/brand/js-logo-dark.svg` | Logo invertida (fundo escuro) |
| `public/brand/js-icon.svg` | Ícone isolado (JS) |
| `app/icon.svg` | Favicon / app icon (App Router) |
| `app/manifest.ts` | Web App Manifest (PWA) gerado pelo Next |

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `app/layout.tsx` | Adicionado `metadata` (title/description/manifest/openGraph/robots) e `themeColor` |
| `app/page.tsx` | Logo da marca no lugar do ícone Lucide + texto "FisioSystem" |
| `app/(auth)/login/page.tsx` | Logo no cabeçalho do card de login |
| `components/sidebar-nav.tsx` | Ícone da marca + `BRAND_NAME`; removido ícone `Activity` |
| `components/app-shell.tsx` | Header mobile usa `BRAND_NAME` |
| `lib/navigation.ts` | Removido re-export não utilizado de `Activity` |
| `lib/clinic-settings.ts` | Defaults `clinicName`/`therapistName` vindos de `lib/brand.ts` |
| `lib/patient-pdf.ts` | Fallback de marca do cabeçalho do PDF → `BRAND_NAME` |
| `components/pacientes/patient-prontuario-toolbar.tsx` | Fallback de `clinicTitle` → `BRAND_NAME` |
| `README.md` | Título e descrição do estado atual atualizados |

## Verificação

- `npm run lint` e `npm run build` sem erros relacionados às mudanças.

## Análise (escalabilidade e manutenibilidade)

Centralizar a marca em `lib/brand.ts` elimina duplicação e torna qualquer ajuste futuro de nome,
slogan ou assets uma alteração de um único ponto, reduzindo risco de divergência entre telas.
O uso das convenções nativas do Next (`app/icon.svg`, `app/manifest.ts`, `metadata`) mantém o
projeto alinhado ao framework, facilita o cache de assets e prepara o caminho para PWA sem libs extras.

## Próximos passos sugeridos (do roadmap, ainda pendentes)

- Landing page completa (`kineto-prompts-avancados.md` §5).
- Responsividade mobile/tablet refinada (§4).
- Conformidade LGPD: migrations V9–V13 (consentimento, auditoria, imutabilidade).
- PDF profissional com Puppeteer no backend.
- Checklist de produção e deploy (Vercel + Railway) + domínio.
