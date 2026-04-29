# Step-by-step: correção da falha TruffleHog (frontend)

## Contexto

- O job `sast-and-secrets` falhava com:
  - `BASE and HEAD commits are the same. TruffleHog won't scan anything.`
- Isso ocorria porque o workflow fixava:
  - `base: ${{ github.event.repository.default_branch }}`
  - `head: HEAD`

## Causa raiz

- Em eventos de `push` para a branch padrão, `HEAD` pode resolver para o mesmo commit de `base`.
- O action do TruffleHog encerra com erro quando `BASE == HEAD`.

## Etapas executadas

1. Analisei o workflow `security-frontend.yml` e confirmei a parametrização fixa de `base/head`.
2. Removi os parâmetros `base` e `head` do step do TruffleHog.
3. Mantive `path` e `extra_args` inalterados para preservar a política de scan.

## Arquivos modificados

- `.github/workflows/security-frontend.yml`
  - Remoção de `base` e `head` no step `TruffleHog (secret scanning)`.
- `docs/steps/STEP-BY-STEP-FIX-TRUFFLEHOG-BASE-HEAD-FRONTEND-2026-04-29.md`
  - Documento desta implementação.

## Decisão técnica

- Deixei o TruffleHog em modo padrão por evento (auto-detection do intervalo de commits), que é o comportamento recomendado para `push` e `pull_request`.
- Essa decisão evita falsos negativos por intervalo vazio e reduz fragilidade da pipeline sem alterar regras de segurança.

## Resultado esperado

- O job `sast-and-secrets` não deve mais falhar por `BASE == HEAD`.
- O scan de segredos continua ativo e com política `--only-verified`.
