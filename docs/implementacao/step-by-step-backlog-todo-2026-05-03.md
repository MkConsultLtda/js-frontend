# Step-by-step — Backlog `docs/TODO.md` (2026-05-03)

## Objetivo

Executar em sequência os itens que estavam no **Backlog** do `docs/TODO.md` (exclusão agenda, exclusões gerais, bloqueio multi-dia, evolução na agenda, tipo sessão, última sessão, ortografia, PDF).

## Alterações principais

### Frontend (`js-frontend`)

| Área | Arquivos | Função |
|------|----------|--------|
| Mutations / cache | `lib/api/hooks/use-fisio.ts` | `scheduleInvalidate` evita que `invalidateQueries` rejeitado após sucesso da API quebre `mutateAsync`. |
| Confirmação | `components/confirm-dialog.tsx` | Aguarda `onConfirm` assíncrono; botão “Aguarde…”; não fecha em erro se o pai relançar o erro. |
| Agenda | `app/(app)/agenda/page.tsx` | Validação quando `buildExtraDates` retorna vazio; conflito `await action()`. |
| Bloqueio UX | `components/agenda/calendar-extra-form-fields.tsx`, `lib/date-utils.ts` | Atalho Seg–sex + `fridayOfSameWorkWeek`. |
| Lista agenda | `components/agenda/agenda-appointment-list.tsx` | Link para `/evolucao?pacienteId=&dataSessao=`. |
| Evolução | `app/(app)/evolucao/page.tsx`, `lib/schemas/evolucao-form.ts`, `lib/api/fisio-api.ts` | Remove tipo sessão; delete + confirmação; prefill a partir da query. |
| Anamnese | `app/(app)/anamnese/page.tsx` | Delete + confirmação; `spellCheck` no rich text. |
| Rich text | `components/ui/rich-text-editor.tsx` | Prop `spellCheck` → `spellcheck` no ProseMirror. |
| PDF | `lib/patient-pdf.ts`, `components/pacientes/patient-prontuario-toolbar.tsx` | `PdfBranding`, logo, página de assinatura. |
| Pacientes / agenda | `app/(app)/pacientes/page.tsx` | `throw` após toast de erro na exclusão. |

### Backend (`msorquestrador-jf`)

| Arquivo | Função |
|---------|--------|
| `EvolucaoService.java` | Atualiza `last_session` do paciente; marca sessões da agenda na mesma data como `completed` ao salvar evolução; depende de `AgendaRepositoryPort`. |
| `EvolutionJpaRepository.java` | `findMaxDataSessaoByPatient` para derivar última sessão. |
| `EvolucaoRequest.java` | `tipoSessao` opcional (legado). |

## Decisões

- **Exclusão “deu erro mas sumiu”:** causa provável era `invalidateQueries` (refetch) rejeitar após HTTP 204 bem-sucedido; invalidação passou a ser agendada com `.catch(() => undefined)`.
- **Concluir atendimento:** centralizado no backend ao persistir evolução, alinhado à regra de negócio já existente no domínio da agenda.
- **PDF:** assinatura como bloco textual + linha (sem upload de imagem de assinatura separado); logo usa `photoDataUrl` do perfil quando existir.

## Verificação

- `mvn compile` (backend).
- `npx tsc --noEmit` e `npx eslint` em arquivos alterados críticos (frontend).
