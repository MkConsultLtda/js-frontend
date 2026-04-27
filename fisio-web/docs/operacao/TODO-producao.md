# TODO — produção (backend + frontend)

Checklist de alterações e validações antes de considerar o ambiente **produção** pronto. Ajuste conforme o teu *stack* final (VPS vs PaaS).

## Backend (`msorquestrador-jf`)

### Segurança e configuração

- [ ] Definir `JWT_SECRET` forte (≥ 32 bytes) e nunca comitar; só em *secrets* do host / CI.
- [ ] `spring.profiles` em produção: `prod` (ou `docker` alinhado ao *deploy*), com `hibernate.ddl-auto=validate` e **Flyway** ativo.
- [ ] CORS: `CORS_ALLOWED_ORIGIN` = URL exata do front (ex. `https://fisio.vercel.app`); evitar `*` com credenciais.
- [ ] `SERVER_PORT` / health interno: expor `/actuator/health` (ou rota pública mínima) para *health check* do PaaS.
- [ ] Desligar *seed* de dev em produção (`FisioDevDataLoader` só em `dev`/`test`).
- [ ] Revisar *logs*: não logar PII, tokens, corpo de prontuário.
- [ ] *Rate limit* (opcional): *gateway* ou regra no provedor; login e refresh com limite.
- [ ] *Backup* do volume MinIO, se S3 for self-hosted; se for R2/B2, política de *lifecycle* (opcional).

### Armazenamento (S3)

- [ ] Trocar MinIO local por endpoint de produção (R2, B2, S3) — `S3_*` + bucket criado; testar *presign* com domínio do front.
- [ ] Rotação de chaves S3; não usar `minio123` em produção.
- [ ] Tamanho máximo de upload alinhado ao *reverse proxy* (Nginx, Render, etc.).

### Banco

- [ ] `DATABASE_URL` (JDBC) apontando para instância gerida ou VPS; SSL exigido pelo provedor.
- [ ] *Connection pool* adequado; variáveis `DATABASE_USERNAME` / `DATABASE_PASSWORD` só em *secret*.
- [ ] Política de *backup* e restauração (ver `banco-dados-postgresql.md`).

### CI / artefato

- [ ] Build reproduzível: `./mvnw -B package -DskipTests` (ou com testes em *branch* de release).
- [ ] Imagem Docker (opcional) ou *fat JAR*; versão *tag* em Git.

## Frontend (`fisio-web` / Next)

### Ambiente e API

- [ ] `BACKEND_API_URL` / `NEXT_PUBLIC_API_BASE_URL` = URL pública do backend **com** `/v1` se for o *base path* acordado.
- [ ] Domínio do site em Vercel/outro; HTTPS automático; sem *mixed content* (API também HTTPS).
- [ ] *Cookies* HttpOnly: *SameSite* e *Secure* validados (já ajustáveis em `secureCookie`); login real end-to-end.
- [ ] Trocar dados **mock** (`MockDataProvider`) por chamadas à API progressivamente; feature flag se necessário.
- [ ] *Error boundary* e mensagens amigáveis; não expor *stack* ao usuário.
- [ ] *Analytics* / *Sentry* (opcional) com dados mínimos e *PII* mascarada.

### Build e *pipeline*

- [ ] `npm run build` sem erros; variáveis `NEXT_PUBLIC_*` definidas no painel (não comitar segredos).
- [ ] *Preview deploys* para PRs (Vercel gratuito) antes de *merge* em `main`.

## Integração fim a fim

- [ ] Login → chamadas autenticadas (cookie ou *proxy*) → 401 tratado.
- [ ] CORS: front abre, API responde *preflight* `OPTIONS` se aplicável.
- [ ] *Smoke test* manual: login, listar pacientes, criar agendamento, upload de anexo (S3), logout.

## Pós-implantação

- [ ] DNS e certificados monitorados; renovação automática.
- [ ] *Runbook* de *rollback* (imagem/versão anterior, *migrations* com cuidado).
- [ ] *Alertas* básicos (*uptime* e erro 5xx) — *Better Stack Uptime* (free) ou e-mail do provedor.

---

**Manutenção:** tratar este ficheiro como *living document*; ao fechar tarefas, anotar a data e o ambiente (staging/prod).

**Escalabilidade:** tarefas acima preparam crescimento (secrets, CORS, SSL) sem forçar um fornecedor específico. **Melhoria:** automatizar *backup* e teste de *restore* trimestral.
