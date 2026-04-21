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

- [ ] [prioridade: media] [dashboard] Métricas mensais, semanais e diarias.
  - Contexto: Baseado no que existe no sistema e em como a cliente trabalha, crie métricas no dashboard para que facilite a vida da minha cliente, como por exemplo, atendimentos realizados na semana, realizados no mes e etc. Com seu conhecimento, enriqueça as métricas que temos atualmente.
  - Criterios de aceite: Ter métrias uteis para minha cliente, tanto no seu dia a dia quanto quando ela olhar semanalmente e mensalmente.
  - Observacoes:

- [ ] [prioridade: media] [Geral] Opção de anexos e geração de relátorios
  - Contexto: Ter a opção de adicionar anexos no prontuário do paciente e também ter a opção de gerar PDFs de prontuários, evolução, histórico de atendimento.
  - Criterios de aceite: No prontuário do meu paciente, eu consigo adicionar anexos e também gerar relátorios (PDF) de seu histórico de atendimento, prontuário e evolução.
  - Observacoes:

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
