# Segurança no frontend (Fisio Web)

> Documento de orientação para desenvolvimento. **Dados de saúde** exigem alinhamento com DPO, backend e contratos (LGPD, CFM/ANVISA/CFFITO conforme o caso). Não dispensa advogado ou auditoria formal.

## 1. Achados (estado atual — mock)

| Tema | Situação | Risco |
|------|----------|--------|
| Sessão | Cookie de sessão mock (`lib/auth-session`) + redirecionamento `/login` | Baixo (demo). Em produção: tokens curtos, HTTP-only, Secure, SameSite. |
| `localStorage` | Dados clínicos simulados (pacientes, agenda, anexos em base64) | **Alto** se idêntico em produção: acessível a XSS e extensões do navegador. |
| Segredos | Nenhum token real no repositório | OK |
| CORS/HTTPS | N/A no mock | Obrigatório HTTPS; CORS restrito à origem do front. |
| Anexos / PDF | Gerados e armazenados no cliente | Migra para bucket privado + URLs assinadas. |

## 2. Recomendações (checklist pré go-live com API)

- [ ] Não armazenar PII/PHI sensível em `localStorage` com app só cliente; preferir **sessão com backend** e cookies **HttpOnly**.
- [ ] **Content-Security-Policy** (CSP) para reduzir XSS; política de script segura.
- [ ] **Sanitização** de HTML exibido (anamnese) e validação de uploads no servidor.
- [ ] **Rate limiting** e proteção a brute force no login (backend).
- [ ] **Logs** sem CPF, token ou corpo de prontuário; correlacionar com `requestId`/`digest` de erro.
- [ ] **Cookies** de sessão: `Secure`, `SameSite=Strict` ou `Lax` conforme fluxo; rotation de refresh token.
- [ ] Revisar dependências (npm audit / Dependabot) periodicamente.

## 3. LGPD (visão geral, não exaustiva)

- Definir **bases legais** (tratamento, consentimento quando aplicável) e prazo de retenção alinhado à norma profissional (ex.: prontuário, COFFITO).
- Direitos do titular: acesso, correção, portabilidade, exclusão (onde permitido) — mapear **fluxos** na API.

## 4. Conclusão

O front atual é **intencionalmente** local para demonstração. A migração para produção exige arquitetura de confiança no servidor, transporte cifrado e políticas de acesso alinhadas ao conselho e à legislação vigente.
