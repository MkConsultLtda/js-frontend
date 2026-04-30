# Step-by-step — backlog em sequência (2026-04-29)

## Objetivo

Executar os cinco itens de prioridade alta do `docs/TODO.md` na ordem do backlog.

## Alterações por tema

### 1. Agenda — rolagem horizontal (mobile/tablet)

- **Arquivo:** `components/agenda/agenda-week-view.tsx`
- **Mudança:** `touch-pan-y` → `touch-pan-x touch-pan-y` na região com `overflow-x-auto`, permitindo pan horizontal em touch sem bloqueio do gesto.

### 2. Menu lateral — foto do perfil

- **Arquivo:** `components/sidebar-nav.tsx`
- **Mudança:** Leitura de `photoDataUrl` via `useUserProfile()`; exibição com `next/image` (`unoptimized` para data URL); fallback com iniciais de `therapistName`.

### 3. Paciente — diagnóstico clínico opcional

- **Front:** `lib/schemas/patient-form.ts`, `components/pacientes/patient-form-fields.tsx`
- **Back:** `PatientCreateRequest.java` — `diagnosis` com `@Size(max = 500)` e normalização para string vazia quando em branco.

### 4. Excluir bloqueio/evento pela UI

- **Arquivos:** `app/(app)/agenda/page.tsx`, `components/agenda/agenda-appointment-list.tsx`
- **Mudança:** Botão **Excluir da agenda** nos dois formulários do modal de edição; texto de ajuda na lista do dia para bloqueios na grade.

### 5. Conflito de horário — gravar mesmo assim

- **Back:** `AgendaService#create/replace` com flag `allowOverlap`; `AppointmentController` com `@RequestParam allowOverlap`.
- **Front:** `apiCreateAppointment` / `apiReplaceAppointment` com query opcional; `useAgendaMutations` recebe `{ body, allowOverlap? }`; fluxo `onContinue(allowOverlap)` após confirmação no diálogo.

## Verificação

- `npm run lint` (js-frontend)
- `mvn compile -DskipTests` (msorquestrador-jf)

## Decisões

- Sobreposição só após confirmação explícita no cliente e com `allowOverlap=true` na API (evita bypass silencioso).
- Duplo bloqueio: checagem no front (UX) + no back (segurança), com escape documentado por parâmetro.
