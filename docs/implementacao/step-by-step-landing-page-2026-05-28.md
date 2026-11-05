# Step-by-step — Landing page profissional

**Data:** 28/05/2026
**Origem:** `files/kineto-prompts-avancados.md` (§5 Landing Page), adaptado à marca final
**JS Fisioterapia** (o §5 propunha o nome "Kineto", descartado pelo `INDICE-MESTRE.md`).

## Objetivo

Transformar a `/` (antes um hero simples com 3 cards) numa landing de produto: navegação,
hero com proposta de valor, seção de problemas, grade de recursos, CTA final e rodapé —
seguindo a identidade visual já aplicada.

## Decisões arquiteturais

- **Tokens semânticos, não cores hardcoded:** o tema real do app é olive/terroso
  (`--primary: #6c7d61` em `globals.css`), diferente do azul do doc de identidade. A landing
  usa classes semânticas (`bg-background`, `text-primary`, `bg-card`, `border-border`),
  garantindo consistência com o tema atual e suporte a dark mode sem reescrever a paleta.
- **Componentes isolados (< 300 linhas):** cada seção é um componente em `components/landing/`,
  facilitando manutenção e reuso (regra de organização do projeto).
- **Server Component + redirect:** `app/page.tsx` é server component; lê o cookie
  `fisio_at` e redireciona usuários autenticados para `/dashboard` (evita mostrar a landing
  a quem já tem sessão).
- **Animação sem libs:** `@keyframes fade-in-up` em `globals.css`, respeitando
  `prefers-reduced-motion` (acessibilidade).

## Arquivos criados

| Arquivo | Função |
|---------|--------|
| `components/landing/landing-nav.tsx` | Barra fixa: logo + link "Recursos" + botão "Entrar" |
| `components/landing/landing-hero.tsx` | Hero: headline, subheadline, CTAs e selos de conformidade |
| `components/landing/landing-features.tsx` | Seção de problemas + grade de 6 recursos (`#features`) |
| `components/landing/landing-cta-footer.tsx` | CTA final + rodapé com marca e conformidade |
| `docs/implementacao/step-by-step-landing-page-2026-05-28.md` | Esta documentação |

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `app/page.tsx` | Reescrito: redirect de autenticado + composição das seções |
| `app/globals.css` | `@keyframes fade-in-up` + `.animate-fade-in-up` (reduced-motion safe) |
| `app/layout.tsx` | `scroll-smooth` no `<html>` para âncora `#features` |
| `env.example` | Documentada a variável `NEXT_PUBLIC_APP_URL` (usada no metadata) |

## Verificação

- `npm run lint`: 0 erros (3 warnings pré-existentes, não relacionados).
- `npm run build`: sucesso; `/` passa a render dinâmico (ƒ) pelo check de cookie.

## Análise (escalabilidade e manutenibilidade)

Quebrar a landing em componentes por seção mantém cada arquivo pequeno e permite evoluir
seções isoladamente (ex.: adicionar depoimentos ou screenshot) sem tocar no resto. O uso de
tokens semânticos evita dívida visual: qualquer ajuste de tema reflete automaticamente na
landing. Como melhoria futura, vale adicionar um screenshot real do dashboard na seção de
prova social e páginas `/politica-de-privacidade` e `/termos-de-uso` para linkar no rodapé.

## Não incluído nesta etapa (escopo maior — sessão dedicada)

- **Responsividade profunda** (bottom sheets, agenda diária mobile, FAB, swipe): a base já é
  responsiva; o overhaul completo do §4 é um esforço separado.
- **Conformidade LGPD** (migrations V9–V13: consentimento, auditoria, imutabilidade): backend + banco.
- **PDF profissional com Puppeteer**: backend + nova dependência; o PDF atual via jsPDF continua funcional.
