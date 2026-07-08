# Auditoria produção vs local — 2026-07-02

## Resumo executivo

O código local está **muito à frente** da branch `main` em ambos os repositórios. O dashboard em produção provavelmente falha porque o frontend deployado não possui (ou o backend não expõe) os endpoints agregados introduzidos nas branches de feature.

| Repositório | Branch local | Commits à frente de `main` |
|-------------|--------------|---------------------------|
| `js-frontend` | `cursor/jf-prompt-init-bd216` | ~114 |
| `msorquestrador-jf` | `feature/ajuste-prod` | ~61 |

## Checklist de verificação nos painéis

### Vercel (frontend)

- [ ] Projeto vinculado ao repositório `MkConsultLtda/js-frontend`
- [ ] Branch de produção: confirmar se é `main` ou outra
- [ ] Variáveis obrigatórias:
  - `BACKEND_API_URL` = `https://<domínio-railway>/v1`
  - `NEXT_PUBLIC_APP_URL` = URL pública do site
- [ ] Último deploy: status, logs de build
- [ ] Smoke: `GET /api/auth/me` após login retorna 200

### Railway (backend)

- [ ] Serviço `msorquestrador-jf` com deploy da branch correta
- [ ] `CORS_ALLOWED_ORIGIN` = URL exata do frontend (sem path)
- [ ] `JWT_SECRET` definido (≥ 32 bytes)
- [ ] Health: `GET /v1/health` → 200
- [ ] Endpoints críticos pós-deploy:
  - `GET /v1/metrics/dashboard?from=2026-01-01&to=2026-12-31`
  - `GET /v1/reports/financial?from=...&to=...&sessionPrice=...`
  - `GET /v1/clinic/settings`

## Causas prováveis do dashboard quebrado

1. **Backend desatualizado** — sem `DashboardMetricsController`; frontend cai no fallback N+1 (centenas de requests).
2. **`BACKEND_API_URL` incorreta** no Vercel.
3. **CORS** bloqueando chamadas do browser ao proxy.
4. **Bugs no código** (corrigidos nesta release): filtro `registeredAt` BR vs ISO, sem loading state, `no_show` como cancelado.

## Ordem de deploy recomendada

1. Merge e deploy **backend** (`feature/ajuste-prod` → `main`).
2. Validar endpoints acima com token de produção.
3. Merge e deploy **frontend** (branch de feature → `main`).
4. Smoke test: login → dashboard → agenda → pacientes.

Ver também: [deploy-producao-checklist-release-2026-07.md](./deploy-producao-checklist-release-2026-07.md).
