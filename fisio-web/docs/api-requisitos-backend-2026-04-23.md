# APIs necessárias para atender o frontend (Fisio Web)

> Especificação **de requisitos** (não é OpenAPI completo). Base: entidades e fluxos do mock. Versão sugerida: `v1`. Autenticação: **Bearer JWT** (ou sessão com cookie HttpOnly) em todos os endpoints abaixo, exceto login/refresh/health.

**Índice:** [Convenções](#convenções) · [Recursos (tabelas)](#recursos) · [Códigos de erro](#códigos-de-erro-exemplos) · [Dependências entre telas](#dependências-entre-telas) · [Guia de criação do backend](#guia-de-criação-do-backend) · [Referências](#referências) · [Prompts para IA (Cursor / assistente)](#prompts-para-ia-cursor--assistente)

## Convenções

- Base URL: `https://api.exemplo.com/v1`
- `Content-Type: application/json; charset=utf-8`
- Erros: JSON `{ "code": "STRING", "message": "pt-BR", "details": [] }` com HTTP 4xx/5xx
- Datas: ISO-8601 `date` (YYYY-MM-DD) e `date-time` (UTC com offset ou Z)
- Idempotência: `Idempotency-Key` em POST críticos (opcional)
- **Idempotência sugerida:** `POST` de criação com natural key (ex.: `externalId` / `clientRequestId`) quando o front puder repetir a mesma ação.
- **Paginação (listas):** `?page=0&size=20&sort=field,asc` (padrão Spring) ou `cursor` se preferir.

## Recursos

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/login` | body: `email`, `password` → `accessToken`, `refreshToken`, `expiresIn` |
| POST | `/auth/refresh` | `refreshToken` |
| POST | `/auth/logout` | invalidar refresh |
| GET | `/auth/me` | perfil do usuário logado (fisioterapeuta) |

### Perfil fisioterapeuta
| Método | Rota | Descrição |
|--------|------|-----------|
| GET/PATCH | `/therapists/me` | nome, CREFITO, e-mail, telefone, avatar URL (upload separado) |

### Clínica (config)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET/PATCH | `/clinic/settings` | nome, dias úteis, durações, tipos, preços, metas, buffer deslocamento |

### Pacientes
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/patients` | listagem, paginação, `?q=` busca |
| GET | `/patients/:id` | detalhe |
| POST | `/patients` | cria |
| PUT/PATCH | `/patients/:id` | atualiza |
| DELETE | `/patients/:id` | soft delete recomendado |

### Agenda / compromissos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/appointments` | `?from=&to=&patientId=` |
| GET | `/appointments/:id` | |
| POST | `/appointments` | sessão, bloqueio, evento pessoal (campo `kind`) |
| PUT/PATCH | `/appointments/:id` | |
| DELETE | `/appointments/:id` | |

**Regras de negócio (espelho do front):** conclusão de sessão com evolução na mesma data; conflito de horário sinalizado para confirmação (ou 409 com lista de conflitos).

### Anamnese
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/patients/:id/anamneses` | lista |
| GET | `/anamneses/:id` | |
| POST | `/anamneses` | corpo: `patientId`, campos de texto, `anamneseTexto` (HTML sanitizado) |
| PUT | `/anamneses/:id` | |
| DELETE | `/anamneses/:id` | |

### Evolução
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/patients/:id/evolutions` | `?from=&to=` |
| GET | `/evolutions/:id` | |
| POST | `/evolutions` | inclui `dataSessao` (ou `sessionDate` ISO) |
| PUT | `/evolutions/:id` | |
| DELETE | `/evolutions/:id` | |

### Anexos do prontuário
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/patients/:id/attachments` | metadados + URLs de download (temporárias) |
| POST | `/patients/:id/attachments` | multipart `file` **ou** pre-signed URL + confirm |
| DELETE | `/attachments/:id` | |

### Dashboard (opcional, pode ser composto no front)
- Agregados: `GET /metrics/dashboard?date=` (contagens semana, mês, metas) — ou apenas composição via appointments/patients.

### Feriados
| GET | `/holidays?year=` | ou estático via CDN/Admin |

### Auditoria (LGPD)
| GET | `/audit-log` | com filtros e permissão de administrador de clínica |

## Códigos de erro (exemplos)

| `code` | HTTP | Uso |
|--------|------|-----|
| `UNAUTHORIZED` | 401 | token inválido |
| `FORBIDDEN` | 403 | sem perfil/tenant |
| `VALIDATION` | 400 | Zod/bean validation |
| `CONFLICT` | 409 | horário, duplicidade |
| `GONE` | 410 | prontuário com retenção legal |

## Dependências entre telas

- Evolução depende de `patientId` (e opcionalmente `appointmentId` futuro).
- “Concluir atendimento” valida `evolution` na mesma data.
- Anexos dependem de `patientId` e política de armazenamento no servidor.

---

## Guia de criação do backend

### 1) Fonte de verdade no produto (frontend)

- Modelos e campos esperados: `fisio-web/lib/types.ts` (e schemas em `fisio-web/lib/schemas/`).
- Regras já espelhadas no cliente: conflito de horário, conclusão de atendimento com evolução na data, configuração da clínica em `ClinicSettings`.

### 2) Stack sugerida (alinhada ao time)

| Camada | Sugestão |
|--------|----------|
| Linguagem / runtime | Java 17+ |
| Framework | **Spring Boot 3** |
| API | REST, JSON; **OpenAPI 3** gerado (springdoc-openapi) a partir do código ou contrato aprovado |
| Persistência | **PostgreSQL**; **Flyway** ou **Liquibase** para migrations |
| Segurança | **Spring Security**; JWT (access + refresh) ou sessão com cookie **HttpOnly** + CSRF se cookie session |
| Validação | `jakarta.validation` + DTOs; mensagens `pt-BR` onde fizer sentido |
| Mapa objeto-DTO | MapStruct (opcional) |
| Arquitetura | **Hexagonal**: domínio sem dependência de framework; *adapters* `in` (web) e `out` (JPA, storage de arquivos) |

### 3) Multi-tenant (clínica)

- **Fase 1 (MVP):** um único “tenant” / clínica por deploy ou `clinicId` fixo, todas as tabelas com `clinic_id` para evolução futura.
- **Fase 2:** usuário vinculado a `clinic_id` e filtros obrigatórios em *queries*.

### 4) Armazenamento de arquivos (anexos)

- Não guardar arquivos grandes no banco: **object storage** (S3, MinIO, GCS) com metadados no PostgreSQL.
- Download: URLs **assinadas** (tempo curto) ou streaming autenticado.

### 5) Ordem de implementação sugerida

1. Boot do projeto, `GET /actuator/health` (ou `/health` exposto de forma segura), perfil de ambiente.
2. **Auth** + usuário seed + `/auth/me`.
3. **Patients** (CRUD + busca).
4. **Appointments** (CRUD + intervalo de datas + regra de conflito e conclusão).
5. **Anamnese** e **Evolução** (HTML da anamnese sanitizado no *backend*; data da evolução alinhada ao front).
6. **Attachments** (upload + metadados).
7. **Clinic settings** + **Feriados** (opcional).
8. **Métricas** agregadas ou deixar só composição no front.
9. **Audit log** (eventos mínimos para LGPD, sem dados clínicos completos no log).

### 6) Alinhamento com o frontend

- CORS: origem do front (ex. `https://app.exemplo.com` e `http://localhost:3000` em dev).
- Timezone: contratos em **ISO**; se necessário, documentar fuso padrão da clínica.
- Exportar **OpenAPI YAML/JSON** no repositório do backend (ex. `/v3/api-docs`) para o front gerar client TypeScript (opcional, `openapi-generator` / `orval`).

### 7) Checklist antes de integrar o front

- [ ] Todos os endpoints mínimos do fluxo “paciente → agendar → evoluir” disponíveis.
- [ ] Erro padronizado com `code` e `message`.
- [ ] 401/403 testados; refresh token (se houver) documentado.
- [ ] Migrations versionadas; seed opcional de demo.

Este documento pode ser convertido em **OpenAPI 3.1** (YAML) após o time de backend validar entidades e naming.

---

## Referências

| Tema | Link / observação |
|------|-------------------|
| OpenAPI 3 | [https://spec.openapis.org/oas/v3.1.0](https://spec.openapis.org/oas/v3.1.0) |
| Spring Boot | [https://spring.io/projects/spring-boot](https://spring.io/projects/spring-boot) |
| Spring Security (JWT) | [https://spring.io/projects/spring-security](https://spring.io/projects/spring-security) |
| springdoc OpenAPI | [https://springdoc.org](https://springdoc.org) |
| LGPD (texto) | [http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) |
| COFFITO (normas) | [https://coffito.gov.br](https://coffito.gov.br) — Res. 414/2012, 415/2012, 555/2022 (atualizar no site) |
| CREFITO-10 (região) | [https://crefito10.org.br](https://crefito10.org.br) |
| Documentação interna front | `docs/seguranca-frontend-2026-04-23.md`, `docs/compliance-crefito10-prontuario-2026-04-23.md` |

---

## Prompts para IA (Cursor / assistente)

> Use **um prompt por vez**. Anexe o repositório do backend (ou a pasta) no contexto. Cole também o conteúdo (ou o path) de **`fisio-web/lib/types.ts`** e deste arquivo **`api-requisitos-backend-2026-04-23.md`**.

### Prompt A — Bootstrap Spring Boot (MVP)

```text
Quero criar o backend do sistema Fisio (clínica de fisioterapia) em Java com Spring Boot 3 e PostgreSQL.
Requisitos: arquitetura hexagonal (domain, application, adapters/in for web, adapters/out for JPA e storage); REST + JSON; Flyway; Spring Security com JWT (access + refresh) ou padrão session HttpOnly; springdoc OpenAPI; erros no formato { "code", "message", "details" }.
Endpoints mínimos iniciais: POST /v1/auth/login, POST /v1/auth/refresh, GET /v1/auth/me, GET/POST /v1/patients, health.
Use as entidades e campos do documento de requisitos anexo e do types.ts do frontend. Gere a estrutura de pastas, entidades de domínio, DTOs, controllers finos, e um README de como subir (Docker Compose com Postgres).
Não coloque credenciais reais; use application.yml com variáveis de ambiente.
```

### Prompt B — Módulo Pacientes alinhado ao front

```text
Implemente o módulo de pacientes (CRUD) conforme o contrato em api-requisitos-backend e os campos em types.ts (Patient: id, name, birthDate, email, cpf opcional, diagnosis, phone, responsiblePhone, profession, educationLevel, referralSource, address, lastSession, status, registeredAt).
Inclua: repositório JPA, validação, paginação em GET com ?q= para busca por nome/telefone/diagnóstico, soft delete com deleted_at se fizer sentido, testes de integração com @DataJpaTest ou Testcontainers mínimo.
Respostas: sempre JSON com códigos de erro do documento.
```

### Prompt C — Agenda e regras de negócio

```text
Implemente appointments (sessão, bloqueio, evento) conforme types.ts (Appointment) e tabela de rotas no documento api-requisitos. 
Regras: (1) ao marcar status COMPLETED, validar se existe evolução para o mesmo patientId e data da sessão; (2) conflito de horário: retornar 409 CONFLICT com lista de conflitos ou detalhe estruturado para o front confirmar. Use transações. Inclua testes de serviço de domínio.
```

### Prompt D — Anamnese e evolução (HTML e datas)

```text
Implemente anamneses e evoluções. Anamnese: campo texto rico (HTML) — sanitizar no backend (OWASP Java HTML Sanitizer ou similar). Evolução: dataSessao em formato que o front envia (alinhado ao evolucaoFormSchema e types.Evolucao). Relacione com patientId. Endpoints conforme documento. Teste sanitização e payload inválido.
```

### Prompt E — Anexos e storage

```text
Implemente upload de anexos por patientId: metadados no PostgreSQL, binário em S3-compatible (localstack ou MinIO no docker-compose). GET retorna URL pré-assinada de curta duração. DELETE remove metadado e opcionalmente objeto. Autenticação obrigatória.
```

### Prompt F — OpenAPI + cliente TypeScript (opcional)

```text
Gere o OpenAPI 3.1 (YAML) completo a partir dos controllers atuais (springdoc) e instruções para gerar um cliente TypeScript (orval ou openapi-generator) no monorepo ao lado de fisio-web, com baseURL em variável de ambiente NEXT_PUBLIC_API_URL.
```

### Prompt G — Sessão com o repositório frontend aberto

```text
Estou com o repositório js-frontend (Next) e vou conectar o fisio-web ao backend que você está gerando. Liste os arquivos que devo alterar no front primeiro (ex.: lib/api-client.ts, substituição do MockDataProvider, react-query) e a ordem de migração por tela: login → dashboard → pacientes → agenda → anamnese → evolução. Não reescreva o front inteiro; só um plano e snippets de integração.
```

---

## Changelog (documento)

| Data | Nota |
|------|------|
| 2026-04-23 | Versão inicial de rotas. |
| 2026-04-23 | Adicionados guia de backend, referências, prompts para IA, paginação e notas de integração. |
