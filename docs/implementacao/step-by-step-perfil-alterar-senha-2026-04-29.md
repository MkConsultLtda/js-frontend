# Step-by-step — perfil com alteração de senha (frontend)

## Objetivo
Executar a tarefa de backlog de troca de senha no frontend, integrada ao endpoint autenticado do backend.

## Etapas executadas
1. Criado schema de formulário com Zod:
   - `currentPassword`;
   - `newPassword` (política mínima);
   - `confirmNewPassword` (confirmação).
2. Criada rota BFF `PATCH /api/auth/password`:
   - lê cookies HttpOnly;
   - tenta refresh quando necessário;
   - encaminha para backend;
   - atualiza cookies com novo par de tokens retornado.
3. Atualizada página `/perfil`:
   - nova seção "Segurança da conta";
   - formulário de alteração de senha;
   - tratamento de mensagens para `400`, `401` e `429`.
4. Atualizada documentação operacional da integração para refletir disponibilidade da feature.

## Arquivos criados
- `lib/schemas/change-password-form.ts`
- `app/api/auth/password/route.ts`

## Arquivos alterados
- `app/(app)/perfil/page.tsx`
- `docs/operacao/configuracao-producao-integracao-back-front.md`

## Decisões de implementação
- Fluxo mantido em BFF para preservar tokens no servidor (cookies HttpOnly).
- Mensagens de erro no cliente sem exposição de detalhes sensíveis.
- Sem dependências novas; reutilizado padrão já adotado no projeto.
