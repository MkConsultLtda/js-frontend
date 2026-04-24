# Step-by-step - anexos e PDFs no prontuário

## Objetivo

Atender o backlog: anexos no prontuário do paciente e geração de relatórios em PDF (prontuário, evolução, histórico de atendimento), sem API.

## Etapas

1. Tipo `PatientAttachment` e campo `patientAttachments` no `MockState`, com ações `ADD_PATIENT_ATTACHMENT` e `DELETE_PATIENT_ATTACHMENT`.
2. Persistência: `normalizePersistedState` passa a incluir `patientAttachments` (lista vazia se ausente em dados antigos).
3. `MockDataProvider`: `addPatientAttachment` e `deletePatientAttachment`.
4. Exclusão de paciente remove anexos vinculados.
5. Dependência `jspdf` para PDFs no cliente.
6. `lib/patient-pdf.ts`: três exportações que disparam download — prontuário consolidado, só evolução, histórico de agenda.
7. `lib/html-to-plain.ts`: texto da anamnese (HTML rico) convertido para texto no PDF.
8. `lib/patient-attachment-utils.ts`: limite de tamanho (800 KB) e tipos MIME permitidos.
9. Componente `PatientProntuarioToolbar` na página `pacientes/[id]`.

## Arquivos principais

- `lib/types.ts`, `lib/mock-reducer.ts`, `lib/mock-persistence.ts`, `components/mock-data-provider.tsx`
- `lib/patient-pdf.ts`, `lib/patient-attachment-utils.ts`, `lib/html-to-plain.ts`
- `components/pacientes/patient-prontuario-toolbar.tsx`
- `app/(app)/pacientes/[id]/page.tsx`

## Ajustes de build (não funcionais desta feature)

- `app/(app)/agenda/page.tsx`: tipo explícito `CalendarEntryKind` no evento extra.
- `components/ui/rich-text-editor.tsx`: `view.dispatch` retorna `void`; handler de Tab ajustado para retornar `true` após `dispatch`.

## Decisões

- Anexos armazenados como data URL no `localStorage` (mesmo envelope do mock), com limite para evitar quota.
- PDF em fonte Helvetica (texto); acentos podem ser limitados em alguns ambientes — conteúdo crítico permanece legível.
