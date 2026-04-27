# Variáveis de ambiente — LOCAL e PRODUÇÃO

> **Não** commite ficheiros `.env` reais. Use `env.example` (raiz de cada repo) e *secrets* no Vercel / PaaS / GitHub *Actions*.

## Convenção

| Sufixo / contexto | Uso |
|-------------------|-----|
| `LOCAL` | Máquina de desenvolvimento: Docker Compose, `localhost`. |
| `PRODUÇÃO` | *Deploy* com HTTPS, domínios reais, credenciais fortes. |

Valores de exemplo usam *placeholders* (`seu-dominio`, `sua_senha`); substitua.

---

## Backend — `msorquestrador-jf` (Spring Boot)

### Banco (PostgreSQL)

| Variável | LOCAL | PRODUÇÃO |
|----------|--------|----------|
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/fisio` | `jdbc:postgresql://HOST:5432/NOME_DB?sslmode=require` (ajuste ao provedor) |
| `DATABASE_USERNAME` | `fisio` | usuário criado no *managed* Postgres (ex. Neon) |
| `DATABASE_PASSWORD` | (definir no `.env` local) | *secret* forte (gerada pelo serviço) |

### Aplicação e HTTP

| Variável | LOCAL | PRODUÇÃO |
|----------|--------|----------|
| `SERVER_PORT` | `8080` | `8080` ou a porta que o PaaS injeta |
| `JWT_SECRET` | chave longa (≥ 32 bytes) de dev | **obrigatório** — gerar com `openssl rand -base64 48` |
| `JWT_ACCESS_MINUTES` | `15` | ex. `15` |
| `JWT_REFRESH_DAYS` | `7` | ex. `7` ou `30` conforme política |

### CORS

| Variável | LOCAL | PRODUÇÃO |
|----------|--------|----------|
| `CORS_ALLOWED_ORIGIN` | `http://localhost:3000` | `https://teu-frontend.vercel.app` (URL exata do *browser*) |

### S3 (anexos)

| Variável | LOCAL (MinIO no Compose) | PRODUÇÃO |
|----------|---------------------------|----------|
| `FISIO_STORAGE_TYPE` | `s3` | `s3` |
| `S3_ENDPOINT` | `http://127.0.0.1:9000` | ex. R2: `https://<accountid>.r2.cloudflarestorage.com` |
| `S3_REGION` | `us-east-1` (MinIO) | ex. `auto` ou a região exigida pelo R2 |
| `S3_BUCKET` | `fisio-attachments` | bucket criado no *storage* |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | iguais ao *root* do MinIO local | chaves *API* do *storage* (NUNCA o commit) |
| `S3_PATH_STYLE` | `true` | depender do fornecedor (R2: costuma exigir `true` / *path style*) |
| `S3_PRESIGN_SECONDS` | `300` | ex. `300`–`900` |

### Opcional (dev/seed)

| Variável | LOCAL | PRODUÇÃO |
|----------|--------|----------|
| `FISIO_DEV_ADMIN_*` | conforme *loader* de dev | **não** usar; sem seed de utilizador falso |

Ficheiro de referência: `msorquestrador-jf/env.example`.

---

## Frontend — `fisio-web` (Next.js)

> O *BFF* de autenticação (route handlers) usa `BACKEND_API_URL` / `NEXT_PUBLIC_API_BASE_URL` no **servidor** para falar com o Java. Ajuste para o *reverse proxy* público.

| Variável | LOCAL | PRODUÇÃO |
|----------|--------|----------|
| `NODE_ENV` | `development` (automático) | `production` (automático no build Vercel) |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080/v1` | `https://api.seu-dominio.com/v1` |
| `BACKEND_API_URL` (opcional) | igual a `NEXT_PUBLIC_…` se não tiveres domínio separado | idem, ou variável *server-only* com URL interna se usares *private network* |

*Cookies* HttpOnly não precisam de chave pública: são definidos pelas rotas `/app/api/auth/*` no mesmo domínio do *site*.

Ficheiro de referência: `fisio-web/env.example`.

---

## Matriz rápida “o que muda de LOCAL → PROD”

1. `DATABASE_URL` + credenciais: local Docker → *managed* Postgres (SSL).  
2. `JWT_SECRET`: inseguro/placeholder → *secret* forte, única por ambiente.  
3. `CORS_ALLOWED_ORIGIN`: `localhost:3000` → URL do front *HTTPS*.  
4. `S3_*`: MinIO local → R2 / B2 / S3.  
5. *Front* `NEXT_PUBLIC_API_BASE_URL` / `BACKEND_API_URL`: `localhost:8080` → URL pública da API.  

---

**Manutenção:** manter tabelas sincronizadas com `application.yml` e `lib/server-auth.ts` quando o contrato de env mudar.

**Escalabilidade:** *secrets* por ambiente (staging/prod) evitam vazamento; **risco a mitigar** — rotação de *refresh* e chaves S3. **Melhoria:** 1 ficheiro `env.example` por repositório + *secret scanning* no Git.
