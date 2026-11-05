--- ISSUE 2 ---

# [Segurança] JWT de acesso não revalida clínica nem papel contra o banco

**Labels sugeridas:** `security, severity:low`

## Problema
`JwtAuthenticationFilter` valida `userId` e `tokenVersion`, mas monta `FisioPrincipal` e `ClinicTenantContext` com `clinic_id` e `role` do access token.

## Por que é explorável
Se alguém alterar `app_user.clinic_id` ou `role` no banco **sem** incrementar `tokenVersion`, o access token vigente (TTL 15 min) continua a operar na clínica/papel antigos. O refresh (`AuthService.rotateAndIssue`) já relê o banco — o furo é só a janela do access token. Hoje não existe API admin para essa mudança.

## Evidência
```java
// JwtAuthenticationFilter.java:87–96
var user = users.findById(p.userId());
if (user.isEmpty() || user.get().getTokenVersion() != p.tokenVersion()) { ... }
var principal = new FisioPrincipal(p.userId(), p.email(), p.clinicId(), p.role());
ClinicTenantContext.set(p.clinicId());
```

## Impacto
Acesso residual à clínica antiga ou a `@PreAuthorize("hasRole('ADMIN')")` após downgrade, até o access token expirar.

## Sugestão de correção
Comparar `user.get().getClinic().getId()` e `user.get().getRole()` com os claims. Em divergência: 401 **ou** incrementar `tokenVersion` em qualquer UPDATE de clínica/papel.

## Critérios de aceite
- [ ] Teste: usuário com token de clínica A, `clinic_id` no DB trocado para B sem bump de versão → 401 (ou contexto B, se a decisão for «sempre DB»).
- [ ] Teste: ADMIN rebaixado a THERAPIST no DB → PUT `/v1/clinic/settings` recusado no access token vigente.
- [ ] Qualquer mutação futura de role/clínica incrementa `tokenVersion`.

--- FIM ISSUE 2 ---
