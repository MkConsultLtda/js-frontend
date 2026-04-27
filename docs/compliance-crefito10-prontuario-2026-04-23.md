# Conformidade regulatória (CREFITO / COFFITO) — prontuário e registros

> **Aviso legal:** este texto é **resumo informativo** para orientar o produto. O CREFITO-10 aplica a **fisioterapia na circunscrição** da 10.ª região; as **normas federais** (COFFITO) e leis nacionais prevalecem. **Não substitui** consulta às resoluções atualizadas, site oficial do CREFITO-10, COFFITO ou **assessoria jurídica** especializada.

## 1. Hierarquia normativa (referência)

- **Conselho Federal (COFFITO):** resoluções que disciplinam prontuário, guarda, descarte e atribuições do fisioterapeuta.
- **Conselho Regional (CREFITO-10):** fiscalização, orientações e publicações **regionais** (parâmetros assistenciais, notas técnicas, etc.).

> Consulte sempre: [https://crefito10.org.br](https://crefito10.org.br) e [https://coffito.gov.br](https://coffito.gov.br) (texto integral das resoluções).

## 2. Pontos recorrentes na doutrina e normas COFFITO (não exaustivo)

Com base na **Res. COFFITO 414/2012** (e correlatas) e materiais oficiais/cartilhas regionais, costumam ser exigidos, entre outros:

1. **Obrigatoriedade** de registro em prontuário dos atendimentos fisioterapêuticos.
2. **Conteúdo mínimo** (evolutivo com o tempo): identificação do paciente, histórico, exame, **diagnóstico/terminologia profissional** (atualmente há ênfase na **Classificação Brasileira de Diagnóstico Fisioterapêutico — CBDF**, **Res. COFFITO 555/2022**), plano, **evoluções** por atendimento/sessão com detalhamento e legibilidade.
3. **Data e, quando necessário, horário**; identificação do **profissional** (e **número de registro CREFITO** + assinatura/identificação **em meio eletrônico** conforme norma).
4. **Sigilo** e finalidades de uso; divulgação com base legal, **autorização** do titular ou justa causa.
5. **Guarda** mínima (texto clássico: **5 anos** após o último registro, com nuances — confirmar resolução vigente) e **descarte** com proteção de sigilo.
6. **Prontuário eletrônico:** identificação do profissional e registro no CREFITO após lançamento, conforme parágrafo da norma de prontuário eletrônico.

**Parâmetros assistenciais** (ex. lotação, duração de consulta) vêm de resoluções de parâmetros (série 387/444 etc.) e podem se aplicar conforme o **tipo de estabelecimento**; não confundir com o “miolo” mínimo do prontuário de **atendimento clínico individual**.

## 3. Lacunas comuns do sistema (mock) a endereçar

| Lacuna | Sugestão de adequação (produto) |
|--------|----------------------------------|
| Sem assinatura eletrônica/identificação formal por sessão | Campo e fluxo de “profissional responsável” e **identificação** alinhada à norma do prontuário eletrônico. |
| Evolução sem amarração a consulta (apenas data) | Opcional: vínculo a `appointmentId` e trilha de auditoria. |
| PDFs sem CREFITO do profissional | Puxar do **perfil** (tela “Meu perfil”) e incluir no rodapé/rodapé de relatório. |
| Retenção e exclusão de dados | Política operacional (LGPD + norma de guarda); não só “apagar do localStorage”. |
| Acesso do paciente ao prontuário | Fluxo de **exportação/Visualização** e registro de consentimentos, conforme advogado. |

## 4. Síntese

O CREFITO-10 reforça a **fiscalização** e publica materiais e parâmetros; o **conteúdo mínimo** e a **responsabilidade** sobre prontuário vêm, em grande medida, das **resoluções do COFFITO** (414/2012, 415/2012, 555/2022, etc. — **confirmar** atualizações).

**Ação:** time jurídico/Compliance valida; produto adiciona campos, assinaturas, logs e retenção **no backend** (requisitos de API em `api-requisitos-backend-2026-04-23.md`).
