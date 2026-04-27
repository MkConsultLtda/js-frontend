# FisioSystem (fisio-web)

Frontend web para gestão de clínica de fisioterapia: agenda, pacientes, anamnese, evolução e dashboard. **Estado atual:** interface funcional com dados de domínio ainda mockados em memória, mas com autenticação via **cookies HttpOnly** já preparada para backend.

## Stack

| Tecnologia | Uso |
|------------|-----|
| **Next.js 16** (App Router) | Rotas, layouts, SSR/CSR |
| **React 19** | UI |
| **TypeScript** | Tipagem |
| **Tailwind CSS 4** | Estilo |
| **Radix UI + componentes próprios** (`components/ui/*`) | Acessibilidade e padrão visual |
| **TanStack Query** | Já instalado em `app/providers.tsx`; preparado para cache e chamadas HTTP |
| **react-hook-form / zod** | **Pacientes**, **Agenda**, **Anamnese** e **Evolução** usam `@hookform/resolvers/zod`; schemas em `lib/schemas/` |

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Rotas principais após login simulado ou acesso direto:

| Rota | Descrição |
|------|-----------|
| `/` | Landing |
| `/login` | Login real via `POST /v1/auth/login` (proxy Next em `/api/auth/login`) |
| `/dashboard` | Painel com métricas e agenda do dia |
| `/agenda` | Calendário e CRUD de agendamentos |
| `/pacientes` | Lista e CRUD de pacientes |
| `/pacientes/[id]` | Prontuário resumido + atalhos para anamnese/evolução |
| `/anamnese` | CRUD de anamneses; `?pacienteId=` filtra por paciente |
| `/evolucao` | CRUD de evoluções; `?pacienteId=` filtra por paciente |
| `/perfil` | Dados do fisioterapeuta (registro, contato, foto) — local |
| `/configuracoes` | Clínica, duração/tipos de sessão, auditoria, reset do mock |

## O que já existe (funcional)

- **Agenda:** mês, seleção de dia, busca, filtro por status, criar/editar/excluir agendamento.
- **Pacientes:** busca, filtro ativo/inativo, cadastro/edição/exclusão, link para prontuário e para a agenda.
- **Anamnese e evolução:** registros por paciente, edição, filtro via URL a partir do prontuário.
- **Dashboard:** números do dia, gráfico da semana (seg–sáb), lista de hoje — todos alimentados pelo **mesmo estado mock** da agenda/pacientes.
- **Layout responsivo:** abaixo do breakpoint Tailwind `md`, a sidebar fica oculta; a barra superior traz o ícone de menu, que abre um **drawer** (fecha ao tocar fora, ao escolher um link ou com **Esc**). A partir de `md`, a sidebar fixa permanece como antes (`components/app-shell.tsx`, `components/sidebar-nav.tsx`, `lib/navigation.ts`).
- **Tipos centralizados:** `lib/types.ts`.
- **Seed único:** `lib/mock-seed.ts` (pacientes, agendamentos da semana, anamnese/evolução iniciais).

## Arquitetura de dados atual (mock)

O estado global em memória é fornecido por **`MockDataProvider`** (`components/mock-data-provider.tsx`), envolvendo o layout em `app/(app)/layout.tsx`.

- **Hook:** `useMockData()` — expõe listas (`patients`, `appointments`, `anamneses`, `evolucoes`) e funções (`addPatient`, `updateAppointment`, etc.).
- **Persistência:** nenhuma; ao recarregar a página, os dados voltam ao seed.
- **IDs:** gerados no cliente com `lib/id.ts` (`nextNumericId`).

Isso evita dados duplicados entre páginas e facilita trocar a implementação por chamadas HTTP mantendo a mesma “forma” de uso nas telas.

---

## Documentação (equipe e backend)

