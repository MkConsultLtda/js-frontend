# Step-by-step — documento de API (guia backend + IA) e melhorias no front

## Objetivo

- Enriquecer `docs/api-requisitos-backend-2026-04-23.md` com guia de criação do backend, referências oficiais e **prompts** reutilizáveis para o assistente de IA ao iniciar o backend.
- Aplicar melhorias de front e docs que **não** dependem de API.

## Alterações

### API (documento)

- Índice; convenções (paginação, idempotência); guia: stack, hexágono, multi-tenant, arquivos, ordem de implementação, checklist, changelog.
- Seção **Referências** (OpenAPI, Spring, LGPD, COFFITO, CREFITO-10, docs internos).
- Seção **Prompts para IA** (A–G): bootstrap, pacientes, agenda, anamnese/evolução, anexos, OpenAPI+client, plano de integração com o front.

### Front (sem backend)

- `app/not-found.tsx` — 404 com links para início, dashboard e agenda.
- `next.config.ts` — headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (CSP deixada para proxy/CDN).
- `app/globals.css` — comentário de referência ao guia de tema.
- `README.md` — tabela de documentação, rota `/perfil`, ponte para o guia de API.

### Ajustes em documentos existentes

- `auditoria-*.md`, `seguranca-*.md`, `tratamento-erros-*.md`, `tema-cores-*.md`, `compliance-*.md` — referências e status atualizados.

## Arquivos tocados (principais)

- `docs/api-requisitos-backend-2026-04-23.md` (reescrito / expandido)
- `app/not-found.tsx`, `next.config.ts`, `app/globals.css`, `README.md`
- Vários arquivos em `docs/*.md` (cruzes e parágrafos)
