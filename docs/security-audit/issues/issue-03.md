--- ISSUE 3 ---

# [Segurança] Segredo JWT e chave de CPF de desenvolvimento hardcoded

**Labels sugeridas:** `security, severity:high`

## Problema
Com `JWT_SECRET` vazio e `fisio.jwt.allow-insecure-empty-secret=true` (perfis `local`/`dev`/`docker`), a API assina JWT com `fisio-dev-jwt-secret-key-v1-abc12` e deriva a chave AES do CPF do mesmo fallback.

## Por que é explorável
A string está no git desde o primeiro commit do backend. Quem alcança uma instância nesses perfis forja tokens de qualquer usuário e, sem `FISIO_CPF_ENCRYPTION_KEY`, descriptografa CPFs.

## Evidência
```java
// JwtTokenService.java:51–57
bytes = "fisio-dev-jwt-secret-key-v1-abc12".getBytes(...);
```

```java
// CpfCryptoService.java:157–159
String seed = StringUtils.hasText(jwtSecret) ? jwtSecret : "fisio-dev-jwt-secret-key-v1-abc12";
return sha256(seed.getBytes(StandardCharsets.UTF_8));
```

`application-dev.yml:24–26` e `application-local.yml:13–15` ligam `allow-insecure-empty-secret: true`.

## Impacto
Comprometimento total da autenticação e de PII (CPF) no ambiente afetado.

## Sugestão de correção
1. Remover o literal do código; exigir `JWT_SECRET` ≥32 bytes em **todos** os perfis (gerar no README com `openssl rand -base64 48`).
2. Exigir `FISIO_CPF_ENCRYPTION_KEY` também em não-prod, ou recusar boot.
3. Fail-closed no startup se o secret for igual ao literal histórico (lista de defaults proibidos).
4. Rotacionar qualquer JWT/CPF usado em ambiente compartilhado que tenha rodado com o fallback.

## Critérios de aceite
- [ ] Grep no `src/main` não encontra `fisio-dev-jwt-secret-key-v1-abc12`.
- [ ] Boot com `JWT_SECRET` vazio falha em local/dev/docker (não só em prod).
- [ ] Boot com `FISIO_CPF_ENCRYPTION_KEY` vazio falha em não-prod, ou a derivação a partir do JWT é removida.
- [ ] Teste de startup cobre o default proibido.

--- FIM ISSUE 3 ---
