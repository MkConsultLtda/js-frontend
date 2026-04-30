# TODO Colaborativo - Fisio Web

Este arquivo centraliza as tarefas para facilitar nosso fluxo em conjunto.

## Como usar

- Adicione tarefas novas em `Backlog`.
- Mova para `Em andamento` quando iniciar.
- Mova para `Concluído` ao finalizar.
- Se quiser, use tags como `[agenda]`, `[pacientes]`, `[config]`, `[ux]`.

## Modelo de tarefa

```md
- [ ] [prioridade: alta|media|baixa] [area] Titulo curto da tarefa
  - Contexto:
  - Criterios de aceite:
  - Observacoes:
```

---

## Backlog

- [ ] (adicione novas tarefas aqui)

## Em andamento

- [ ] (adicione aqui tarefas que estao sendo executadas agora)

## Bloqueado

- [ ] (adicione aqui tarefas com dependencia externa ou decisao pendente)

## Concluido

- [x] [prioridade: alta] [area] Endpoint para metricas do dash
  - Entrega: Backend `GET /v1/metrics/dashboard?from=&to=` (`DashboardMetricsController`, `DashboardMetricsService`, evoluções por clínica em `EvolutionJpaRepository`). Front: `fetchDashboardMetricsBundle` + `useDashboardBundle` passam a usar uma única chamada.
- [x] [prioridade: alta] [area] Funcionalidade menu lateral
  - Entrega: `AppShell` + `SidebarNav` com modo compacto (ícones), persistência `localStorage` (`fisio:sidebar-collapsed`); mobile mantém drawer com abrir/fechar.
- [x] [prioridade: alta] [area] Refresh do token
  - Entrega: `SessionKeepAlive` em `AppShell` — `POST /api/auth/refresh` a cada 10 min e ao voltar à aba (`visibilitychange`).
- [x] [prioridade: media] [area] Ajuste no visual do front
  - Entrega: `app/globals.css` com paleta Olivine / Periwinkle / Feldgrau / Burnt Sienna / Field Drab; dashboard com `text-chart-*` e gráficos alinhados à marca.
- [x] [prioridade: alta] [area] Analise arquivos repositorio.
  - Entrega: varredura no código (sem `.env` commitado; docs só com placeholders); `.gitignore` reforçado com `Thumbs.db` e `.idea/`.
- [x] [prioridade: alta] [area] Salva varias vezes o mesmo paciente.
  - Entrega: `pacientes/page.tsx` — guarda `isPending`, botões desabilitados e texto “Salvando…” em criar e editar.
- [x] [prioridade: alta] [seguranca] Endurecer CSP por rota (remover dependência de `'unsafe-inline'` quando possível)
  - Entrega:
    - `next.config.ts` com CSP por fonte (`/api/:path*` mais restrita e `/:path*` baseline).
    - `script-src` sem `'unsafe-eval'` em produção; mantido apenas fora de produção.
    - Build de produção validado com sucesso (`npm run build`) após ajuste.
- [x] [prioridade: media] [seguranca] Revisar alerta transitivo `next -> postcss` no `npm audit` e definir mitigação
  - Entrega:
    - Auditoria executada em `2026-04-29` e decisão técnica registrada.
    - Registro em `docs/operacao/configuracao-producao-integracao-back-front.md` com mitigação sem downgrade incompatível.
- [x] [prioridade: media] [qualidade] Ajustar warnings do perfil (`watch`/`<img>`) para reduzir ruído no CI
  - Entrega:
    - `app/(app)/perfil/page.tsx`: troca de `watch` por `useWatch`.
    - Substituição de `<img>` por `next/image` com `unoptimized` para preview local (`data URL`).
    - Lint validado sem warnings/erros (`npm run lint`).

- [x] Exemplo: criar documento base de TODO colaborativo
- [x] [prioridade: alta] [seguranca] Fluxo de troca de senha do fisioterapeuta (backend + frontend)
  - Entrega:
    - Backend com endpoint autenticado `PATCH /v1/auth/password` (contrato alinhado com front para `400/401/429`).
    - Frontend com alteração de senha em `/perfil` usando `/api/auth/password` e UX de sucesso/erro.
    - Regras de senha no front validadas por `changePasswordFormSchema`.
    - Teste de unidade no frontend: `lib/schemas/change-password-form.test.ts` (casos feliz, política, confirmação e reutilização).
