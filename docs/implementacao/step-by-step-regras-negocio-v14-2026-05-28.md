# Regras de negócio (V14) — alta, sessões, no-show, bloqueio recorrente

**Data:** 2026-05-28  
**Escopo:** Regras 2, 3, 4, 6 e 7 do roadmap (LGPD deixada para o final).

## Backend (`msorquestrador-jf`)

### Migration V14
- `total_sessions_planned`, `discharged_at`, `discharge_summary` em `patient`
- Enum `AgendaStatus`: valor `no_show`
- Enum `PatientStatus`: valor `discharged`

### API
| Método | Rota | Função |
|--------|------|--------|
| POST | `/v1/patients/{id}/discharge` | Alta com resumo opcional |
| POST | `/v1/appointments/recurring-block` | Bloqueios semanais entre duas datas |

**Reiniciar o backend** após deploy para aplicar a V14.

## Frontend (`js-frontend`)

### Tipos e mapeamento
- `PatientStatus`: `discharged`
- `SessionStatus`: `no_show`
- Campos do paciente: `totalSessionsPlanned`, `dischargedAt`, `dischargeSummary`

### UI
- **Prontuário** (`/pacientes/[id]`): card de tratamento, progresso, comparecimento, alta
- **Agenda**: status Falta, legenda laranja, diálogo “Bloqueio recorrente”
- **Dashboard**: tempo médio de sessão no mês (sessões concluídas)
- **PDF**: `GET /api/pdf/alta/[pacienteId]` (após alta registrada)

### Utilitários
- `lib/patient-treatment.ts` — progresso, taxa de comparecimento, duração média
- `lib/patient-labels.ts`, `lib/session-status.ts`

## Próximo passo (fora deste pacote)
- LGPD (consentimento, audit log, imutabilidade de evoluções)
- Refinos de responsividade mobile na agenda
