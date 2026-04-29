# Step-by-step — correção do dependency scan (PostCSS)

## Objetivo
Resolver falha do `npm audit --omit=dev --audit-level=moderate` no frontend causada por vulnerabilidade transitiva em `postcss`.

## Etapas executadas
1. Validada árvore de dependências e identificado `postcss` transitivo em versão vulnerável.
2. Adicionado `overrides` no `package.json` para forçar `postcss@8.5.12`.
3. Atualizado lockfile com `npm install`.
4. Reexecutado audit de produção (`npm audit --omit=dev --audit-level=moderate`) para validação.

## Arquivos alterados
- `package.json`
- `package-lock.json`

## Resultado
- Dependência transitiva alinhada para versão corrigida.
- `npm audit --omit=dev --audit-level=moderate` passou com `found 0 vulnerabilities`.

## Decisões arquiteturais
- Optamos por `overrides` para corrigir vulnerabilidade sem downgrade/upgrade breaking de framework.
- Mantido `next@16.2.4`, evitando regressão funcional por atualização forçada para versão incompatível.
