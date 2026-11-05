--- ISSUE 4 ---

# [Segurança] Credenciais padrão de desenvolvimento (admin seed, Postgres, MinIO)

**Labels sugeridas:** `security, severity:high`

## Problema
Vários defaults públicos viram credenciais reais se o override de ambiente faltar:

- FisioDevDataLoader.java:52 (perfis dev/docker, BD vazia): admin@clinica.local / Trocar@2026!dev
- docker-compose.yml:8,24-25: teste0101 (Postgres e MinIO), user MinIO minio
- application-dev.yml:6,32-33 e application-local.yml:8,21-22: mesma senha de banco/S3
- FisioStorageProperties.java:31-32: minio / minio123 (fallback Java, inconsistente com o YAML)

## Por que é explorável
Compose publica 5432/9000/9001. Uma API `dev`/`docker` com banco vazio cria um ADMIN conhecido. A senha está no `env.example` e no histórico git (`bcb8b2b`).

## Evidência
```java
@Profile({ "dev", "docker" })
String pass = (devPassword == null || devPassword.isBlank()) ? "Trocar@2026!dev" : devPassword;
```

```yaml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-teste0101}
MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-teste0101}
password: ${DATABASE_PASSWORD:teste0101}
```

## Impacto
Acesso administrativo à aplicação, ao Postgres (dados clínicos) e ao bucket de anexos.

## Sugestão de correção
1. Seed: falhar se `FISIO_DEV_ADMIN_PASSWORD` estiver vazio; não embutir senha no bytecode.
2. Compose: remover `:-teste0101`; exigir `.env` (Compose `required` ou script de check).
3. YAML local/dev: sem default de senha, só `${DATABASE_PASSWORD}` / `${S3_SECRET_KEY}`.
4. Apagar defaults `minio123` da classe Java.
5. Documentar geração de senhas no README; `env.example` com placeholders `CHANGE_ME`.

## Critérios de aceite
- [ ] Grep em `src/main` e `docker-compose.yml` não encontra `Trocar@2026!dev`, `teste0101`, `minio123`.
- [ ] `docker compose up` sem `.env` **falha** na falta de `POSTGRES_PASSWORD`.
- [ ] Perfil `dev` sem `FISIO_DEV_ADMIN_PASSWORD` não cria usuário (ou aborta o boot).
- [ ] `application-prod.yml` continua sem fallbacks (já está correto).

--- FIM ISSUE 4 ---
