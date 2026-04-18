# FisioSystem (fisio-web)

Frontend web para gestão de clínica de fisioterapia: agenda, pacientes, anamnese, evolução e dashboard. **Estado atual:** interface funcional com **dados mockados em memória** (sem backend). O objetivo é evoluir para consumo de **APIs REST** (ex.: Spring Boot + PostgreSQL).

## Stack

| Tecnologia | Uso |
|------------|-----|
| **Next.js 16** (App Router) | Rotas, layouts, SSR/CSR |
| **React 19** | UI |
| **TypeScript** | Tipagem |
| **Tailwind CSS 4** | Estilo |
| **Radix UI + componentes próprios** (`components/ui/*`) | Acessibilidade e padrão visual |
| **TanStack Query** | Já instalado em `app/providers.tsx`; preparado para cache e chamadas HTTP |
| **react-hook-form / zod** | Dependências presentes; formulários ainda podem ser padronizados com validação |

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Rotas principais após login simulado ou acesso direto:

| Rota | Descrição |
|------|-----------|
| `/` | Landing |
| `/login` | Login mock (qualquer e-mail/senha preenchidos redirecionam) |
| `/dashboard` | Painel com métricas e agenda do dia |
| `/agenda` | Calendário e CRUD de agendamentos |
| `/pacientes` | Lista e CRUD de pacientes |
| `/pacientes/[id]` | Prontuário resumido + atalhos para anamnese/evolução |
| `/anamnese` | CRUD de anamneses; `?pacienteId=` filtra por paciente |
| `/evolucao` | CRUD de evoluções; `?pacienteId=` filtra por paciente |
| `/configuracoes` | Placeholder (clínica, notificações, privacidade) |

## O que já existe (funcional)

- **Agenda:** mês, seleção de dia, busca, filtro por status, criar/editar/excluir agendamento.
- **Pacientes:** busca, filtro ativo/inativo, cadastro/edição/exclusão, link para prontuário e para a agenda.
- **Anamnese e evolução:** registros por paciente, edição, filtro via URL a partir do prontuário.
- **Dashboard:** números do dia, gráfico da semana (seg–sáb), lista de hoje — todos alimentados pelo **mesmo estado mock** da agenda/pacientes.
- **Layout:** sidebar com navegação; área logada em `app/(app)/layout.tsx`.
- **Tipos centralizados:** `lib/types.ts`.
- **Seed único:** `lib/mock-seed.ts` (pacientes, agendamentos da semana, anamnese/evolução iniciais).

## Arquitetura de dados atual (mock)

O estado global em memória é fornecido por **`MockDataProvider`** (`components/mock-data-provider.tsx`), envolvendo o layout em `app/(app)/layout.tsx`.

- **Hook:** `useMockData()` — expõe listas (`patients`, `appointments`, `anamneses`, `evolucoes`) e funções (`addPatient`, `updateAppointment`, etc.).
- **Persistência:** nenhuma; ao recarregar a página, os dados voltam ao seed.
- **IDs:** gerados no cliente com `lib/id.ts` (`nextNumericId`).

Isso evita dados duplicados entre páginas e facilita trocar a implementação por chamadas HTTP mantendo a mesma “forma” de uso nas telas.

---

## Como migrar para APIs REST

A ideia é substituir gradualmente o **provider mock** por uma camada que chama o backend e, opcionalmente, usar **TanStack Query** para cache, loading e erro.

### 1. Contrato e ambiente

- Definir **OpenAPI/Swagger** ou documento de endpoints alinhado ao backend.
- Criar `.env.local` (não commitar secrets):

  ```env
  NEXT_PUBLIC_API_BASE_URL=https://api.exemplo.com
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

| Área | Sugestão |
|------|----------|
| **Validação** | Usar **zod** + **react-hook-form** nos formulários críticos (agenda, paciente, anamnese/evolução). |
| **Testes** | Testes de comportamento em hooks e utilitários (`lib/date-utils`, mapeadores de API). |
| **Acessibilidade** | Revisar foco em modais e mensagens de erro de validação. |
| **Performance** | Lazy load de rotas pouco usadas; revisar bundle após adicionar bibliotecas. |
| **Persistência offline (opcional)** | IndexedDB ou sync apenas se a cliente precisar; não é obrigatório para o primeiro release com API. |
| **Observabilidade** | Logging de erros no cliente (ex.: Sentry) após produção. |

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
  mock-data-provider.tsx
  agenda/          # formulário reutilizável da agenda
  ui/              # componentes base
lib/
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
