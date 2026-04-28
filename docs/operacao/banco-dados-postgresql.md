# Banco de dados (PostgreSQL) — LOCAL e PRODUÇÃO

A API usa **Flyway** (`msorquestrador-jf/src/main/resources/db/migration/`) e `hibernate.ddl-auto: validate` em *runtime* padrão — a **fonte de verdade** do *schema* é o SQL versionado, não o Hibernate a criar tabelas *em prod*.

---

## 1) LOCAL (desenvolvimento)

### Opção A: Docker (recomendada)

No repositório do *backend* já tens `docker-compose` com o serviço `db`. Cria `.env` local com:

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`

*URL* JDBC (Spring):

- `jdbc:postgresql://localhost:5432/fisio` (ou o *host/port* do Compose)

1. Sobe: `docker compose up -d db`  
2. Sobe a API: `mvn spring-boot:run` com o perfil e credenciais corretas.  
3. O **Flyway** aplica *migrations* ao arranque; verifica *logs* por `Flyway` / `V1__`…

### Opção B: PostgreSQL instalado no SO

1. Criar *database* (ex. `fisio`) e *user* com permissões.  
2. Definir `DATABASE_URL` / *username* / *password* na env da aplicação.  
3. Nunca correr *DDL* à mão se já tens *migration* idêntica; evita *drift*.

---

## 2) PRODUÇÃO (gestão mínima)

### *Managed* (ex.: Neon, Supabase Postgres, *RDS* mínimo)

1. Criar **instância** na região perto do teu *backend* (baixa *latency* e custo de *egress*).  
2. Com SSL **obligatório**; copiar *connection string* (Postgres) → converter para **JDBC** (Spring gosta de *URI* com parâmetros `?sslmode=require` conforme o fornecedor).  
3. **Sem** deixar `0.0.0.0/0` *open* na Internet se o fornecedor permitir *“private access only”* — idealmente a API acessa a DB por **rede privada** (mesma VPC) ou *allowlist* do *IP* do *Render/Fly* (varia com o plano *free*).  
4. Criar **1 utilizador** de aplicação com o mínimo de privilégios (`CONNECT`, *CRUD* nas tabelas da aplicação).

#### Neon — connection string ↔ JDBC para Spring Boot

Neon mostra *connection string* no formato **`postgresql://` (driver *libpq*)**.  
O Spring espera **`jdbc:postgresql://…`** nas variáveis **deste** projecto.

| Valor Neon (painel) | Como mapear |
|---------------------|------------|
| URI `postgresql://USER:PASSWORD@HOST:5432/neondb?sslmode=require` | Não cries ficheiros com estas credenciais no Git. |
| `DATABASE_URL` (Spring) | `jdbc:postgresql://HOST:5432/neondb?sslmode=require` — **sem `user/password` dentro da URL** se usares também `DATABASE_USERNAME` e `DATABASE_PASSWORD` (evita caracteres especiais na URL). |
| `DATABASE_USERNAME` | mesmo *user* (ex.: `neondb_owner`) |
| `DATABASE_PASSWORD` | *password* (mete na env / *secret*, nunca na repo). |

Exemplo apenas de formato (host inventado):

```bash
DATABASE_URL=jdbc:postgresql://ep-xxxx.us-east-1.aws.neon.tech:5432/neondb?sslmode=require
DATABASE_USERNAME=neondb_owner
DATABASE_PASSWORD=<segredo apenas no PaaS ou .env local gitignored>
```

Se **partilhaste uma connection string por engano**, regenerea a palavra-passe ou o *role* no painel Neon (**Reset password**) e actualiza só os teus segredos.

O backend com **`SPRING_PROFILES_ACTIVE=prod`** aplica **`application-prod.yml`**: *pool* Hikari e `prepareThreshold` amigável para **Neon *pooled*** (PgBouncer), *retries* do Flyway no arranque, e *health* actuator com Postgres. Opcionalmente ajustas `HIKARI_*` / `FLYWAY_*`/`PG_PREPARE_THRESHOLD` (`env.example`).

#### Passos lógicos no *dashboard* do Neon (exemplo)

- *Create project* → *Create database* (default costuma ser “main”).  
- Copiar host, porta, BD, utilizador → montar JDBC como acima; *password* em `DATABASE_PASSWORD`.  
- Testar: `psql` ou *SQL editor* *web* a correr `SELECT 1;`.

### Utilizador e permissões (recomendado em prod)

- Utilizador da aplicação **diferente** de `postgres` (super).  
- Evitar múltiplas apps a partilharem o mesmo *user*.

### Migrações em produção

- **Estratégia segura (padrão deste projecto):** o processo *Java* aplica o Flyway no *startup* (`spring.flyway.enabled: true`) **desde** que:  
  - a conta da BD tenha permissão para *DDL* (criação de tabelas e dos *schema_version* do Flyway) na **primeira** *deploy*; *ou*  
  - aplicas *migrations* numa *CI* separada (mais *enterprise*).

  Para MVP, **arranque da aplicação com flyway=on** e credenciais *DDL* (apenas fase de *setup*) é comum; depois podes restringir permissões.

- *Rollback* de *migrations* SQL: fazer *forward-only*; planear *Vn+1* para reverter, não *drop* a esmo.

### *Backup* e *restore* (mínimo aceitável)

- **Provedor gerido:** *Point-in-time* / *automatic backups* conforme plano *free* (Neon dá *backup* básico; lê a doc deles).  
- **Dados críticos (LGPD):** política de retenção + teste de *restore* 1x por trimestre.  
- ***Dump* manual** (qualquer sítio):

  ```bash
  pg_dump --format=custom --file=fisio.dump "postgresql://USER:PASS@HOST:5432/DB"
  ```

- **Restore** (cuidado em produção, em janela de *maintenance*):

  ```bash
  pg_restore --verbose --no-owner -d "postgresql://..." fisio.dump
  ```

*Objeto storage* (R2) é **ficheiros** — *backup* separado (*lifecycle*, duplicação) em doc de *deploy*.

---

## 3) Tabela de envs (BD)

| Variável | LOCAL | PRODUÇÃO |
|----------|---------|----------|
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/fisio` | `jdbc:postgresql://…?sslmode=require` (ajustar) |
| `DATABASE_USERNAME` / `DATABASE_PASSWORD` | o que definires no Docker | *secrets* do Neon / host |

(Ver também `variaveis-ambiente-local-producao.md`.)

---

## 4) Checklist antes de dizer “BD em prod pronto”

- [ ] *SSL* para ligação à base.  
- [ ] *Firewall* / *network* só o que a API precisa.  
- [ ] *Migrations* aplicadas e `flyway_schema_history` revisto.  
- [ ] *Backup* automático ativo; *teste* de *restore* documentado.  
- [ ] *Rotation* de password em caso de *leak* (e actualização de *secrets*).

**Manutenção:** *migrations* sempre *forward*; **escalabilidade** — *connection pool* Hikari; **melhoria** — *replica* read (quando a leitura dominar) com rota dedicada (fase posterior).
