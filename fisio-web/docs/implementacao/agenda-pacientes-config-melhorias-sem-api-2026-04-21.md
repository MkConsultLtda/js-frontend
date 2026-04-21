# Step-by-step - melhorias de agenda, pacientes e configurações (sem API)

## Objetivo

Aplicar melhorias funcionais e visuais sem dependência de backend:

- Agenda com melhor UX visual, tipografia e paleta mais harmoniosa.
- Cadastro de pacientes com novos campos clínico-administrativos.
- Configuração dinâmica de tipos e durações de atendimento para reutilizar na marcação.

## Etapas executadas

1. Remoção do item de feriado na legenda da agenda.
2. Ajustes de UX visual na agenda:
   - melhoria de contraste e hierarquia visual nos cards de resumo;
   - faixa de horário com início/fim na lista diária;
   - uso de `tabular-nums` para horários.
3. Atualização da paleta da agenda com tons mais vivos e harmonizados.
4. Inclusão de novos campos em paciente:
   - telefone do responsável;
   - profissão;
   - escolaridade;
   - indicação (origem).
5. Inclusão de gráfico de indicação na tela de pacientes.
6. Inclusão das novas informações no prontuário do paciente.
7. Configuração dinâmica de agenda:
   - tipos de atendimento editáveis;
   - durações editáveis;
   - persistência dessas preferências nas configurações locais.
8. Integração das opções configuradas no formulário de agendamento.
9. Ajustes de lint relacionados (hooks e inicialização de settings).

## Arquivos modificados

- `components/agenda/agenda-color-legend.tsx`
- `components/agenda/agenda-appointment-list.tsx`
- `components/agenda/agenda-month-view.tsx`
- `components/agenda/agenda-week-view.tsx`
- `components/agenda/appointment-form-fields.tsx`
- `app/(app)/agenda/page.tsx`
- `app/(app)/configuracoes/page.tsx`
- `app/(app)/pacientes/page.tsx`
- `app/(app)/pacientes/[id]/page.tsx`
- `components/pacientes/patient-form-fields.tsx`
- `lib/constants.ts`
- `lib/clinic-settings.ts`
- `lib/schemas/appointment-form.ts`
- `lib/schemas/patient-form.ts`
- `lib/patient-form-map.ts`
- `lib/patient-utils.ts`
- `lib/mock-seed.ts`
- `lib/types.ts`

## Decisões arquiteturais

- Mantida estratégia sem API e sem novas bibliotecas para preservar simplicidade do protótipo.
- Configurações de agenda (tipos/durações) ficaram centralizadas em `clinic-settings`, evitando hardcode em formulários.
- Os novos campos de paciente foram adicionados ao contrato de domínio (`types`), schema, mapeamento e UI para manter consistência ponta a ponta.
- O gráfico de indicação foi implementado em HTML/CSS leve para não aumentar dependências.