| Documento | Conteúdo |
|-----------|----------|
| [`docs/operacao/README.md`](docs/operacao/README.md) | **LOCAL / produção**: TODOs, variáveis, *deploy* barato (Vercel, GitHub Actions), PostgreSQL. |
| [`env.example`](env.example) | Modelo de variáveis (copiar para `.env.local`). |
| [`docs/api-requisitos-backend-2026-04-23.md`](docs/api-requisitos-backend-2026-04-23.md) | Rotas, convenções, **guia de criação do backend** (Spring, Postgres), **referências** e **prompts para colar na IA** ao iniciar o backend. |
| [`docs/seguranca-frontend-2026-04-23.md`](docs/seguranca-frontend-2026-04-23.md) | CORS, storage, cookies, LGPD (visão front). |
| [`docs/compliance-crefito10-prontuario-2026-04-23.md`](docs/compliance-crefito10-prontuario-2026-04-23.md) | Síntese regulatório-prontuário (não jurídico). |
| [`docs/auditoria-melhorias-frontend-2026-04-23.md`](docs/auditoria-melhorias-frontend-2026-04-23.md) | Matriz de melhorias (impacto / esforço). |
| [`docs/tema-cores-2026-04-23.md`](docs/tema-cores-2026-04-23.md) | Ajuste futuro de paleta (tokens em `app/globals.css`). |
| [`docs/TODO.md`](docs/TODO.md) | Backlog colaborativo. |

## Como migrar para APIs REST

A ideia é substituir gradualmente o **provider mock** por uma camada que chama o backend e, opcionalmente, usar **TanStack Query** para cache, loading e erro.

### 1. Contrato e ambiente

- **Fonte de requisitos detalhada:** [`docs/api-requisitos-backend-2026-04-23.md`](docs/api-requisitos-backend-2026-04-23.md) (também com instruções para o backend e prompts de IA).
- Definir **OpenAPI/Swagger** ou documento de endpoints alinhado ao backend.
- Criar `.env.local` (não commitar secrets):

  ```env
  NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/v1
  BACKEND_API_URL=http://localhost:8080/v1
  ```

- Implementar um **cliente HTTP** único (`lib/api/client.ts`), por exemplo `fetch` com:
  - `baseURL` da env;
  - headers (`Content-Type`, `Authorization` quando houver JWT);
  - tratamento centralizado de 401/403/5xx.

### 2. Camada de API

- Criar funções por domínio, por exemplo:
  - `lib/api/patients.ts` → `listPatients()`, `createPatient()`, …
  - `lib/api/appointments.ts`, `anamnese.ts`, `evolucao.ts`
- Mapear DTOs do backend para os tipos de `lib/types.ts` (ou renomear tipos para bater com o contrato real).

### 3. TanStack Query

- Para cada recurso, expor hooks do tipo:
  - `usePatientsQuery()` → `useQuery({ queryKey: ['patients'], queryFn: listPatients })`
  - `useCreatePatientMutation()` → `useMutation` + `invalidateQueries(['patients'])`
- **Substituir** o uso de `useMockData()` nas páginas por esses hooks.
- Remover ou reduzir `MockDataProvider` quando não for mais necessário.

### 4. Autenticação

- Substituir o login mock em `app/(auth)/login/page.tsx` por:
  - chamada ao endpoint de login;
  - armazenamento seguro do token (httpOnly cookie preferível se o backend suportar; caso contrário fluxo documentado com o time de backend);
  - **middleware** Next.js (`middleware.ts`) ou layout protegido redirecionando não autenticados para `/login`.

### 5. Server Components (opcional)

- Parte das listagens pode virar **Server Component** com `fetch` no servidor se o backend for acessível do ambiente Node e houver cookie de sessão. Hoje quase tudo é **Client Component** por causa de formulários e estado.

### 6. Limpeza

- Remover `mock-data-provider.tsx` e `mock-seed.ts` quando o fluxo estiver 100% na API.
- Manter `lib/types.ts` alinhado ao contrato real (ajustar campos como `registeredAt`, datas ISO, etc.).

