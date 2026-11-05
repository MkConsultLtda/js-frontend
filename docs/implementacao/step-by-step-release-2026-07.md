# Step-by-step — Release JS Fisioterapia (2026-07)

## Fase 0 — Produção
- `docs/operacao/auditoria-producao-2026-07-02.md`
- `docs/operacao/deploy-producao-checklist-release-2026-07.md`

## Backend (`msorquestrador-jf`)
| Arquivo | Função |
|---------|--------|
| `V16__appointment_series_id.sql` | `series_id` em appointments |
| `V17__holidays.sql` | Tabela `clinic_holiday` |
| `V18__finance.sql` | Categorias e transações financeiras |
| `HolidayController` + `HolidayService` | `GET /v1/holidays` |
| `FinanceController` + `FinanceService` | CRUD financeiro + inadimplência |
| `AgendaService.createRecurringSessions` | `POST /v1/appointments/recurring-sessions` |
| `PatientController` | Sort padrão `name,asc` |

## Frontend (`js-frontend`)
| Área | Arquivos principais |
|------|---------------------|
| Dashboard | `components/dashboard/*`, `lib/dashboard-metrics.ts` |
| Financeiro | `app/(app)/financeiro/page.tsx`, `components/finance/*` |
| Agenda | `useHolidays`, `recurring-session-dialog.tsx`, legenda feriados |
| Evolução | Removido campo plano (UI/PDF) |
| Design | `app/layout.tsx` (Plus Jakarta Sans), logos em `public/brand/` |
| Pacientes | `sort=name,asc` em `fetchPatientPage` |

## Deploy
1. Backend → `main` → Railway
2. Validar `/v1/metrics/dashboard`, `/v1/holidays`, `/v1/finance/summary`
3. Frontend → `main` → Vercel
4. Smoke test conforme checklist

## Roadmap pós-MVP
- Lembretes WhatsApp
- Evoluções pendentes no dashboard
- Export CSV financeiro
- Arrastar para remarcar na agenda
