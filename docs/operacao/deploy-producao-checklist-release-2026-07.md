# Checklist deploy — Release 2026-07

## Pré-requisitos

- [ ] Testes locais: `npm run build` (front) e `./mvnw test` (back)
- [ ] Migrations Flyway aplicadas no banco de produção

## Backend (primeiro)

```bash
cd msorquestrador-jf
git checkout main
git merge feature/ajuste-prod
git push origin main
```

- [ ] Railway redeploy automático concluído
- [ ] `GET /v1/health` OK
- [ ] `GET /v1/metrics/dashboard` retorna JSON com patients/appointments/evolucoes
- [ ] `GET /v1/holidays?year=2026` retorna feriados
- [ ] `GET /v1/finance/summary` retorna resumo

## Frontend (segundo)

```bash
cd js-frontend
git checkout main
git merge cursor/jf-prompt-init-bd216
git push origin main
```

- [ ] Vercel build verde
- [ ] Login funcional
- [ ] Dashboard carrega sem banner vermelho
- [ ] Agenda exibe feriados
- [ ] `/financeiro` acessível

## Smoke test pós-deploy

| Passo | Esperado |
|-------|----------|
| Login | Redireciona para `/dashboard` |
| Dashboard | Cards com dados reais (não zeros permanentes) |
| Pacientes | Lista ordenada A→Z |
| Agenda | Criar sessão unitária e pacote |
| Evolução | Sem campo "Plano para próxima sessão" |
| Financeiro | Lançamento manual + saldo |

## Rollback

- Vercel: Promote deployment anterior
- Railway: Redeploy commit anterior
- DB: migrations são forward-only; testar em staging antes
