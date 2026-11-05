# Step-by-step — Configurações institucionais da clínica na API

Data: 2026-05-28
Roadmap: §7 (Configurações da clínica) — persistência via API dos dados que a Julli preenche.

## Objetivo

Mover os dados institucionais/LGPD da clínica (que antes apareceriam como placeholders `[INSERIR ...]`
nos documentos legais) para um recurso **persistido na API**, editável pela própria Julli em
`/configuracoes`. Campos: CNPJ, endereço, cidade, UF, e-mail e telefone de contato, e encarregado de dados (DPO).

## Decisões arquiteturais

- **Tenant, não usuário:** o recurso é escopado por `ClinicId` (claim `clinic_id` do JWT, via `FisioPrincipal`),
  seguindo o padrão de `PatientController` — e não por `userId` como `/v1/auth/me`. Um registro por tenant na
  tabela `clinic`.
- **Hexagonal:** domínio (`ClinicSettings` / `ClinicSettingsCommand`) sem dependência de framework; port de saída
  `ClinicSettingsRepositoryPort`; adapter JPA estendendo a `ClinicEntity` existente; serviço de aplicação com
  normalização (trim + UF em maiúsculas).
- **Sem nova tabela:** reaproveitamos `clinic` (que já existia com `id`/`name`), adicionando colunas via migration.
- **Frontend via BFF genérico:** o client usa `backendJson` + `backendApiPath("clinic/settings")`
  (`/api/backend/v1/clinic/settings`), padrão dos recursos de domínio. Não foi criado route handler dedicado.
- **Nome de exibição:** permanece como está (preferência local), para não duplicar churn; o card edita apenas
  os campos institucionais.

## Backend — arquivos

| Arquivo | Função |
|---------|--------|
| `db/migration/V12__clinic_institutional_settings.sql` | Adiciona 8 colunas em `clinic` (`NOT NULL DEFAULT ''`). |
| `domain/clinic/ClinicSettings.java` | Modelo de leitura (record). |
| `domain/clinic/ClinicSettingsCommand.java` | Comando de atualização (record). |
| `application/port/out/ClinicSettingsRepositoryPort.java` | Port de saída (find/update). |
| `adapters/out/persistence/entity/ClinicEntity.java` | Entidade estendida com as colunas institucionais. |
| `adapters/out/persistence/ClinicSettingsRepositoryAdapter.java` | Adapter JPA do port. |
| `application/ClinicSettingsService.java` | Serviço (get/update + normalização). |
| `adapters/in/web/api/ClinicSettingsController.java` | `GET`/`PUT` `/v1/clinic/settings`. |
| `adapters/in/web/dto/clinic/ClinicSettingsResponse.java` | DTO de resposta. |
| `adapters/in/web/dto/clinic/ClinicSettingsUpdateRequest.java` | DTO de request com `@Valid` (`@Email`, `@Size`). |

Segurança: a rota cai em `anyRequest().authenticated()` (SecurityConfig), portanto exige Bearer token.

## Frontend — arquivos

| Arquivo | Função |
|---------|--------|
| `lib/clinic-profile-api.ts` | Tipos + `fetchClinicProfile` / `updateClinicProfile`. |
| `lib/api/hooks/use-fisio.ts` | `useClinicProfile` (query) + `useUpdateClinicProfile` (mutation) + `fisioKeys.clinicProfile`. |
| `components/configuracoes/clinic-institutional-card.tsx` | Card de edição (extraído para manter a page enxuta). |
| `app/(app)/configuracoes/page.tsx` | Monta o card e ajusta o texto introdutório. |

## Validação executada

- `mvnw compile` (backend): sucesso.
- Migration V12 aplicada (schema em `v12`).
- Smoke test ponta-a-ponta (login → `GET` → `PUT` → `GET`): persistência confirmada; UF normalizada para maiúsculas.
- Dados de teste limpos após verificação (campos voltam vazios para a Julli preencher).
- `npm run lint`: sem erros (apenas warnings pré-existentes).
- `npm run build`: sucesso (TypeScript OK, `/configuracoes` compila).

## Próximos passos sugeridos

- Conectar os documentos legais (`/termos-de-uso`, `/politica-de-privacidade`) a esses dados. Como as páginas são
  públicas (pré-login), seria necessário um endpoint público de leitura ou injeção em build; hoje seguem com
  placeholders. A fonte de verdade já é a API.
- Avaliar incluir o nome de exibição da clínica no mesmo recurso, migrando o uso de `localStorage` na sidebar/PDF.
