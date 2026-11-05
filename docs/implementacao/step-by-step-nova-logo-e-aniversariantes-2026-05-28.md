# Step-by-step — Nova logo (paleta do sistema) + Aniversariantes da semana

Data: 2026-05-28
Autor: Engenharia (sessão Cursor)

## Objetivo

1. Substituir a logo (antes em azul `#0A7EA4`, fora da identidade) por uma versão
   alinhada à paleta real do sistema definida em `app/globals.css`.
2. Implementar a regra de negócio "Aniversariantes da semana" (kineto §6, Regra 5)
   no dashboard, sem novos endpoints nem migrations.

## Paleta de referência (origem: `app/globals.css`)

- Olivine (primária): `#6C7D61`
- Feldgrau (texto): `#445552`
- Burnt Sienna (acento): `#D7816A`
- Periwinkle: `#BEB7DF`
- Field Drab: `#585123`
- Primária no dark: `#8A9B7F`

## Arquivos criados/alterados

### Logo

- `public/brand/js-icon.svg` (reescrito): monograma "JS" branco sobre gradiente
  olivine, com traço de pulso (saúde/fisio) em Burnt Sienna. ASCII puro.
- `app/icon.svg` (reescrito): mesmo ícone, usado como favicon.
- `public/brand/js-logo.svg` (reescrito): ícone embutido (`<svg>` aninhado com
  `viewBox`) + wordmark "JS Fisioterapia" (JS em olivine, "Fisioterapia" em
  feldgrau) + tagline "Julli Severina &#183; CREFITO".
- `public/brand/js-logo-dark.svg` (reescrito): variante para fundo escuro
  (olivine claro + texto claro), fundo transparente.
- `app/layout.tsx`: `themeColor` `#0A7EA4` -> `#6C7D61`.
- `app/manifest.ts`: `theme_color` -> `#6C7D61`, `background_color` -> `#F7F6FB`.

Decisões:

- ASCII puro (entidade `&#183;` no lugar do caractere `·`) para evitar o bug de
  encoding que quebrou as SVGs anteriormente.
- Ícone embutido via `<svg>` aninhado com `viewBox` para escalar sem recalcular
  coordenadas manualmente (DRY).

### Aniversariantes da semana

- `lib/birthdays.ts` (novo): função pura `getUpcomingBirthdays(patients, reference, windowDays)`
  e helper `birthdayWhenLabel(daysUntil)`. Compara apenas dia/mês (ignora o ano),
  calcula `daysUntil` e `turningAge`. Sem dependências de framework — testável.
- `app/(app)/dashboard/page.tsx`: novo `useMemo` `birthdays` e um `Card`
  "Aniversariantes da semana" listando nome (link para o prontuário), dd/mm,
  idade a completar e um selo "Hoje/Amanhã/Em N dias".

Decisão de arquitetura: o dashboard já carrega toda a lista de pacientes
(`/v1/metrics/dashboard`), então os aniversariantes são derivados no cliente, sem
novo endpoint, migration ou alteração de contrato — a opção mais simples e DRY.

## Verificação

- `ReadLints` nos arquivos alterados: sem erros.
- Checagem de bytes: as 4 SVGs estão em ASCII puro (0 bytes > 127).
- Dev server (`npm run dev`): `/dashboard` retorna 200 após as mudanças.

## Pendências do roadmap (não incluídas — exigem decisão/infra)

Itens grandes que recomendo tratar em blocos aprovados separadamente:

- PDF profissional server-side (Puppeteer) — decisão de infra (serverless/Docker)
  e migration V13 para `signature_image`.
- LGPD: consentimento, trilha de auditoria, imutabilidade de evoluções com hash,
  direitos do titular — várias migrations e mudanças de fluxo/UX.
- Regras de negócio 2/3/4/6/7 (sessões planejadas, taxa de comparecimento/NO_SHOW,
  bloqueio recorrente, relatório de alta, tempo médio) — exigem migrations e
  mudanças de enum.
- Upload de logo da clínica (S3) e assinatura em canvas.

Observação: o "Relatório financeiro" (Regra 1) já está coberto pelo dashboard
atual (recebido/pendente/concluído por dia/semana/mês).