- [x] [prioridade: alta] [agenda] Direcionamento paciente na agenda
  - Entrega: nome do paciente em "Atendimentos do dia" agora abre o prontuario.
- [x] [prioridade: baixa] [pacientes] Ajustar termo para "Diagnóstico clínico"
  - Entrega: label atualizado no formulario e no card de pacientes.
- [x] [prioridade: media] [dashboard] Mover metrica de indicação para o dashboard
  - Entrega: grafico de indicação removido de pacientes e adicionado no dashboard.
- [x] [prioridade: media] [dashboard] Adicionar cores harmonicas no dashboard
  - Entrega: grafico de indicação com barras em gradiente e reforço visual das métricas.
- [x] [prioridade: alta] [agenda] Validar conflito de horario na criacao/edicao
  - Entrega: ao detectar conflito, a agenda exibe confirmação explicita antes de salvar.
- [x] [prioridade: alta] [agenda] Ajustar horarios (bloqueio dia inteiro, periodo e repeticao)
  - Entrega: bloqueio/evento suporta dia inteiro, inicio/fim e repetição semanal por dias selecionados.
- [x] [prioridade: media] [evolução] Adicionar sinais vitais e filtro por paciente
  - Entrega: formulário de evolução com sinais vitais (início/fim) e novo filtro por paciente na listagem.
- [x] [prioridade: alta] [anamnese] Bloco unico de texto editável
  - Entrega: anamnese com seleção de paciente + editor único com negrito, itálico, sublinhado, lista e título.
- [x] [prioridade: media] [dashboard] Atualização de métricas e direcionamento
  - Entrega: dashboard com métricas de dia/semana/mês, meta financeira mensal e link para prontuário na lista de hoje.
- [x] [prioridade: alta] [evolução] Filtro por nome abaixo do título
  - Entrega: filtro movido abaixo do título da evolução e pesquisa por nome digitado.
- [x] [prioridade: media] [dashboard] Ajustes
  - Entrega: removidos os cards "Reavaliações sugeridas" e "Base ativa" do dashboard.
- [x] [prioridade: media] [Status] Regra para concluir atendimento
  - Entrega: status "Concluído" agora só pode ser salvo quando houver evolução do paciente na mesma data do atendimento.
- [x] [prioridade: media] [dashboard] Métricas mensais, semanais e diárias
  - Entrega: card "Resumo: hoje, semana e mês" com sessões, concluídas, canceladas, evoluções (data da sessão), recebido e a receber; helper `brDateToIsoDate` em date-utils.
- [x] [prioridade: media] [Geral] Anexos e relatórios PDF no prontuário
  - Entrega: anexos (PDF/imagem) no prontuário com persistência no mock; três PDFs (prontuário completo, só evolução, histórico de atendimentos).
- [x] [prioridade: media] [qualidade] Revisar aplicação e levantar pontos de melhoria
  - Entrega: `docs/auditoria-melhorias-frontend-2026-04-23.md` com matriz de melhorias (impacto, esforço, prioridade).
- [x] [prioridade: baixa] [ux] Paleta / tema (preparação)
  - Entrega: `docs/tema-cores-2026-04-23.md` com guia de onde ajustar tokens; cores finais a definir.
- [x] [prioridade: media] [seguranca] Revisão de segurança (front)
  - Entrega: `docs/seguranca-frontend-2026-04-23.md` (achados do mock, checklist, LGPD em alto nível).
- [x] [prioridade: media] [api] Documentação de APIs necessárias ao frontend
  - Entrega: `docs/api-requisitos-backend-2026-04-23.md` (recursos, métodos, erros, dependências).
- [x] [prioridade: media] [compliance] CREFITO-10 e prontuário
  - Entrega: `docs/compliance-crefito10-prontuario-2026-04-23.md` (síntese, referências oficiais, lacunas do sistema).
- [x] [prioridade: media] [perfil] Perfil do fisioterapeuta
  - Entrega: rota `/perfil`, `lib/user-profile.ts`, `lib/schemas/user-profile-form.ts`, sincronização de nome/telefone com `ClinicSettings`.
- [x] [prioridade: media] [qualidade] Tratamento de erros
  - Entrega: `docs/tratamento-erros-2026-04-23.md` + `app/(app)/error.tsx` (recuperação e log seguro no cliente).
