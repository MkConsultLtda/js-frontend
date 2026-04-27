# Tema e paleta (placeholder)

> Tarefa de **prioridade baixa**: alteração de cor principal da aplicação. **Ainda sem cor definida** pelo stakeholder.

## Objetivo

- Centralizar **tokens** de cor (já hoje o projeto usa variáveis CSS com Tailwind v4: `app/globals.css` e classes `bg-primary`, `text-primary`, `sidebar` etc.).

Há comentário de referência no início do bloco `:root` em `app/globals.css` apontando para este arquivo.

## Quando a cor for definida

1. Ajustar em **`app/globals.css`** (ou o arquivo de tema ativo) as variáveis, por exemplo:
   - `--primary`, `--ring`, `sidebar` / `sidebar-accent` se forem reutilizados.
2. Garantir **contraste** mínimo WCAG 2.1 para texto (AA: 4,5:1 em corpo; 3:1 em títulos grandes, conforme o caso).
3. Fazer *smoke test* nas telas: **login**, **sidebar**, **botões** e gráficos do **dashboard** (barras com gradiente).

## Entrega sugerida

- Commit único: `chore(ui): ajusta paleta` + screenshot antes/depois na PR.

> Remover ou atualizar este placeholder quando a tarefa for concluída.
