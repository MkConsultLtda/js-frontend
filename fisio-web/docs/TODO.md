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

- - [ ] [prioridade: alta] [anamnese] Exemplo: Bloco unico de texto.
  - Contexto: Ao criar uma anamnese, ter apenas as opções de selecionar o paciente e abaixo, um bloco de texto editável, com opções de negrito e etc.
  - Criterios de aceite:
    - Ao criar uma anamnese, eu seleciono o paciente e escrevo no bloco de texto a anamnese.
  - Observacoes: O bloco de texto tem que ser editável, poder selecionar negrito, italico, estilo de fonte e etc.

- - [ ] [prioridade: media] [dashboard] Exemplo: Direcionamento paciente.
  - Contexto: Atualizar o dashboard com as métricas que a cliente pediu + o que a IA achar interessante de se ter...
  - Criterios de aceite:
    - Quando eu tiver na agenda, eu clico no nome do paciente e vou direto para o prontuário daquele paciente.
  - Observacoes: Solicitação da cliente: (DIA - Atendimentos / Valor recebido / Ag. de hoje / confirmações / Rota do dia / ocupação) (SEMANAL - Atendimentos (gráfico) / financeiro / cancelamento) (MENSAL - Financeiro (total em gráfico) / atendimentos concluídos media em gráfico / cancelamento (gráfico) / meta mensal financeira (porcentagem))

## Em andamento

- [ ] (adicione aqui tarefas que estao sendo executadas agora)

## Bloqueado

- [ ] (adicione aqui tarefas com dependencia externa ou decisao pendente)

## Concluido

- [x] Exemplo: criar documento base de TODO colaborativo
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
