# Step-by-step — Páginas legais consumindo dados da API (endpoint público)

Data: 2026-05-28
Fecha o ciclo da feature de Configurações da clínica: os campos que a Julli preenche na API agora
aparecem automaticamente nos documentos legais públicos.

## Objetivo

Substituir os placeholders `[INSERIR ...]` das páginas `/termos-de-uso` e `/politica-de-privacidade`
por dados reais vindos da API, sem exigir login (as páginas são públicas).

## Decisões

- **Endpoint público dedicado** (`GET /v1/public/clinic-profile`), separado do recurso autenticado
  `/v1/clinic/settings`. Expõe apenas campos seguros para documento legal: CNPJ, endereço, cidade/UF,
  e-mail e telefone de contato, DPO (nome/e-mail) e o **profissional responsável** (nome + Crefito).
- **MVP single-tenant:** sem JWT não há como derivar o tenant; o serviço usa a **clínica padrão** do deploy
  (`findDefault`) e o **primeiro usuário** dessa clínica como responsável.
- **Crefito vem do perfil** (`app_user`), não das configurações — por isso o endpoint junta clínica + profissional.
- **Fetch server-side** nas páginas (server components), via `backendApiUrl()`, com `revalidate: 300` (ISR).
  Resiliente: em falha, retorna `null` e as páginas usam textos de fallback.

## Backend

| Arquivo | Mudança |
|---------|---------|
| `domain/clinic/PublicClinicProfile.java` | **Novo** record (dados públicos + responsável). |
| `application/port/out/ClinicSettingsRepositoryPort.java` | `+ findDefault()`. |
| `adapters/out/persistence/ClinicSettingsRepositoryAdapter.java` | implementa `findDefault()`. |
| `application/port/out/TherapistAccountRepositoryPort.java` | `+ findFirstByClinicId(ClinicId)`. |
| `adapters/out/persistence/AppUserJpaRepository.java` | `+ findFirstByClinic_IdOrderByIdAsc(UUID)`. |
| `adapters/out/persistence/TherapistAccountRepositoryAdapter.java` | implementa `findFirstByClinicId`. |
| `application/PublicClinicService.java` | **Novo** — combina clínica + responsável. |
| `adapters/in/web/dto/clinic/PublicClinicResponse.java` | **Novo** DTO. |
| `adapters/in/web/api/PublicClinicController.java` | **Novo** `GET /v1/public/clinic-profile`. |
| `config/SecurityConfig.java` | `/v1/public/**` em `PUBLIC`. |
| `adapters/in/web/security/JwtAuthenticationFilter.java` | `/v1/public/**` em `publicPatterns` (o filtro tem allowlist própria). |

> Observação: a liberação da rota exigiu adicionar `/v1/public/**` em **dois** lugares — o `SecurityConfig`
> (autorização) e o `JwtAuthenticationFilter` (que rejeita requisições sem `Bearer` antes da autorização).

## Frontend

| Arquivo | Mudança |
|---------|---------|
| `lib/public-clinic-api.ts` | **Novo** — `fetchPublicClinicProfile()` (server-only) + `formatCityState()`. |
| `app/termos-de-uso/page.tsx` | Server component `async`; foro (cidade/UF), e-mail, telefone, responsável e Crefito dinâmicos. |
| `app/politica-de-privacidade/page.tsx` | Server component `async`; nome e e-mail do DPO dinâmicos. |

Fallbacks quando o campo ainda não foi preenchido: "a definir pela administradora" / `BRAND_OWNER` para o nome.

## Validação
- `mvnw compile`: sucesso.
- `GET /v1/public/clinic-profile` (sem token): 200 — retorna campos institucionais + responsável do seed.
- `npm run lint`: sem novos erros.
- `npm run build`: sucesso; páginas legais como ISR (revalidate 5min).

## Fluxo final
Julli preenche em **/configuracoes** (autenticado, `PUT /v1/clinic/settings`) e em **/perfil** (Crefito) →
os documentos legais públicos refletem os dados (atualização a cada 5 min por ISR).
