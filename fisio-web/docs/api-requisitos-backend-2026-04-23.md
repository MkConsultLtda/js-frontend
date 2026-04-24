# APIs necessárias para atender o frontend (Fisio Web)

> Especificação **de requisitos** (não é OpenAPI completo). Base: entidades e fluxos do mock. Versão sugerida: `v1`. Autenticação: **Bearer JWT** (ou sessão com cookie HttpOnly) em todos os endpoints abaixo, exceto login/refresh/health.

## Convenções

- Base URL: `https://api.exemplo.com/v1`
- `Content-Type: application/json; charset=utf-8`
- Erros: JSON `{ "code": "STRING", "message": "pt-BR", "details": [] }` com HTTP 4xx/5xx
- Datas: ISO-8601 `date` (YYYY-MM-DD) e `date-time` (UTC com offset ou Z)
- Idempotência: `Idempotency-Key` em POST críticos (opcional)

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

Este documento pode ser convertido em **OpenAPI 3.1** (YAML) após o time de backend validar entidades e naming.
