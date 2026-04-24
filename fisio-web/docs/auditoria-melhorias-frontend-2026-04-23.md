# Auditoria de melhorias — Fisio Web (frontend)

**Escopo:** revisão orientada a produto (mock local, sem API). **Prioridade:** P0 = crítico, P1 = alto, P2 = médio, P3 = baixo. **Esforço:** S/M/L.

| ID | Área | Melhoria | P | Esforço | Notas |
|----|------|----------|---|---------|--------|
| M1 | Dados | Substituir mock por API com cache (TanStack Query) e estados de loading/erro por tela. | P1 | L | Já existe `@tanstack/react-query` no projeto. |
| M2 | Auth | Sessão real (JWT/refresh) + rota protegida server-side. | P1 | L | Hoje: cookie de sessão mock. |
| M3 | A11y | Revisar contraste, foco visível, `aria-*` em calendário e listas. | P2 | M | Inclui testes com leitor de tela. |
| M4 | Performance | `dynamic()` para editor (TipTap) e PDF; revisar tamanho de bundle. | P2 | M | |
| M5 | UX | Estados vazios e skeletons unificados (pacientes, agenda, evolução). | P2 | S | |
| M6 | Testes | Testes de comportamento (Vitest + Testing Library) em utilitários e formulários. | P2 | L | `vitest` já no projeto. |
| M7 | i18n | Centralizar textos (pt-BR) para futura tradução. | P3 | L | |
| M8 | Monorepo/CI | Lint + typecheck + build no pipeline. | P1 | S | |
| M9 | LGPD | Política de retenção, base legal e DPO no produto; trilha de acesso a dados. | P1 | L | Com backend e jurídico. |

**Itens técnicos já atendidos parcialmente:** `error.tsx` na área autenticada, documentação de erros e segurança (ver outros arquivos em `docs/`), tela de perfil local.

**Próximo passo sugerido:** P1 (API + auth) alinhado ao documento `api-requisitos-backend-2026-04-23.md`.
