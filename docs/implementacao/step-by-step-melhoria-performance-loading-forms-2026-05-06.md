# Step-by-step — melhoria de performance, loading e schemas (2026-05-06)

## Objetivo
Aplicar melhorias práticas encontradas na auditoria de performance frontend:
- reduzir refetch desnecessário,
- melhorar feedback visual de loading/erro,
- fortalecer validação de formulário (data/hora/duração),
- manter consistência de formato de data na UI.

## Etapas executadas
1. **Configuração global de cache/query**
   - Arquivo: `app/providers.tsx`
   - Ajuste:
     - `QueryClient` com `defaultOptions.queries`:
       - `refetchOnWindowFocus: false`
       - `retry: 1`
       - `staleTime: 30_000`
   - Motivo:
     - reduzir refetch automático em troca de abas/janela.

2. **Ajuste de staleTime da agenda**
   - Arquivo: `lib/api/hooks/use-fisio.ts`
   - Ajuste:
     - `useAppointmentRange` de `10_000` para `30_000`.
   - Motivo:
     - diminuir tráfego/re-render em navegação frequente mantendo invalidação por mutações.

3. **Loading e erro amigável na Agenda**
   - Arquivo: `app/(app)/agenda/page.tsx`
   - Ajuste:
     - leitura de `isLoading/error` para pacientes, agenda e evoluções agregadas;
     - mensagens visuais de “Carregando agenda…” e erro de carregamento.
   - Motivo:
     - evitar tela “vazia” sem contexto quando APIs ainda não responderam ou falham.

4. **Feedback de mutação na Agenda**
   - Arquivo: `app/(app)/agenda/page.tsx`
   - Ajuste:
     - botões de criar/adicionar/salvar agora desabilitam durante mutação;
     - rótulos dinâmicos: `Criando…`, `Adicionando…`, `Salvando…`.
   - Motivo:
     - reduzir dupla submissão e melhorar percepção de resposta.

5. **Feedback de mutação e carregamento em Evolução/Anamnese**
   - Arquivos:
     - `app/(app)/evolucao/page.tsx`
     - `app/(app)/anamnese/page.tsx`
   - Ajuste:
     - estados de loading/erro para queries;
     - botão de submit com disabled + rótulo `Salvando…` durante mutação.
   - Motivo:
     - consistência de UX entre módulos clínicos.

6. **Fortalecimento dos schemas de formulário**
   - Arquivos:
     - `lib/schemas/appointment-form.ts`
     - `lib/schemas/calendar-extra-form.ts`
   - Ajuste:
     - validação de formato ISO em datas (`AAAA-MM-DD`);
     - validação HH:mm em horários;
     - validação de duração inteira positiva;
     - mensagens mais claras para status inválido.
   - Motivo:
     - reduzir payload inválido para API e erros de preenchimento.

7. **Consistência BR na exibição de data**
   - Arquivo: `app/(app)/pacientes/[id]/page.tsx`
   - Ajuste:
     - próximos agendamentos exibem data em `pt-BR` (`formatIsoDateToBR`).
   - Motivo:
     - evitar mistura visual ISO x BR na mesma tela.

## Validação
- Lints dos arquivos alterados executados via ferramenta da IDE.
- Resultado: sem erros.

## Impacto esperado
- Menos refetch involuntário e menor consumo de rede em navegação comum.
- UX mais previsível com estados explícitos de carregamento/erro.
- Menor chance de requisições duplicadas por clique repetido.
- Dados de entrada mais válidos e mensagens mais claras para usuária final.
