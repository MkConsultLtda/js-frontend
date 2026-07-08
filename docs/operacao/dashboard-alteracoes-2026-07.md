# Alterações do Dashboard — Release 2026-07

Documento para análise do que mudou no painel principal em relação à versão anterior (layout monolítico em uma única página).

## Estrutura: antes vs depois

| Antes (aprox.) | Depois |
|----------------|--------|
| Cards e listas misturados em um único bloco | **5 zonas**: **Agora**, **Atenção**, **Indicações**, **Semana**, **Mês** |
| Sem estado de carregamento dedicado | **Skeleton** (`DashboardSkeleton`) enquanto carrega |
| Erros silenciosos ou página vazia | Banners de **erro** e **dados desatualizados** com botão "Tentar novamente" |
| Métricas financeiras só por contagem × preço fixo | Valor recebido usa **valor da sessão** quando cadastrado (`sessionAmount`) |

## Zona **Agora** (`dashboard-zone-agora.tsx`)

**Adicionado / mantido:**
- Cards: atendimentos hoje (sessões ativas), valor recebido no dia, pacientes ativos, próximo paciente
- **Operação do dia:** confirmados, agendados, cancelados e **ocupação da agenda** (meta = `maxSessionsPerDay`, padrão 8)
- Lista da agenda de hoje com horário e status
- Rota do dia (mapa / sequência de endereços)
- Aviso quando o dia não é dia útil configurado

**Removido / movido:**
- Conteúdo que estava misturado no topo foi **segmentado**; itens de “atenção” e “mês” saíram desta zona

## Zona **Atenção** (`dashboard-zone-atencao.tsx`)

**Adicionado:**
- Aniversariantes da semana (próximos 7 dias)
- Alertas de **faltas frequentes** (no-show alto por paciente)
- Card de **inadimplência / a receber** (métricas `receivableToday`, `receivableWeek`)

**Removido da zona Agora:**
- Aniversários e alertas deixaram de competir com “hoje” no mesmo viewport

## Zona **Indicações** (`dashboard-zone-indicacoes.tsx`)

**Adicionado:**
- Gráfico de barras (CSS) com origem dos **pacientes ativos** (`referralSource`)
- Destaque do principal canal de captação
- Lógica em `lib/referral-stats.ts`

## Zona **Semana** (`dashboard-zone-semana.tsx`)

**Adicionado:**
- Gráfico de barras por dia útil da semana (ocupação)
- Resumo: recebido na semana, concluídos, cancelados, evoluções na semana

## Zona **Mês** (`dashboard-zone-mes.tsx`)

**Adicionado:**
- Accordion no mobile (expansível); aberto por padrão no desktop
- Meta mensal de faturamento (`monthlyRevenueGoal`) com percentual
- Buckets semanais do mês (recebido / concluído / cancelado)
- Integração com **`GET /v1/reports/financial`** (relatório financeiro do backend)
- Tratamento de erro ao carregar relatório + retry

**Correções de métricas (em `lib/dashboard-metrics.ts`):**
- `registeredAt`: aceita ISO e BR para “novos pacientes no mês”
- `no_show` **não** conta mais como cancelado
- Janela de dados do bundle alinhada (evita N+1 excessivo quando o endpoint agregado existe)

## O que **não** está no dashboard (roadmap documentado)

- Evoluções pendentes (sessão sem evolução)
- Gráfico financeiro de 6 meses (existe módulo `/financeiro` separado)
- Edição rápida de sessão a partir do dashboard

~~Gráfico de indicação~~ — **reimplementado** na zona Indicações (jul/2026).

## Arquivos principais

| Arquivo | Papel |
|---------|--------|
| `components/dashboard/dashboard-page-content.tsx` | Orquestra zonas e queries |
| `lib/dashboard-metrics.ts` | Cálculo de KPIs |
| `lib/api/hooks/use-fisio.ts` | `useDashboardBundle` (pacientes + agenda + evoluções) |
| `components/dashboard/dashboard-zone-*.tsx` | UI de cada zona |

## Para validar na sua análise

1. Login → `/dashboard` — conferir se as 5 zonas aparecem
2. Marcar sessão paga na agenda com valor cadastrado → “Valor recebido (dia)” deve refletir o valor real
3. Sessão concluída e não paga → aparece como inadimplente na agenda; inadimplência no financeiro usa sessões **concluídas/falta** pendentes
4. Se o backend em produção estiver desatualizado, o bundle pode falhar — ver `docs/operacao/auditoria-producao-2026-07-02.md`
