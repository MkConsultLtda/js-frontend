# Infraestrutura, *free tier*, CI/CD e base de dados

Guia operacional para preparar **produção** antes de expor o backend: serviços gratuitos (lista [free-for-dev](https://github.com/ripienaar/free-for-dev) e *forks* como [jixserver/free-for-dev](https://github.com/jixserver/free-for-dev)), GitHub, base de dados e ordem de execução.

> Preços e limites mudam: confirma sempre no site oficial.

---

## 1. Ordem recomendada (antes do primeiro *deploy*)

1. **Repositórios GitHub** — `js-frontend` e `msorquestrador-jf` com `main` protegida (ver §4).
2. **Domínio** (opcional no início) — registo DNS; Vercel/Cloudflare gerem subdomínios grátis até teres domínio próprio.
3. **Base de dados PostgreSQL gerida** — criar instância (ex. **Neon**, **Supabase**, **Render Postgres**, **ElephantSQL** em *free tier* muito pequeno). Anotar **connection string** com `sslmode=require` se o fornecedor exigir.
4. **Object storage (anexos)** — ex. **Cloudflare R2** (S3 compatível) ou *bucket* no mesmo PaaS se existir.
5. **API Java** — **Render** (*Free*), **Fly.io** (*free allowance*), ou JAR noutro PaaS; variáveis de ambiente a partir de `msorquestrador-jf/env.example` e perfil `prod`.
6. **Frontend Next** — **Vercel** (*Hobby*): liga o repo, *Preview* em cada PR, *Production* em `main`.
7. **CORS** — `CORS_ALLOWED_ORIGIN` = URL *exata* do front (HTTPS, sem *slash* final).

---

## 2. O que aproveitar das listas *free-for-dev* (categorias úteis)

| Necessidade | Exemplos com *free tier* (validar no site) |
|-------------|---------------------------------------------|
| Front *jamstack* | Vercel, Netlify, Cloudflare Pages |
| API / *containers* | Render, Fly.io, Google Cloud Run (*tier*), Oracle OCI *Always Free* (VPS) |
| **PostgreSQL gerido** | **Neon**, **Supabase** (Postgres + extras), Aiven, ElephantSQL (capacidade muito baixa) |
| Ficheiros S3-like | **Cloudflare R2**, Backblaze B2, AWS S3 (crédito / *free tier* limitado) |
| CI/CD | **GitHub Actions** (minutos: público > privado) |
| Registo de contentores | **GitHub Container Registry** (`ghcr.io`) — uso razoável grátis |
| *Secrets* / env | Variáveis encriptadas no Render/Vercel/GitHub *Secrets* |

Não precisas de *encaixar* tudo: combina **Vercel + Render/Fly + Neon + R2** é a abordagem mínima alinhada a `deploy-producao-custo-zero.md`.

---

## 3. Base de dados: **não** é obrigatório outro repositório só para SQL

- O **esquema versionado** já vive no backend: `msorquestrador-jf/src/main/resources/db/migration/` (**Flyway**).
- Em **produção**, a app com `SPRING_PROFILES_ACTIVE=prod` liga ao Postgres e o **Flyway aplica migrações** no arranque (já está configurado).
- **Repositório separado só para BD** só faz sentido se quiseres, por exemplo:
  - *Infrastructure as code* (Terraform) noutro repo, ou
  - processos *DBA* que só aprovam SQL puro, ou
  - ferramentas como **Sqitch** / **liquibase** separados (redundante aqui com Flyway).

**Ferramentas** para *hosted* Postgres (criar instância, *dashboard*, backups): **Neon** e **Supabase** são as mais comuns em *free tier* para projetos pequenos; a “subida do banco” é: criar project → copiar *connection string* → pôr em `DATABASE_URL` / *secrets* do PaaS — **não** é *pipeline* que dispara SQL do Git a menos que configures isso de propósito (aqui o *pipeline* do código já leva o Flyway dentro do JAR).

---

## 4. GitHub: *branch rules*, CI obrigatório, revisão

| Configuração | Onde | Sugestão |
|--------------|------|----------|
| *Branch protection* | Repositório → *Settings* → *Branches* → regra em `main` | Exigir PR; exigir que os *checks* `Backend CI` / `Frontend CI` passem; opcional: 1 aprovação. |
| *Code review* “grátis” | Não há substituto *melhor* que humano; automatiza **qualidade mínima** com | CodeQL, lint no CI, Dependabot, modelo de PR (`.github/pull_request_template.md`). |
| *Bots* de comentário em PR | *Marketplace* | **CodeRabbit**, **Greptile** — têm *tiers*; rever preços. |
| Segurança extra | *Settings* → *Code security* | *Dependabot alerts*; *Secret scanning* (público/pago conforme plano). |

Ficheiros já adicionados neste monólogo de trabalho:

- `ci-frontend.yml` / `ci-backend.yml` — *lint*, *test*, *build* / `mvn verify` em **todos** os PRs.
- `dependabot.yml` — actualização de `npm` / `maven` / *Actions*.
- `codeql.yml` — análise estática (público: geralmente **gratuito**; *private*: ver *minutes*).

*Branch protection* não se versiona: tens de **clicar** na UI (ou *GitHub API* / *Terraform* `github_branch_protection` noutro *repo* de *infra* se um dia o usares).

---

## 5. *Code review* automática (o que o Git dá *de graça* e o que não dá)

- **Dá:** checks obrigatórios no PR (CI verde), CodeQL, Dependabot, regras de tamanho de PR, *required reviewers*.
- **Não dá** (plano *Free* puro): o mesmo que **Copilot PR Review** pago, ou *Advanced Security* empresarial.
- **Dá para acrescentar (custo 0, trabalho tua):** *workflow* com **ESLint** / **Spotless** a falhar o job; *comments* de ferramentas como *reviewdog* (mais ficheiro YAML a manter).

Recomendação: **CI rígido** + **CodeQL** + **modelo de PR** + *review* humano no `main`.

---

## 6. Checklist rápido pós-criação de *providers*

- [ ] Postgres: *connection string* de produção em *secret* do PaaS da API (não no repositório).
- [ ] API: `SPRING_PROFILES_ACTIVE=prod`, `JWT_SECRET` forte, `CORS` = URL do Vercel.
- [ ] Front: `NEXT_PUBLIC_…` e `BACKEND_…` apontam para a API pública (HTTPS).
- [ ] *Storage* R2/S3: *bucket* criado; *keys* só em *secret*.
- [ ] Primeiro *deploy* da API com BD vazio: **Flyway** aplica `V1`… sozinho; *seed* de utilizador de dev **não** corre em `prod` — prever criação de *admin* (tarefa em `msorquestrador-jf/TODO.md`).

---

## 7. Referência cruzada

| Documento | Tema |
|-----------|------|
| [deploy-producao-custo-zero.md](deploy-producao-custo-zero.md) | Vercel, Render, Neon, R2, fluxo Git |
| [banco-dados-postgresql.md](banco-dados-postgresql.md) | Flyway, *backup* |
| [variaveis-ambiente-local-producao.md](variaveis-ambiente-local-producao.md) | Tabela LOCAL / PROD |
| `msorquestrador-jf/TODO.md` | Decisões e *go-live* do backend |
