# Refinos regras 1–3 (financeiro e alertas)

**Data:** 2026-05-28

## Backend

- `GET /v1/reports/financial?from=&to=&sessionPrice=`
- `FinancialReportService` — conta sessões cobráveis, pagas, pendentes, receita e `defaultRate` (inadimplência %).

## Frontend

- `fetchFinancialReport` em `lib/api/fisio-api.ts`
- Dashboard: card financeiro do mês (API) + alerta de pacientes com falta > 30%
- Agenda: filtro “Só pendentes / Só pagos”, destaque laranja em pendências (lista e grade semanal)
- Pacientes: “Plano: X de Y sessões (Z%)” nos cards
- Prontuário: alertas penúltima sessão e meta atingida

## Próximo na ordem

Configurações da clínica persistidas na API (fase 2).
