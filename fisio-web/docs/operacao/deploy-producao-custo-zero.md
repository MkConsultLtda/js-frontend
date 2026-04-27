# Deploy em produção (custo baixo / gratuito)

Objetivo: subir **API Java**, **Next.js** e **PostgreSQL** com o mínimo de custo, usando *free tiers* conhecidos e **GitHub Actions** para CI (build e *release*).

> Nada aqui é patrocinado: são opções comuns; valida preços e limites no site oficial antes de *commit*.

## Arquitetura sugerida (mínima)

| Camada | Serviço (exemplo *free* / barato) | Papel |
|--------|-----------------------------------|--------|
| Front | **Vercel** (Hobby) | *Next.js*, HTTPS, *preview* por PR |
| API | **Render** (*Free* web service) ou **Fly.io** (free allowance) | JAR *fat* ou Docker; *health check* |
| DB | **Neon** (serverless Postgres *free* tier) | PostgreSQL gerido, SSL, *branches* para dev |
| *Storage* (anexos) | **Cloudflare R2** (free tier) | S3 API compatível; paga só egress em alguns planos; revisar tabela de preços |
| Código + CI | **GitHub** | *Actions* gratuito para repositórios (minutos *free*; público tem mais) |

*Alternativa única* (ainda **barata**): um **VPS** (Oracle Cloud *Always Free* ARM, ou *LowEndBox*) e **Docker Compose** (Postgres + app + Caddy) — operação tua, custo muito baixo, mais trabalho de manutenção. Documentado como opção B no fim.

---

## Fluxo de trabalho recomendado (Git)

1. `main` = *production*.  
2. *Pull request* com *preview* no Vercel (já conecta ao repositório).  
3. *Merge* após *review*; *Action* (opcional) a construir a API e a publicar a imagem ou a fazer *deploy*.

---

## GitHub Actions (CI) — o que fazer

### Objetivo da *Action*

- **Build** a cada *push* ou *tag* `v*`: compilar `msorquestrador-jf` com Java 17.
- (Opcional) *Docker* `build` + *push* para `ghcr.io` (*GitHub Container Registry*) — *free* para uso razoável.

### *Secrets* a configurar (no repositório → *Settings* → *Secrets*)

- `NEON_DATABASE_URL` ou *connection string* (se a *Action* a migrar: evitar; *migração* geralmente no *startup* da aplicação com *Flyway*).  
- Para *deploy* automático no **Render**/**Fly**: *API key* do serviço em *secret*.

### Exemplo mínimo: só build (sem *deploy*)

Criar `msorquestrador-jf/.github/workflows/ci-backend.yml` (caminho ilustrativo):

```yaml
name: Backend CI
on: [ push, pull_request ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "17"
      - name: Test + package
        run: ./mvnw -B verify
```

*Deploy* podes trigar manualmente (botão *workflow_dispatch*) ou *tag* v1.0.0, chamando a API de *deploy* do Render (webhook) ou *fly deploy* (requer *token* em *secret*).

> **Dica (barato):** começar com **só** build e *release*; *CD* (deploy automático) quando a stack estiver estável.

### Front: `next build` na Action (opcional)

- O **Vercel** já compila a cada *push*; duplicar em *Action* só se precisas de *gate* antes de *merge* (ex. `next build` no CI com as mesmas envs que produção, sem segredos de prod).

---

## Hospedagem *free tier* (passos resumidos)

### A) Vercel (fisio-web)

1. Conta *vercel.com*, importar repo `js-frontend` (pasta *root* ou `fisio-web` como *monorepo root* se aplicável).  
2. *Environment variables*: colocar as de **PRODUÇÃO** (ver `variaveis-ambiente-local-producao.md`).  
3. *Production branch* = `main`. *Preview* = todos os PRs.

### B) API: Render (exemplo *Free*)

1. Criar **Web Service**; *Runtime* = Docker (se tiveres `Dockerfile`) ou *Native Java* (comando `java -jar` após *build*).  
2. *Environment*: copiar tabela do back (Postgres, JWT, S3, CORS).  
3. *Free* pode “dormir” (cold start ~30s–1min) — aceitável em MVP.  
4. *Health check path*: alinhar com o actuador/health (conforme README do back).

### C) PostgreSQL: Neon

1. Criar *project* → copiar *connection string* (SSL *on*).  
2. Converter para JDBC no Spring: `jdbc:postgresql://host:5432/db?sslmode=require` (o Neon dá a string JDBC nas docs; validar parâmetros).  
3. **Flyway** aplica *migrations* no arranque da aplicação — não deixar `ddl-auto=create` em produção (já está com `validate` + Flyway no projeto base).

### D) R2 (anexos) — o que fazer

1. Criar *bucket* + *API token* (leitura/escrita a objectos).  
2. Mapear `S3_*` (endpoint de R2, *region* = `auto` se a doc indicar, *path style* conforme *adapter*).  
3. CORS do *bucket* **não** é o CORS do Spring: o *browser* acessa a *presigned URL*; testar download no front.

---

## Resumo: LOCAL vs PROD

| Aspeto | LOCAL | PROD |
|--------|------|------|
| Front | `next dev` `localhost:3000` | Vercel, HTTPS |
| API | JAR/Compose `localhost:8080` | Render / Fly, HTTPS |
| DB | Docker Postgres ou Neon *dev* branch | Neon (ou *managed* equivalente) |
| Armazenamento | MinIO local | R2 (ou S3) |

---

## Opção B: VPS com Docker (o mais “barato” a longo prazo)

- **1 VM** (Oracle *Always Free* ou t3.nano barato) + `docker compose` com: `postgres` + `minio` (ou *sem* minio, só R2).  
- *Reverse proxy* Caddy/Traefik com *Let’s Encrypt*.  
- *Backup*: `pg_dump` *cron* + ficheiro para *object storage* (R2) ou S3.  
- **CI** igual: GitHub Actions só builda; o *deploy* podes fazer *SSH* + *docker compose pull* (script simples) ou *watchtower* (com cuidado).

**Escalabilidade desta doc:** trocar o PaaS mantém a mesma app (JAR, envs, Flyway, R2). **Melhoria:** *staging* com a mesma stack; *feature flags* para o front.

**Risco:** *free tiers* mudam limites; *cold starts* no Render *Free*; **mitigar** com *hobby* pago mínimo no API quando tiveres utilizadores reais.
