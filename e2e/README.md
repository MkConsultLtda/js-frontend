# E2E (Playwright)

## Fluxo agenda → evolução → status (API)

O cenário completo (criar evolução marca sessão `completed`, excluir última evolução reverte para `confirmed`) está coberto por teste de **integração Spring** com H2:

`msorquestrador-jf/src/test/java/com/mkdev/orquestrador_jf/application/EvolucaoAgendaCompletionIT.java`

Execute: `mvn test -Dtest=EvolucaoAgendaCompletionIT` no backend.

## Smoke HTTP opcional (Playwright)

Com API Spring acessível e um **access token** JWT válido:

```bash
set E2E_API_URL=http://localhost:8080
set E2E_ACCESS_TOKEN=eyJ...
npx playwright test
```

O arquivo `api-smoke.spec.ts` valida `GET /v1/appointments` quando as variáveis estão definidas; caso contrário os testes são ignorados (`skip`).

Instalação dos browsers (uma vez): `npx playwright install`
