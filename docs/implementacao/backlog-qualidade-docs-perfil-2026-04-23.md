# Step-by-step — execução do backlog (documentação, perfil, erros)

## Objetivo

Cumprir as tarefas de backlog: auditoria, segurança, APIs, CREFITO, perfil, erros, e preparação de tema; com código mínimo onde necessário.

## Etapas

1. Documentos em `docs/*.md` (ver lista no `TODO.md` em Concluído).
2. Perfil: `lib/user-profile.ts` (localStorage + `useSyncExternalStore`), schema Zod, página `app/(app)/perfil/page.tsx`.
3. Navegação: `lib/navigation.ts` (item "Meu perfil"); `sidebar` rodapé aponta para `/perfil`.
4. Erros: `app/(app)/error.tsx` na área autenticada.
5. `docs/TODO.md` atualizado (backlog vazio, itens em Concluído).

## Arquivos-chave

- `app/(app)/perfil/page.tsx`
- `app/(app)/error.tsx`
- `lib/user-profile.ts`, `lib/schemas/user-profile-form.ts`
- `components/sidebar-nav.tsx`, `lib/navigation.ts`
- Documentação listada no `TODO.md` (entregas)

## Decisões

- Perfil unificado com nome/telefone exibidos no sidebar: ao salvar, atualiza `therapistName` e `therapistPhone` em `ClinicSettings`.
- Tarefa de cor final permanece “preparação” até definição de palette pelo stakeholder.
