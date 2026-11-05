--- ISSUE 1 ---

# [Segurança] Endpoint público escolhe clínica arbitrária e RLS libera tudo sem contexto

**Labels sugeridas:** `security, severity:medium`

## Problema
`GET /v1/public/clinic-profile` (sem autenticação) carrega a «clínica padrão» com `findAll().findFirst()`. Em paralelo, a policy RLS `tenant_select` permite **todas** as linhas quando `app.clinic_id` está vazio — exatamente o estado das conexões JDBC sem JWT.

## Por que é explorável
Com duas ou mais clínicas no mesmo Postgres, um visitante anônimo recebe CNPJ, endereço, contato, DPO e Crefito de um tenant indefinido. Qualquer código futuro que consulte tabelas tenant sem `ClinicTenantContext` herda acesso total no banco.

## Evidência
```java
// ClinicSettingsRepositoryAdapter.java:32–33
public Optional<ClinicSettings> findDefault() {
    return clinics.findAll().stream().findFirst().map(this::toDomain);
}
```

```sql
-- V27__tenant_rls_policies.sql:81–87
USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::text = current_setting('app.clinic_id', true)
)
```

`PublicClinicController.java:23–26` e `PublicClinicService.java:16–29`. `JwtAuthenticationFilter` não seta contexto em `/v1/public/**`.

## Impacto
Vazamento de dados institucionais cross-tenant; defesa em profundidade do RLS inútil em paths públicos.

## Sugestão de correção
1. Trocar `findDefault()` por um seletor explícito (slug/host/`PUBLIC_CLINIC_ID`) ou 404 se houver ≠1 clínica.
2. Fail-closed no RLS quando `app.clinic_id` estiver vazio, exceto roles de migração (Flyway).
3. Não consultar tabelas tenant em requests sem `ClinicTenantContext`.

## Critérios de aceite
- [ ] Com 2 clínicas no banco, `GET /v1/public/clinic-profile` não devolve a clínica «errada» (slug explícito ou 404).
- [ ] Policy RLS de produção **nega** SELECT em `patient`/`clinic` quando `app.clinic_id` está vazio (testado com role da aplicação, não superuser).
- [ ] Teste de integração cobre o endpoint público com 0, 1 e N clínicas.

--- FIM ISSUE 1 ---
