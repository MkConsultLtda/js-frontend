# Step-by-step — doc de implementação front (integração + segurança)

## Objetivo
Atualizar a documentação de integração para suportar a implementação do frontend em produção com foco em autenticação, tratamento de erros, anexos e segurança operacional.

## Etapas executadas
1. Revisei a documentação existente em `docs/operacao/configuracao-producao-integracao-back-front.md`.
2. Levantei no backend o estado real de:
   - troca de senha do fisioterapeuta;
   - proteção de autenticação e dados em trânsito;
   - estratégia de storage para anexos.
3. Atualizei a documentação principal com:
   - guia prático de implementação do front (auth + refresh + tratamento de 429);
   - matriz de erros HTTP para UX no frontend;
   - status do rate limit de login (backend atual + recomendação de WAF/gateway);
   - respostas diretas às perguntas de senha, criptografia/transporte e anexos.

## Arquivo alterado
- `docs/operacao/configuracao-producao-integracao-back-front.md`
  - acrescentadas seções `9` e `10` com orientação de implementação e segurança.

## Decisões arquiteturais/documentais
- Manter a doc principal de integração como fonte única para back+front em produção.
- Documentar explicitamente o comportamento esperado para `401` e `429` no frontend.
- Registrar que troca de senha ainda não está disponível por API para evitar requisito implícito.
- Recomendar storage S3-compatible de baixo custo com presigned URL como baseline atual.

## Próximos passos sugeridos
1. Criar endpoint de troca de senha (`PATCH /v1/auth/password`) no backend.
2. Implementar tela/fluxo de troca de senha no front após contrato da API.
3. Definir proteção de borda (WAF/CDN) para brute-force distribuído no login.
