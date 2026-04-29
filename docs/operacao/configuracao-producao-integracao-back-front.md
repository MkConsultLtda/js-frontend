# Integração backend ↔ frontend — produção (referência rápida)

Este guia ajuda a alinhar o **Next.js** (`js-frontend`) com o **Spring Boot** (`msorquestrador-jf`) quando o backend está por exemplo no **Railway** e o frontend na **Vercel** ou outro host.

Lista mais ampla de variáveis: [variáveis de ambiente — local e produção](./variaveis-ambiente-local-producao.md).

---

## 1. URL pública da API no Railway

1. Abra o [Railway Dashboard](https://railway.app) e selecione o **projeto** e o **serviço** onde corre o JAR Spring Boot.
2. Vá em **Settings → Networking**.
3. Em **Public Networking**, gere ou copie o **domínio** (ex.: `msorquestrador-jf-production.up.railway.app`).
4. Use essa URL **HTTPS** como base da API **incluindo o prefixo de versão** que o projeto usa (`/v1`):

```text
https://<domínio-railway>/v1
```

Health check tipicamente disponível para o Railway apontar o serviço:

```text
GET https://<domínio-railway>/v1/health
```

Os *logs* em tempo real ficam na aba **Deployments** → selecionar o deploy → **View Logs** (stdout/err do Java).

---

## 2. Variáveis no frontend (Vercel / produção)

O código usa `backendApiUrl()` em `lib/server-auth.ts`:

| Prioridade | Variável | Observação |
|------------|-----------|-------------|
| 1ª | `BACKEND_API_URL` | Preferida nas **rotas servidor** (`/app/api/auth/*`): não precisa ir para o *bundle* público do browser. |
| 2ª / 3ª | `NEXT_PUBLIC_API_BASE_URL` ou `NEXT_PUBLIC_API_URL` | Útil se outros trechos cliente precisem da mesma base. |
| *default* dev | — | Sem variáveis, cai em `http://localhost:8080/v1`. |

**Produção (exemplo):**

```bash
BACKEND_API_URL=https://seu-backend.up.railway.app/v1
# ou (se usar prefisos públicos)
NEXT_PUBLIC_API_BASE_URL=https://seu-backend.up.railway.app/v1
```

- **Mesma URL** deve ser válida quando o servidor Next.js chama o Java (`fetch` das route handlers).
- **Sem barra final** estranha: o código remove `/` redundante antes de usar.

Cookies de sessão ficam **no domínio do site** (frontend); apenas o servidor Next encaminha tokens ao backend — não exponha JWT em JS no cliente por rotas públicas já existentes (`HttpOnly`).

---

## 3. CORS no backend

O perfil prod exige `CORS_ALLOWED_ORIGIN` igual à **origem exata** do navegador (esquema + host, sem path), um domínio:

```bash
CORS_ALLOWED_ORIGIN=https://seu-app.vercel.app
```

Se usar domínio customizado (`https://app.sua-clinica.com.br`), esse é o valor.

---

## 4. Tipos de acesso (`ADMIN` e `THERAPIST`)

Contrato atual:

| Valor (`role`) | Significado | Spring (`Authority`) |
|----------------|-------------|----------------------|
| `ADMIN` | Administrador da aplicação / gestão. | `ROLE_ADMIN` |
| `THERAPIST` | Fisioterapeuta (uso cotidiano da ferramenta). | `ROLE_THERAPIST` |

- `GET /v1/auth/me` devolve um campo JSON **`role`** com `ADMIN` ou `THERAPIST`.
- Tokens JWT incluem `role` nos *claims* (`access` e `refresh`); após migrações antigas sem *claim*, assume-se **THERAPIST** até novo login/pair.

**Produção — marcar primeiro admin**

Não existe seed automático em `prod`. Com credenciais no Postgres executar (troque email e só depois distribua login):

```sql
UPDATE app_user SET role = 'ADMIN' WHERE email = 'seu-email@dominio.com';
```

Novos fisios continuam **`THERAPIST`** pelo *default* do banco, salvo atualização como acima ou futura ferramenta de gestão.

**Frontend:** opcional usar `role` para mostrar/ocultar telas até que rotas só-admin existam — hoje todas as APIs autenticadas aceitam qualquer papel; restrições finas usarão `@PreAuthorize` no backend quando definidas.

---

## 5. Logs da aplicação (backend)

Spring Boot envia logs para **stdout** (nível configurável):

| Variável (opcional) | Efeito |
|---------------------|--------|
| `LOG_LEVEL_ROOT` | Padrão sugerido: `INFO` |
| `LOG_LEVEL_APP` | Ex.: `INFO` ou `DEBUG` só em diagnóstico |

Railway agrupa esse fluxo nos **Deployments** → **Logs**. Para JSON estruturado ou *correlation IDs*, evoluir depois conforme observabilidade (sem mudar comportamento atual).

---

## 6. Banco de dados — alinhamento com frontend e APIs

Resumo conceitual (migrations Flyway `V1` … `V5`):

| Tabela / área | Uso típico no app |
|-----------------|-------------------|
| `clinic` | *Tenant* único (MVP); ID fixo no seed inicial. |
| `app_user` | Login; campo **`role`** (`ADMIN` / `THERAPIST`). |
| `patient` | Cadastro pacientes — endereço em colunas. |
| `appointment` | Agenda (sessão, bloqueio, etc.). |
| `evolution` | Evolução por sessão (regras agenda “concluir”). |
| `anamnese` | Anamnese / prontuário textual. |
| `patient_attachment` | Metadados de anexo; arquivo em armazenamento S3-compatível (`S3_*`). |

Isto cobre pacientes, agenda, evolução, anamnese e anexos — alinhado às páginas e rotas já consumindo `/v1/...`.

---

## 7. O que **não** versionar e o que Railway não deve “embutir”

| Item | Razão |
|------|-------|
| `target/` / `build/` Maven | Artefacto de compilação; já no `.gitignore` do backend. |
| `.env`, `.env.local`, credenciais reais | *Secrets*. |
| `JWT_SECRET`, senhas Postgres, keys S3 | Só por variável de ambiente no Railway / Neon / R2. |
| Dumps `.sql` com dados prod | Risco GDPR e vazamento. |

Commits acidentais de `application-prod.yml` só com placeholders (como já documentado nos `env.example`); valores reais apenas no deploy.

---

## 8. Checklist rápido deploy primeiro front + back

1. Backend no Railway com `SPRING_PROFILES_ACTIVE=prod` (ou equivalente).  
2. `DATABASE_*`, `JWT_SECRET`, `CORS_ALLOWED_ORIGIN`, `S3_*` preenchidos.  
3. Flyway aplicado (Railway sobida do JAR já corre migrations ao arrancar).  
4. Criado pelo menos um `ADMIN` ou `THERAPIST` conforme secção [4](#4-tipos-de-acesso-admin-e-therapist).  
5. No Vercel: `BACKEND_API_URL`/`NEXT_PUBLIC_*` como em [2](#2-variáveis-no-front-end-vercel--producão).  

**Manutenção:** ao mudar URLs ou contrato `auth/me`, atualizar também `env.example` na raiz do frontend/backend.

**Escalabilidade:** separar staging/produção por *service* Railway e projeto Vercel evita erro de **CORS** e de **JWT** entre ambientes. **Melhoria:** painel só-admin quando houver políticas explícitas; rotação de `JWT_SECRET` com janelas de coexistência só se usar assinatura dupla (não implementado aqui).

---

## 9. Implementação do front (guia prático)

### 9.1 Fluxo de autenticação no Next.js

1. `POST /v1/auth/login` via rota de servidor (`app/api/auth/login`), nunca direto em componente cliente.  
2. Guardar `access_token` e `refresh_token` em cookie `HttpOnly` (já adotado no projeto).  
3. Em chamadas de API feitas no servidor, incluir `Authorization: Bearer <access_token>`.  
4. Em `401` por expiração, tentar `POST /v1/auth/refresh` uma vez; se falhar, limpar sessão e redirecionar para login.  
5. Em `429` (rate-limit de login), mostrar mensagem amigável e aplicar *retry* com atraso progressivo.

### 9.2 Contratos de erro que o front deve tratar

| HTTP | code (`ApiErrorResponse`) | Ação recomendada no front |
|------|----------------------------|----------------------------|
| `400` | `VALIDATION` | Mostrar erro de formulário/campo. |
| `401` | `UNAUTHORIZED` | Sessão inválida/expirada: tentar refresh ou forçar login. |
| `403` | `FORBIDDEN` | Bloquear ação e informar falta de permissão. |
| `409` | `CONFLICT` | Exibir conflito de regra de negócio. |
| `413` | `PAYLOAD_TOO_LARGE` | Avisar limite de upload e impedir novo envio inválido. |
| `429` | `TOO_MANY_REQUESTS` | Informar excesso de tentativas e sugerir aguardar. |

### 9.3 Rate limit de login (estado atual)

- Já existe **rate limit no backend** para `POST /v1/auth/login` (por IP, em memória do processo).
- Em produção com múltiplas réplicas, o ideal é complementar com limite no edge (`WAF/CDN/Gateway`) para proteção global contra brute-force distribuído.
- Para front, tratar `429` como caso funcional esperado (não como erro genérico).

---

## 10. Perguntas de segurança e operação

### O fisioterapeuta consegue alterar a senha?

**Sim.** Endpoint disponível: `PATCH /v1/auth/password` (autenticado).

Contrato esperado:
- `currentPassword`
- `newPassword`
- `confirmNewPassword`

Comportamento:
- valida senha atual;
- valida política mínima da nova senha;
- retorna novo par de tokens para substituir a sessão atual;
- refresh antigo passa a ser inválido após alteração.

### Criptografia e dados em transição estão ok?

**Parcialmente ok, com pré-condições de deploy:**

- Senhas estão armazenadas com `BCrypt` (hash, não texto puro).
- JWT é assinado (HMAC com segredo obrigatório em `prod`).
- Para anexos, a API usa URL pré-assinada com expiração curta (download temporário).
- Tráfego em produção deve ser **HTTPS** ponta a ponta (browser↔Vercel↔backend↔S3).

Pontos de atenção obrigatórios:
- Nunca subir `JWT_SECRET` fraco ou vazio em produção.
- Confirmar TLS também no endpoint S3 (evitar endpoint local/inseguro em prod).
- Manter CORS restrito ao domínio real do front.

### Anexos: forma mais barata, performática e segura?

**Recomendação custo-benefício atual:** manter S3-compatible com endpoint barato (ex.: B2/R2), com presigned URL e metadados no Postgres.

Análise:
- **Custo:** B2/R2 tende a ser mais barato que S3 padrão para MVP com tráfego moderado.
- **Performance:** boa para arquivos clínicos comuns (PDF/imagem), principalmente com CDN na borda e objetos estáticos.
- **Segurança:** boa base já implementada (tipos permitidos, tamanho máximo, chave técnica por UUID, URL assinada com expiração).

Melhorias incrementais (quando volume subir):
1. ativar varredura antimalware assíncrona em upload;
2. versionar/rotacionar chaves de acesso do storage;
3. definir política de retenção/arquivamento para reduzir custo em longo prazo.
