# Correção — sessão expirando indevidamente (28/05/2026)

## Sintoma

Após algum tempo de uso, a sessão era marcada como expirada e a usuária deslogada,
mesmo sem inatividade real.

## Causa raiz

O backend usa **rotação de refresh token**: cada `/auth/refresh` incrementa o
`tokenVersion` e invalida o token usado (`AuthService.refresh` → `rotateTokenVersion`).

O frontend dispara refresh de **várias fontes concorrentes** com o mesmo token:
`SessionKeepAlive` (a cada 7 min + a cada foco de aba), refresh proativo do proxy,
retry reativo em 401 do proxy, retry do `backendJson` e `/api/auth/me`.

O mutex anterior (`withRefreshMutex`) era um `Map` em memória, que **não serializa
entre instâncias serverless da Vercel**. Logo, um refresh duplicado/concorrente com o
token já rotacionado recebia **401**, e os handlers de falha **apagavam os cookies** —
derrubando uma sessão válida (efeito "sessão expirada" depois de um tempo, comum com
múltiplas abas).

A correção no frontend não bastava: a autoridade da rotação está no backend
(instância única), que é o lugar correto para serializar/tolerar concorrência.

## Alterações

### Backend (correção principal — `msorquestrador-jf`)

| Arquivo | Função |
|---------|--------|
| `application/support/RefreshTokenReuseCache.java` | **Novo.** Single-flight + janela de tolerância (30s). Concorrentes com o mesmo refresh token recebem o MESMO par emitido, sem rotacionar de novo. |
| `application/AuthService.java` | `refresh()` agora delega ao cache (`getOrIssue`); rotação isolada em `rotateAndIssue()`. |
| `application/.../AuthServiceSessionSecurityTest.java` | Novo teste: refresh duplicado dentro da janela devolve o mesmo par e rotaciona **uma única vez**. |
| `AuthServiceUpdateProfileTest` / `AuthServicePasswordChangeTest` | Atualizado o construtor de `AuthService` com a nova dependência. |

Segurança preservada: logout e troca de senha continuam incrementando `tokenVersion` e
gerando tokens novos (nunca presentes no cache); a janela é curta (30s).

### Frontend (defesa em profundidade — `js-frontend`)

| Arquivo | Função |
|---------|--------|
| `app/api/auth/refresh/route.ts` | Falha de refresh **proativo** não apaga mais os cookies. Logout autoritativo permanece em `/api/auth/me` e no proxy reativo (401 de requisição real). |
| `components/session-keep-alive.tsx` | Debounce de 60s entre renovações (evita disparos concorrentes ao trocar de abas). Removido o evento de "expiração" que não tinha consumidor. |

## Deploy

1. Subir o backend (`msorquestrador-jf`) — contém a correção principal.
2. Subir o frontend (`js-frontend`).

## Análise

A solução move a serialização para a camada que realmente tem autoridade e roda em
instância única (backend), tornando o refresh **idempotente** dentro de uma janela
curta — padrão recomendado de "reuse leeway" para rotação de refresh token. Isso
elimina a classe inteira de corridas, inclusive quando o BFF na Vercel escala em
múltiplas instâncias. É mais simples e mais robusto do que tentar coordenar estado
entre instâncias serverless.

Manutenibilidade: o cache é um componente pequeno, isolado e testável, sem acoplar
`AuthService` a detalhes de infraestrutura. Possíveis melhorias futuras: tornar a
janela/TTL configurável via `application.yml` e, caso o backend passe a escalar
horizontalmente, mover o cache para um store compartilhado (ex.: Redis) — hoje
desnecessário para o porte atual da clínica.