---

## Melhorias técnicas recomendadas

| Área | Melhoria aplicável agora | Próximo passo recomendado |
|------|--------------------------|--------------------------|
| **Validação** | Padronizar schemas e mensagens com `zod` para `login` e futuras telas de `configurações`, mantendo vocabulário alinhado com a clínica. | Centralizar mensagens em `lib/validation-messages.ts` para reduzir duplicação e facilitar ajustes de texto. |
| **Testes** | Cobrir comportamento de utilitários e mapeadores (ex.: `lib/date-utils`, funções de transformação API -> domínio). | Adicionar testes de hooks críticos de dados/formulários antes da migração completa para API real. |
| **Acessibilidade** | Garantir foco inicial e retorno de foco em modal/drawer; associar erros de formulário com `aria-describedby`. | Incluir checklist de acessibilidade em PRs (teclado, contraste, feedback de erro, leitor de tela). |
| **Performance** | Aplicar lazy loading em rotas e componentes pouco usados (ex.: telas administrativas e blocos secundários). | Medir impacto com análise de bundle após novas bibliotecas e manter baseline de performance. |
| **Persistência offline (opcional)** | Manter fora do escopo inicial para evitar complexidade prematura no primeiro release com API. | Reavaliar somente se houver requisito claro de uso sem internet, priorizando sincronização simples. |
| **Observabilidade** | Preparar boundary de erro e estratégia mínima de captura para falhas de UI e chamadas HTTP. | Integrar monitoramento em produção (ex.: Sentry) com sanitização para evitar envio de dados sensíveis. |

---

## Funcionalidades ainda não implementadas (roadmap sugerido)

Priorize com a cliente; itens marcados com * são comuns em produtos similares.

- **Backend real:** todas as operações hoje só existem no browser.
- **Autenticação e perfis** (ex.: só a profissional acessa; futuro multi-profissional).
- **Prontuário completo:** documentos anexos, assinatura, histórico versionado de anamnese.
- **Financeiro** (mencionado na landing): sessões pagas, pendências, recibo/nota — depende de regras fiscais e negócio.
- **Lembretes:** e-mail/WhatsApp para pacientes — integrações externas.
- **Exportação:** PDF de evolução / relatório para médico.
- **Configurações persistidas:** salvar dados da clínica via API.
- **LGPD:** termos de consentimento, bases legais, retenção — alinhar com jurídico e backend.

---

## Scripts

```bash
npm run dev    # desenvolvimento
npm run build  # build de produção
npm run start  # servir build
npm run lint   # ESLint
```

---

## Estrutura de pastas (resumo)

```
app/
  (app)/           # área logada + MockDataProvider no layout
  (auth)/login/    # login
components/
  app-shell.tsx    # layout logado (sidebar desktop + drawer mobile)
  sidebar-nav.tsx  # itens de menu compartilhados
  mock-data-provider.tsx
  agenda/
  ui/
lib/
  navigation.ts    # links da sidebar (única fonte)
  schemas/         # zod: patient, appointment, anamnese, evolucao
  types.ts
  mock-seed.ts
  date-utils.ts
  constants.ts
  id.ts
```

---

## Manutenibilidade e escalabilidade

A separação entre **tipos** (`lib/types`), **seed** (`lib/mock-seed`) e **provedor** (`mock-data-provider`) reduz o custo de trocar mocks por HTTP: as telas dependem de um contrato estável (`useMockData` hoje; hooks de API amanhã). Manter os DTOs de API próximos dos tipos de domínio evita duplicação conceitual quando o backend Spring expuser recursos REST coerentes com paciente, agendamento, anamnese e evolução.

Se quiser evoluir este README com **contratos de endpoint** assim que o backend existir, basta acrescentar uma seção “API” com links para o Swagger e exemplos de payload.
