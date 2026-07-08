# Step-by-step — PDF profissional server-side (Puppeteer) + assinatura no perfil

Data: 2026-05-28
Autor: Engenharia (sessão Cursor)

## Objetivo

Gerar o prontuário fisioterapêutico em PDF no servidor (Puppeteer), no padrão
COFFITO 414/2012, com cabeçalho, seções estruturadas, quadro de autenticidade
(hash SHA-256) e assinatura visual do profissional capturada no perfil.

## Backend (msorquestrador-jf)

Cadeia de `signature_image` (assinatura base64) em `app_user`:

- `db/migration/V13__app_user_signature_image.sql` (novo): coluna `signature_image TEXT NOT NULL DEFAULT ''`.
- `AppUserEntity`: campo `signatureImage`.
- `domain/therapist/TherapistAccount` e `TherapistProfileCommand`: novo campo.
- `dto/auth/MeResponse` e `ProfilePatchRequest`: expõem `signatureImage` (camelCase), com `@Size(max = 600_000)`.
- `AuthService.updateProfile`: trim/normalização do campo.
- `TherapistAccountRepositoryAdapter`: get/set no `updateProfile` e `toDomain`.
- Teste `AuthServiceUpdateProfileTest`: assert do round-trip da assinatura.

Migration aplicada em runtime (Flyway v12 → v13) e teste unitário verde.

## Frontend (js-frontend)

### Assinatura no perfil

- `lib/auth-me-api.ts`: `signatureImage` em `AuthMeResponse` e `AuthProfilePatchBody`.
- `app/api/auth/profile/route.ts`: `signatureImage` no schema Zod do BFF.
- `lib/schemas/user-profile-form.ts`: campo `signatureImageDataUrl`.
- `components/perfil/signature-pad.tsx` (novo): captura em canvas com pointer
  events (mouse e toque), botão "Limpar", sem dependências externas.
- `app/(app)/perfil/page.tsx`: novo card "Assinatura (documentos PDF)" com o
  `SignaturePad`, carregando/gravando via o fluxo existente de perfil.

### PDF server-side

- `package.json`: `puppeteer-core` + `@sparticuz/chromium`.
- `next.config.ts`: `serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"]`.
- `lib/pdf/browser.ts` (novo): `launchPdfBrowser()` e `renderHtmlToPdf()`.
  - Produção/serverless (Vercel): `@sparticuz/chromium`.
  - Dev: autodetecta Chrome/Edge local (Windows/macOS/Linux) ou
    `PUPPETEER_EXECUTABLE_PATH`. Rodapé com paginação via `footerTemplate`.
- `lib/pdf/prontuario-html.ts` (novo): `buildProntuarioHtml(data)` monta o HTML
  (COFFITO 414) com escape de todo texto dinâmico (seguro contra injeção no
  Chromium), paleta do sistema, seções 1–4 e quadro de autenticidade
  (assinatura + nome + CREFITO + data + hash SHA-256 + versão).
- `app/api/pdf/prontuario/[pacienteId]/route.ts` (novo): runtime nodejs,
  `maxDuration = 60`. Autentica via `resolveAccessTokenForBackendProxy()`, busca
  em paralelo `auth/me` + paciente + anamneses + evoluções + agenda no Spring,
  **reutiliza os mappers** de `fisio-api.ts` (sem duplicar lógica), calcula o
  hash SHA-256 do conteúdo e devolve `application/pdf` (attachment).
- `components/pacientes/patient-prontuario-toolbar.tsx`: novo botão
  "Prontuário profissional (COFFITO 414)" que abre a rota; o PDF jsPDF anterior
  vira "Prontuário simples (rápido)".

## Decisões

- **Reuso dos mappers** raw→domínio (`mapPatientFromApi`, etc.): evita divergência
  de contrato entre o PDF e o resto do app (DRY).
- **Texto escapado** no template (em vez de injetar HTML rico do TipTap): elimina
  risco de execução de scripts dentro do Chromium durante a renderização.
- **Browser por ambiente**: chromium serverless no Vercel; navegador local em dev.
  No Windows desta máquina não há Chrome — o Edge (Chromium) é detectado e usado.

## Verificação

- Lint (ReadLints) e `tsc --noEmit`: sem erros.
- Backend: `test-compile` ok; migration v12 → v13 aplicada no boot; teste
  `AuthServiceUpdateProfileTest` verde.
- Puppeteer: smoke isolado gerou PDF (~31 KB) via Edge.
- Rota: `GET /api/pdf/prontuario/1` sem sessão → `401` (módulos carregam sem
  crash; guard de auth ativo).

## Notas de produção (Vercel)

- A função do PDF roda em Node.js runtime. Em produção usa `@sparticuz/chromium`.
- Confirmar `maxDuration` compatível com o plano e o tamanho do bundle do
  chromium dentro dos limites da função.
- Opcional: definir `PUPPETEER_EXECUTABLE_PATH` em ambientes onde já exista um
  Chromium.
