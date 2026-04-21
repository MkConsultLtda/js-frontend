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

- [ ] [prioridade: alta] [agenda] Exemplo: Validar conflito de horario na criacao/edicao
  - Contexto: evitar sobreposicoes sem aviso para a profissional.
  - Criterios de aceite:
    - exibir alerta quando houver conflito;
    - permitir salvar apenas com confirmacao explicita.
  - Observacoes: usar duracao configurada em `Configuracoes`.

- [ ] [prioridade: media] [dashboard] Exemplo: Alterar metrica de indicação para o dashboard
  - Contexto: Temos hoje, na aba de paciente, a métrica de "indicação", precisamos mover para o dashboard.
  - Criterios de aceite:
    - Métrica de indicação informando a quantidade de pacientes que veio de determinada indicação.
  - Observacoes:
  
- - [ ] [prioridade: media] [dashboard] Exemplo: Adicionar cores no dashboard
  - Contexto: facilitar visualização do dashboard e das métricas.
  - Criterios de aceite:
    - Dashboard com cores harmonicas facilitando a visualização do dashboard.
  - Observacoes:

- - [ ] [prioridade: alta] [agenda] Exemplo: Ajustar horarios
  - Contexto: Ao bloquear agenda, poder bloquear o dia inteiro ou adicionar hora inicio e hora fim, e para evento, poder colocar como se repete e informar os dias que se repetem.
  - Criterios de aceite:
    - Poder bloquear a agenda o dia inteiro;
    - Poder bloquear a agenda por um determinado horario;
    - Poder colocar um evento que se repete de segunda a sexta em determinado horario.
  - Observacoes:

- - [ ] [prioridade: baixa] [pacientes] Exemplo: Trocar a palavra Diágnostico no registro do paciente para Diágnostico Clínico.
  - Contexto: Trocar a palavra Diágnostico para Diágnostico Clínico.
  - Criterios de aceite:
    - A palavra correta.
  - Observacoes:

- - [ ] [prioridade: media] [evolução] Exemplo: Adicionar sinais vitais e filtro por paciente.
  - Contexto: Adicionar sinais vitais na evolução, no inicio da seção e ao fim da seção, adicionar filtro por paciente na aba de evolução.
  - Criterios de aceite:
    - Ao realizar a evolução, ter a opção de sinais vitais inicio e sinais vitais fim;
    - Conseguir na aba de evolução, filtrar por pacientes.
  - Observacoes:

- - [ ] [prioridade: alta] [anamnese] Exemplo: Bloco unico de texto.
  - Contexto: Ao criar uma anamnese, ter apenas as opções de selecionar o paciente e abaixo, um bloco de texto editável, com opções de negrito e etc.
  - Criterios de aceite:
    - Ao criar uma anamnese, eu seleciono o paciente e escrevo no bloco de texto a anamnese.
  - Observacoes: O bloco de texto tem que ser editável, poder selecionar negrito, italico, estilo de fonte e etc.

- - [ ] [prioridade: alta] [agenda] Exemplo: Direcionamento paciente.
  - Contexto: Adicionar link aos nomes, para que quando eu tiver na agenda, na aba atendimento do dia, onde tem o nome do paciente, eu clico e vou direto para o prontuário desse paciente.
  - Criterios de aceite:
    - Quando eu tiver na agenda, eu clico no nome do paciente e vou direto para o prontuário daquele paciente.
  - Observacoes:

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
