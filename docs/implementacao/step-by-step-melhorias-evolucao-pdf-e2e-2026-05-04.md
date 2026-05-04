# Step-by-step — Assinatura em imagem, reversão de status e testes E2E/API (2026-05-04)

## 1. Assinatura dedicada no perfil (imagem)

- **`lib/schemas/user-profile-form.ts`**: campo `signatureDataUrl` (data URL, mesmo limite da foto).
- **`app/(app)/perfil/page.tsx`**: card “Assinatura para PDF”, upload/remover, persistência em `useUserProfile` / `localStorage` como os demais campos.

## 2. PDF com imagem de assinatura

- **`lib/patient-pdf.ts`**: `PdfBranding.signatureImageDataUrl`; página final desenha texto do responsável e, se houver, imagem (PNG/JPEG) antes da linha.
- **`components/pacientes/patient-prontuario-toolbar.tsx`**: repassa `profile.signatureDataUrl` para o branding.

## 3. Reverter `completed` na agenda ao excluir a última evolução do dia

- **`EvolucaoService.java`**: após soft delete, `revertSessionsIfNoEvolution` — se `existsEvolucaoAtiva` for falso para paciente+data, todas as sessões `completed` desse paciente nesse dia voltam para **`confirmed`**.

## 4. Testes do fluxo agenda → evolução → status (API)

- **Integração Spring (fonte de verdade):** `msorquestrador-jf/src/test/java/com/mkdev/orquestrador_jf/application/EvolucaoAgendaCompletionIT.java`
  - Cria paciente, agendamento `confirmed`, evolução → status `completed`.
  - Exclui evolução → status `confirmed`.
  - Segundo caso: duas evoluções no mesmo dia; apagar uma mantém `completed`; apagar a segunda reverte.

Comando: `mvn test -Dtest=EvolucaoAgendaCompletionIT`

- **Playwright (opcional / smoke HTTP):** `@playwright/test`, `playwright.config.ts`, `e2e/api-smoke.spec.ts`, `e2e/README.md`, script `npm run test:e2e`.
  - Com `E2E_API_URL` + `E2E_ACCESS_TOKEN`, valida `GET /v1/appointments`.
  - Sem variáveis, o teste é **skipped** (CI verde).

Instalação local dos browsers: `npx playwright install`

## Arquivos tocados (resumo)

| Projeto | Arquivos |
|---------|----------|
| Frontend | `user-profile-form.ts`, `perfil/page.tsx`, `patient-pdf.ts`, `patient-prontuario-toolbar.tsx`, `package.json`, `playwright.config.ts`, `e2e/*`, `.gitignore` |
| Backend | `EvolucaoService.java`, `EvolucaoAgendaCompletionIT.java` |
