#!/usr/bin/env python3
"""Gera o Relatório de Auditoria de Segurança (A4, pt-BR)."""

from __future__ import annotations

import io
from collections import Counter
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    CondPageBreak,
    Frame,
    HRFlowable,
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)

HERE = Path(__file__).resolve().parent
OUT_PDF = HERE / "relatorio-auditoria-seguranca.pdf"
CHART_DIR = HERE / "_charts"
PREVIEW_DIR = HERE / "_preview"

PALETTE = {
    "critica": "#B91C1C",
    "alta": "#EA580C",
    "media": "#D97706",
    "baixa": "#2563EB",
    "informativa": "#64748B",
    "forte": "#059669",
    "ink": "#1F2937",
    "muted": "#4B5563",
    "rule": "#D1D5DB",
    "paper": "#F8FAF7",
    "cover": "#1B3A36",
    "cover2": "#2D5A4A",
    "chip_bg": "#F3F4F6",
}

PROJECT = "Super Sistema Julli Severina"
REPORT_TITLE = f"Relatório de Auditoria de Segurança — {PROJECT}"
AUDIT_DATE = "18 de setembro de 2026"

FINDINGS = [
    {
        "id": "F-01",
        "cat": "1. Banco sem tranca",
        "sev": "media",
        "file": "msorquestrador-jf/.../ClinicSettingsRepositoryAdapter.java:32–33",
        "files": [
            "msorquestrador-jf/src/main/java/com/mkdev/orquestrador_jf/adapters/out/persistence/ClinicSettingsRepositoryAdapter.java:32–33",
            "msorquestrador-jf/src/main/java/com/mkdev/orquestrador_jf/application/PublicClinicService.java:16–29",
            "msorquestrador-jf/src/main/java/com/mkdev/orquestrador_jf/adapters/in/web/api/PublicClinicController.java:23–26",
        ],
        "title": "Endpoint público escolhe clínica arbitrária",
        "desc": "GET /v1/public/clinic-profile (sem autenticação) usa findAll().findFirst() e expõe CNPJ, endereço, e-mail/telefone, DPO e Crefito da primeira clínica que o JPA devolver.",
        "why": "Com mais de uma clínica no mesmo banco, um visitante anônimo lê dados institucionais de um tenant indefinido. A ordem de findAll() não é estável.",
        "cond": "Explorável quando houver ≥2 linhas em clinic. Documentado como MVP single-tenant.",
        "snippet": "public Optional<ClinicSettings> findDefault() {\n    return clinics.findAll().stream().findFirst().map(this::toDomain);\n}",
    },
    {
        "id": "F-02",
        "cat": "1. Banco sem tranca",
        "sev": "media",
        "file": "msorquestrador-jf/.../V27__tenant_rls_policies.sql:81–87",
        "files": [
            "msorquestrador-jf/src/main/resources/db/migration/V27__tenant_rls_policies.sql:1–3 e 81–87",
            "msorquestrador-jf/src/main/java/com/mkdev/orquestrador_jf/config/TenantAwareDataSource.java:45–46",
            "msorquestrador-jf/src/main/java/com/mkdev/orquestrador_jf/adapters/in/web/security/JwtAuthenticationFilter.java:41–50, 55–66",
        ],
        "title": "RLS libera todas as linhas quando app.clinic_id está vazio",
        "desc": "A policy tenant_select permite ALL se current_setting('app.clinic_id') for nulo/vazio. Pedidos públicos não preenchem ClinicTenantContext; o datasource grava string vazia.",
        "why": "Qualquer caminho JDBC sem JWT (hoje o perfil público; amanhã um job ou endpoint novo) vê e pode escrever em todas as tabelas tenant. F-01 é a prova concreta.",
        "cond": "Postgres de produção com V27 aplicada. H2/test desliga o set_config.",
        "snippet": "USING (\n    NULLIF(current_setting('app.clinic_id', true), '') IS NULL\n    OR clinic_id::text = current_setting('app.clinic_id', true)\n)",
    },
    {
        "id": "F-03",
        "cat": "1. Banco sem tranca",
        "sev": "baixa",
        "file": "msorquestrador-jf/.../JwtAuthenticationFilter.java:87–96",
        "files": [
            "msorquestrador-jf/src/main/java/com/mkdev/orquestrador_jf/adapters/in/web/security/JwtAuthenticationFilter.java:87–96",
        ],
        "title": "JWT não revalida clinic_id nem role contra o banco",
        "desc": "O filtro confirma userId + tokenVersion, mas monta FisioPrincipal e ClinicTenantContext com clinic_id e role do access token, não do AppUser.",
        "why": "Um access token emitido antes de uma mudança manual de clínica/papel continua válido até expirar (15 min). Refresh já relê o banco.",
        "cond": "Alteração de clinic_id/role no DB sem incrementar tokenVersion + access token ainda válido. Não há API admin para essa mudança.",
        "snippet": "var principal = new FisioPrincipal(p.userId(), p.email(), p.clinicId(), p.role());\nClinicTenantContext.set(p.clinicId());  // claims do JWT",
    },
    {
        "id": "F-04",
        "cat": "4. Chaves expostas",
        "sev": "alta",
        "file": "msorquestrador-jf/.../JwtTokenService.java:51–57",
        "files": [
            "msorquestrador-jf/src/main/java/com/mkdev/orquestrador_jf/adapters/out/security/JwtTokenService.java:51–57",
            "msorquestrador-jf/src/main/resources/application-dev.yml:24–26",
            "msorquestrador-jf/src/main/resources/application-local.yml:13–15",
        ],
        "title": "Segredo JWT de desenvolvimento hardcoded",
        "desc": "Se JWT_SECRET estiver vazio e allow-insecure-empty-secret=true (perfis local/dev/docker), a API assina tokens com fisio-dev-jwt-secret-key-v1-abc12.",
        "why": "Quem conhece a string (está no git desde o primeiro commit do backend) forja access tokens de qualquer usuário/clínica.",
        "cond": "Perfil local, dev ou docker exposto sem JWT_SECRET. Produção rejeita secret vazio (application-prod.yml:63).",
        "snippet": "if (!props.isAllowInsecureEmptySecret()) { throw ...; }\nbytes = \"fisio-dev-jwt-secret-key-v1-abc12\".getBytes(...);",
    },
    {
        "id": "F-05",
        "cat": "4. Chaves expostas",
        "sev": "alta",
        "file": "msorquestrador-jf/.../CpfCryptoService.java:152–159",
        "files": [
            "msorquestrador-jf/src/main/java/com/mkdev/orquestrador_jf/application/security/CpfCryptoService.java:148–159",
        ],
        "title": "Chave AES de CPF derivada do mesmo fallback JWT",
        "desc": "Em não-prod, sem FISIO_CPF_ENCRYPTION_KEY e com allow-insecure-empty-secret, a chave AES-256/HMAC do CPF é SHA-256 do JWT secret ou do fallback público.",
        "why": "CPF cifrado no banco vira reversível com uma constante do repositório.",
        "cond": "Mesmos perfis de F-04. Em prod a chave é obrigatória.",
        "snippet": "String seed = StringUtils.hasText(jwtSecret) ? jwtSecret\n    : \"fisio-dev-jwt-secret-key-v1-abc12\";\nreturn sha256(seed.getBytes(StandardCharsets.UTF_8));",
    },
    {
        "id": "F-06",
        "cat": "4. Chaves expostas",
        "sev": "alta",
        "file": "msorquestrador-jf/.../FisioDevDataLoader.java:30,40–52",
        "files": [
            "msorquestrador-jf/src/main/java/com/mkdev/orquestrador_jf/config/FisioDevDataLoader.java:30, 40–44, 52",
        ],
        "title": "Senha admin de seed pública no código",
        "desc": "Perfis dev/docker criam ADMIN admin@clinica.local / Trocar@2026!dev quando app_user está vazio e FISIO_DEV_ADMIN_PASSWORD não foi definido.",
        "why": "Login privilegiado com credencial documentada no git e no env.example.",
        "cond": "SPRING_PROFILES_ACTIVE=dev|docker, banco sem usuários, endpoint de login alcançável.",
        "snippet": "@Profile({ \"dev\", \"docker\" })\n@Value(\"${FISIO_DEV_ADMIN_PASSWORD:}\")\nString pass = (...isBlank()) ? \"Trocar@2026!dev\" : devPassword;",
    },
    {
        "id": "F-07",
        "cat": "4. Chaves expostas",
        "sev": "media",
        "file": "msorquestrador-jf/docker-compose.yml:8,24–25",
        "files": [
            "msorquestrador-jf/docker-compose.yml:8, 24–25",
        ],
        "title": "Defaults ${VAR:-teste0101} no Docker Compose",
        "desc": "Postgres e MinIO sobem com POSTGRES_PASSWORD/MINIO_ROOT_PASSWORD=teste0101 e MINIO_ROOT_USER=minio se o .env não sobrescrever. Portas 5432/9000/9001 são publicadas no host.",
        "why": "Credencial conhecida + bind em 0.0.0.0 típico do Docker Desktop = acesso ao banco e ao object storage na LAN.",
        "cond": "compose sem override, host alcançável na rede.",
        "snippet": "POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-teste0101}\nMINIO_ROOT_USER: ${MINIO_ROOT_USER:-minio}\nMINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-teste0101}",
    },
    {
        "id": "F-08",
        "cat": "4. Chaves expostas",
        "sev": "media",
        "file": "msorquestrador-jf/src/main/resources/application-dev.yml:6,32–33",
        "files": [
            "msorquestrador-jf/src/main/resources/application-dev.yml:6, 32–33",
            "msorquestrador-jf/src/main/resources/application-local.yml:8, 21–22",
        ],
        "title": "Senha de banco e S3 com default no YAML de desenvolvimento",
        "desc": "DATABASE_PASSWORD:teste0101 e S3_SECRET_KEY:teste0101 / S3_ACCESS_KEY:minio nos perfis local, dev e docker.",
        "why": "A API autentica no Postgres/MinIO com segredo público se as env não existirem.",
        "cond": "Perfil não-prod sem variáveis de ambiente. application-prod.yml exige DATABASE_* sem fallback.",
        "snippet": "password: ${DATABASE_PASSWORD:teste0101}\naccess-key: ${S3_ACCESS_KEY:minio}\nsecret-key: ${S3_SECRET_KEY:teste0101}",
    },
    {
        "id": "F-09",
        "cat": "4. Chaves expostas",
        "sev": "baixa",
        "file": "msorquestrador-jf/.../FisioStorageProperties.java:31–32",
        "files": [
            "msorquestrador-jf/src/main/java/com/mkdev/orquestrador_jf/config/FisioStorageProperties.java:31–32",
        ],
        "title": "Fallback Java minio/minio123 diferente do YAML",
        "desc": "Campos default da classe: accessKey=minio, secretKey=minio123. O YAML de dev usa teste0101; o YAML base usa string vazia.",
        "why": "Se o binding YAML falhar, a app tenta MinIO com outra senha conhecida no bytecode.",
        "cond": "Caminho raro (sem bind de fisio.storage.secret-key). Inconsistência minio123 vs teste0101.",
        "snippet": "private String accessKey = \"minio\";\nprivate String secretKey = \"minio123\";",
    },
    {
        "id": "F-10",
        "cat": "4. Chaves expostas",
        "sev": "informativa",
        "file": "msorquestrador-jf/src/main/resources/application.yml:115–120",
        "files": [
            "msorquestrador-jf/src/main/resources/application.yml:115–120",
        ],
        "title": "Segredos do perfil test commitados",
        "desc": "cpf-encryption-key Base64 fixa e jwt.secret=test-symmetric-key-32-chars-v1!! no bloco on-profile: test (H2).",
        "why": "Só carrega com spring.profiles.active=test. Não é produção, mas é segredo previsível no git.",
        "cond": "Apenas testes automatizados.",
        "snippet": "cpf-encryption-key: YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=\njwt:\n  secret: \"test-symmetric-key-32-chars-v1!!\"",
    },
]

STRENGTHS = [
    (
        "Isolamento autenticado em três camadas",
        "Tenant vem só do JWT (não de header). Controllers passam ClinicId.of(p.getClinicId()). "
        "JPQL filtra clinic.id (ex.: PatientJpaRepository:16–17, AppointmentJpaRepository:37–39). "
        "RLS FORCE nas tabelas tenant quando app.clinic_id está preenchido.",
    ),
    (
        "IDOR: 15 controllers / 52 handlers sem falha",
        "Todo GET/PUT/PATCH/DELETE por id (pacientes, agenda, anamnese, evolução, anexos, financeiro) "
        "usa findActiveById(..., clinicId) ou equivalente. Rotas Next.js de PDF delegam ao backend. "
        "Auth /me e /password usam p.getUserId().",
    ),
    (
        "Permissão de escrita institucional no servidor",
        "ClinicSettingsController:43 e :53 — @PreAuthorize(\"hasRole('ADMIN')\"). "
        "O frontend não esconde a tela (navigation.ts:19–28), mas o backend recusa THERAPIST com 403. "
        "Não há gate de role no browser — a categoria «permissão só no navegador» não se aplica como falha.",
    ),
    (
        "Produção recusa JWT/CPF vazios",
        "application-prod.yml:63 allow-insecure-empty-secret: false. JwtTokenService:46–48 e "
        "CpfCryptoService:148–150 abortam o boot. scripts/security/check_config_safety.sh no CI.",
    ),
    (
        "XSS tratado nas duas pontas",
        "Único dangerouslySetInnerHTML (anamnese/page.tsx:327) passa por DOMPurify (L48–50, 55, 75). "
        "Backend: OwaspAnamneseHtmlSanitizer + AnamneseService:124 e EvolucaoService:193–200. "
        "PDF usa esc() / htmlToPlainText. Sem eval/new Function. Sem e-mail HTML.",
    ),
    (
        "Sessão e superfície de API",
        "Cookies HttpOnly + SameSite=lax (login/route.ts:90–100). CSP/HSTS em next.config.ts. "
        "Swagger desligado em prod. CORS rejeita '*'. Sem .env commitado; frontend só expõe URLs NEXT_PUBLIC_*.",
    ),
]

WEAKNESSES = [
    "Defaults de desenvolvimento (JWT, admin, Postgres, MinIO) são segredos reais se um perfil local/dev/docker for publicado.",
    "O endpoint público e a policy RLS fail-open não estão prontos para multi-tenant no mesmo banco.",
    "Access token carrega clinic_id/role sem revalidação; mudanças manuais no DB só pegam no refresh.",
    "O frontend mostra Configurações a todos: THERAPIST vê o formulário e toma 403 ao salvar (UX, não bypass).",
]


def register_fonts() -> tuple[str, str, str]:
    windir = Path(r"C:\Windows\Fonts")
    regular = windir / "calibri.ttf"
    bold = windir / "calibrib.ttf"
    italic = windir / "calibrii.ttf"
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("Body", str(regular)))
        pdfmetrics.registerFont(TTFont("Body-Bold", str(bold)))
        if italic.exists():
            pdfmetrics.registerFont(TTFont("Body-Italic", str(italic)))
        else:
            pdfmetrics.registerFont(TTFont("Body-Italic", str(regular)))
        return "Body", "Body-Bold", "Body-Italic"
    return "Helvetica", "Helvetica-Bold", "Helvetica-Oblique"


FONT, FONT_B, FONT_I = register_fonts()


def styles():
    base = getSampleStyleSheet()
    s = {
        "cover_kicker": ParagraphStyle(
            "cover_kicker",
            fontName=FONT_B,
            fontSize=10,
            textColor=colors.HexColor("#0F766E"),
            alignment=TA_LEFT,
            leading=13,
        ),
        "cover_title": ParagraphStyle(
            "cover_title",
            fontName=FONT_B,
            fontSize=22,
            textColor=colors.HexColor(PALETTE["cover"]),
            leading=28,
            alignment=TA_LEFT,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            fontName=FONT,
            fontSize=10.5,
            textColor=colors.HexColor(PALETTE["ink"]),
            leading=15,
            spaceAfter=4,
        ),
        "h1": ParagraphStyle("h1", fontName=FONT_B, fontSize=16, textColor=colors.HexColor(PALETTE["cover"]), leading=20, spaceAfter=8, spaceBefore=4),
        "h2": ParagraphStyle("h2", fontName=FONT_B, fontSize=13, textColor=colors.HexColor(PALETTE["cover2"]), leading=17, spaceBefore=10, spaceAfter=6),
        "h3": ParagraphStyle("h3", fontName=FONT_B, fontSize=11, textColor=colors.HexColor(PALETTE["ink"]), leading=14, spaceBefore=8, spaceAfter=4),
        "body": ParagraphStyle("body", fontName=FONT, fontSize=10, textColor=colors.HexColor(PALETTE["ink"]), leading=14, alignment=TA_JUSTIFY, spaceAfter=6),
        "body_left": ParagraphStyle("body_left", fontName=FONT, fontSize=10, textColor=colors.HexColor(PALETTE["ink"]), leading=14, alignment=TA_LEFT, spaceAfter=5),
        "small": ParagraphStyle("small", fontName=FONT, fontSize=8.5, textColor=colors.HexColor(PALETTE["muted"]), leading=12, alignment=TA_LEFT),
        "cell": ParagraphStyle("cell", fontName=FONT, fontSize=8, textColor=colors.HexColor(PALETTE["ink"]), leading=11),
        "cell_b": ParagraphStyle("cell_b", fontName=FONT_B, fontSize=8, textColor=colors.HexColor(PALETTE["ink"]), leading=11),
        "chip": ParagraphStyle("chip", fontName=FONT_B, fontSize=8, textColor=colors.white, alignment=TA_CENTER, leading=11),
        "code": ParagraphStyle("code", fontName="Courier", fontSize=7.5, textColor=colors.HexColor("#111827"), leading=10, backColor=colors.HexColor("#F3F4F6")),
        "issue": ParagraphStyle("issue", fontName="Courier", fontSize=7.4, textColor=colors.HexColor("#111827"), leading=10),
        "footer": ParagraphStyle("footer", fontName=FONT, fontSize=8, textColor=colors.HexColor(PALETTE["muted"]), alignment=TA_CENTER),
        "kpi": ParagraphStyle("kpi", fontName=FONT_B, fontSize=18, textColor=colors.HexColor(PALETTE["cover"]), alignment=TA_CENTER, leading=22),
        "kpi_l": ParagraphStyle("kpi_l", fontName=FONT, fontSize=8, textColor=colors.HexColor(PALETTE["muted"]), alignment=TA_CENTER, leading=11),
        "list": ParagraphStyle("list", fontName=FONT, fontSize=10, textColor=colors.HexColor(PALETTE["ink"]), leading=13),
    }
    s["base"] = base["Normal"]
    return s


S = styles()


def sev_label(sev: str) -> str:
    return {
        "critica": "Crítica",
        "alta": "Alta",
        "media": "Média",
        "baixa": "Baixa",
        "informativa": "Informativa",
    }[sev]


def hex_color(sev: str) -> colors.Color:
    return colors.HexColor(PALETTE[sev])


def chip_flowable(sev: str) -> Table:
    label = sev_label(sev).upper()
    t = Table([[Paragraph(label, S["chip"])]], colWidths=[2.4 * cm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), hex_color(sev)),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("ROUNDEDCORNERS", [3, 3, 3, 3]),
            ]
        )
    )
    return t


def draw_header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(colors.HexColor(PALETTE["cover"]))
    canvas.rect(0, h - 1.15 * cm, w, 1.15 * cm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont(FONT, 8)
    canvas.drawString(2 * cm, h - 0.72 * cm, REPORT_TITLE)
    canvas.setFillColor(colors.HexColor(PALETTE["rule"]))
    canvas.rect(0, 0, w, 1.1 * cm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor(PALETTE["muted"]))
    canvas.setFont(FONT, 8)
    canvas.drawString(2 * cm, 0.45 * cm, AUDIT_DATE)
    canvas.drawRightString(w - 2 * cm, 0.45 * cm, f"Página {doc.page}")
    canvas.restoreState()


def draw_cover_page(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(colors.HexColor("#F8FAF7"))
    canvas.rect(0, 0, w, h, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor(PALETTE["cover"]))
    canvas.rect(0, 0, 0.7 * cm, h, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor(PALETTE["cover"]))
    canvas.rect(0, h - 2.4 * cm, w, 2.4 * cm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont(FONT, 9)
    canvas.drawString(2 * cm, h - 1.4 * cm, "AUDITORIA ESTÁTICA  ·  CINCO CATEGORIAS")
    canvas.setFillColor(colors.HexColor(PALETTE["muted"]))
    canvas.setFont(FONT, 9)
    canvas.drawString(2 * cm, 1.3 * cm, "Confidencial — uso interno da equipe de desenvolvimento")
    canvas.restoreState()


def make_donut(counts: dict[str, int], dest: Path) -> Path:
    labels = []
    sizes = []
    cols = []
    order = ["critica", "alta", "media", "baixa", "informativa"]
    for k in order:
        if counts.get(k, 0):
            labels.append(f"{sev_label(k)} ({counts[k]})")
            sizes.append(counts[k])
            cols.append(PALETTE[k])
    fig, ax = plt.subplots(figsize=(4.4, 3.3), dpi=160)
    wedges, *_ = ax.pie(
        sizes,
        colors=cols,
        startangle=90,
        wedgeprops=dict(width=0.46, edgecolor="white", linewidth=2),
    )
    ax.legend(wedges, labels, loc="center left", bbox_to_anchor=(0.92, 0.5), frameon=False, fontsize=8)
    ax.set_title("Achados por severidade", fontsize=11, fontweight="bold", color=PALETTE["ink"])
    fig.patch.set_facecolor("white")
    fig.tight_layout()
    dest.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(dest, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    return dest


def make_bars(by_cat: dict[str, int], dest: Path) -> Path:
    labels = list(by_cat.keys())
    values = list(by_cat.values())
    fig, ax = plt.subplots(figsize=(5.6, 3.3), dpi=160)
    bar_colors = [PALETTE["forte"] if v == 0 else PALETTE["media"] if v < 3 else PALETTE["alta"] for v in values]
    ax.barh(labels, values, color=bar_colors, height=0.55)
    ax.set_xlabel("Quantidade de achados", fontsize=8)
    ax.set_title("Achados por categoria", fontsize=11, fontweight="bold", color=PALETTE["ink"])
    ax.set_xlim(0, max(values + [1]) + 1.5)
    for i, v in enumerate(values):
        ax.text(v + 0.12, i, str(v), va="center", fontsize=8, color=PALETTE["ink"])
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    fig.patch.set_facecolor("white")
    fig.tight_layout()
    dest.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(dest, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    return dest


def kpi_box(value: str, label: str, accent: str) -> Table:
    inner = Table(
        [[Paragraph(value, S["kpi"])], [Paragraph(label, S["kpi_l"])]],
        colWidths=[3.15 * cm],
    )
    inner.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F0FDF4")),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor(accent)),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    return inner


def code_box(text: str) -> Table:
    pre = Preformatted(text, S["code"])
    t = Table([[pre]], colWidths=[16.8 * cm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F3F4F6")),
                ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#D1D5DB")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return t


def soft_path(path: str) -> str:
    return escape_xml(path).replace("/", "/&#8203;").replace(".", "&#8203;.")


def wrap_pre(text: str, width: int = 86) -> str:
    out: list[str] = []
    for line in text.splitlines():
        if len(line) <= width:
            out.append(line if line else " ")
            continue
        indent = len(line) - len(line.lstrip(" "))
        prefix = " " * min(indent, 8)
        rest = line.strip()
        chunk = width - len(prefix)
        first = True
        while rest:
            take = rest[:chunk]
            out.append((prefix if not first else line[:indent]) + take)
            rest = rest[chunk:]
            first = False
    return "\n".join(out)


def finding_card(f: dict) -> KeepTogether:
    files = "<br/>".join(f"• {soft_path(p)}" for p in f["files"])
    bits = [
        Paragraph(f"{f['id']}  ·  {f['title']}", S["h3"]),
        chip_flowable(f["sev"]),
        Spacer(1, 4),
        Paragraph(f"<b>Arquivos</b><br/>{files}", S["small"]),
        Paragraph(f"<b>Descrição.</b> {escape_xml(f['desc'])}", S["body_left"]),
        Paragraph(f"<b>Por que é explorável.</b> {escape_xml(f['why'])}", S["body_left"]),
        Paragraph(f"<b>Condição.</b> {escape_xml(f['cond'])}", S["small"]),
        Spacer(1, 3),
        code_box(wrap_pre(f["snippet"], 92)),
        Spacer(1, 8),
    ]
    return KeepTogether(bits)


def escape_xml(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def findings_table(story):
    header = [
        Paragraph("<b>Sev.</b>", S["cell_b"]),
        Paragraph("<b>Arquivo:linha</b>", S["cell_b"]),
        Paragraph("<b>Descrição</b>", S["cell_b"]),
    ]
    data = [header]
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(PALETTE["cover"])),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), FONT_B),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor(PALETTE["rule"])),
    ]
    # header cells need white text
    header_white = ParagraphStyle("hw", parent=S["cell_b"], textColor=colors.white)
    data[0] = [
        Paragraph("<b>Sev.</b>", header_white),
        Paragraph("<b>Arquivo:linha</b>", header_white),
        Paragraph("<b>Descrição</b>", header_white),
    ]
    for i, f in enumerate(FINDINGS, start=1):
        data.append(
            [
                chip_flowable(f["sev"]),
                Paragraph(soft_path(f["file"]), S["cell"]),
                Paragraph(f"<b>{escape_xml(f['id'])}</b> — {escape_xml(f['title'])}. {escape_xml(f['desc'])}", S["cell"]),
            ]
        )
        bg = colors.HexColor("#F9FAFB") if i % 2 == 0 else colors.white
        style_cmds.append(("BACKGROUND", (0, i), (-1, i), bg))
    t = Table(data, colWidths=[2.6 * cm, 5.4 * cm, 8.8 * cm], repeatRows=1)
    t.setStyle(TableStyle(style_cmds))
    story.append(t)


ISSUES = [
    {
        "n": 1,
        "title": "[Segurança] Endpoint público escolhe clínica arbitrária e RLS libera tudo sem contexto",
        "labels": "security, severity:medium",
        "body": """## Problema
`GET /v1/public/clinic-profile` (sem autenticação) carrega a «clínica padrão» com `findAll().findFirst()`. Em paralelo, a policy RLS `tenant_select` permite **todas** as linhas quando `app.clinic_id` está vazio — exatamente o estado das conexões JDBC sem JWT.

## Por que é explorável
Com duas ou mais clínicas no mesmo Postgres, um visitante anônimo recebe CNPJ, endereço, contato, DPO e Crefito de um tenant indefinido. Qualquer código futuro que consulte tabelas tenant sem `ClinicTenantContext` herda acesso total no banco.

## Evidência
```java
// ClinicSettingsRepositoryAdapter.java:32–33
public Optional<ClinicSettings> findDefault() {
    return clinics.findAll().stream().findFirst().map(this::toDomain);
}
```

```sql
-- V27__tenant_rls_policies.sql:81–87
USING (
    NULLIF(current_setting('app.clinic_id', true), '') IS NULL
    OR clinic_id::text = current_setting('app.clinic_id', true)
)
```

`PublicClinicController.java:23–26` e `PublicClinicService.java:16–29`. `JwtAuthenticationFilter` não seta contexto em `/v1/public/**`.

## Impacto
Vazamento de dados institucionais cross-tenant; defesa em profundidade do RLS inútil em paths públicos.

## Sugestão de correção
1. Trocar `findDefault()` por um seletor explícito (slug/host/`PUBLIC_CLINIC_ID`) ou 404 se houver ≠1 clínica.
2. Fail-closed no RLS quando `app.clinic_id` estiver vazio, exceto roles de migração (Flyway).
3. Não consultar tabelas tenant em requests sem `ClinicTenantContext`.

## Critérios de aceite
- [ ] Com 2 clínicas no banco, `GET /v1/public/clinic-profile` não devolve a clínica «errada» (slug explícito ou 404).
- [ ] Policy RLS de produção **nega** SELECT em `patient`/`clinic` quando `app.clinic_id` está vazio (testado com role da aplicação, não superuser).
- [ ] Teste de integração cobre o endpoint público com 0, 1 e N clínicas.
""",
    },
    {
        "n": 2,
        "title": "[Segurança] JWT de acesso não revalida clínica nem papel contra o banco",
        "labels": "security, severity:low",
        "body": """## Problema
`JwtAuthenticationFilter` valida `userId` e `tokenVersion`, mas monta `FisioPrincipal` e `ClinicTenantContext` com `clinic_id` e `role` do access token.

## Por que é explorável
Se alguém alterar `app_user.clinic_id` ou `role` no banco **sem** incrementar `tokenVersion`, o access token vigente (TTL 15 min) continua a operar na clínica/papel antigos. O refresh (`AuthService.rotateAndIssue`) já relê o banco — o furo é só a janela do access token. Hoje não existe API admin para essa mudança.

## Evidência
```java
// JwtAuthenticationFilter.java:87–96
var user = users.findById(p.userId());
if (user.isEmpty() || user.get().getTokenVersion() != p.tokenVersion()) { ... }
var principal = new FisioPrincipal(p.userId(), p.email(), p.clinicId(), p.role());
ClinicTenantContext.set(p.clinicId());
```

## Impacto
Acesso residual à clínica antiga ou a `@PreAuthorize("hasRole('ADMIN')")` após downgrade, até o access token expirar.

## Sugestão de correção
Comparar `user.get().getClinic().getId()` e `user.get().getRole()` com os claims. Em divergência: 401 **ou** incrementar `tokenVersion` em qualquer UPDATE de clínica/papel.

## Critérios de aceite
- [ ] Teste: usuário com token de clínica A, `clinic_id` no DB trocado para B sem bump de versão → 401 (ou contexto B, se a decisão for «sempre DB»).
- [ ] Teste: ADMIN rebaixado a THERAPIST no DB → PUT `/v1/clinic/settings` recusado no access token vigente.
- [ ] Qualquer mutação futura de role/clínica incrementa `tokenVersion`.
""",
    },
    {
        "n": 3,
        "title": "[Segurança] Segredo JWT e chave de CPF de desenvolvimento hardcoded",
        "labels": "security, severity:high",
        "body": """## Problema
Com `JWT_SECRET` vazio e `fisio.jwt.allow-insecure-empty-secret=true` (perfis `local`/`dev`/`docker`), a API assina JWT com `fisio-dev-jwt-secret-key-v1-abc12` e deriva a chave AES do CPF do mesmo fallback.

## Por que é explorável
A string está no git desde o primeiro commit do backend. Quem alcança uma instância nesses perfis forja tokens de qualquer usuário e, sem `FISIO_CPF_ENCRYPTION_KEY`, descriptografa CPFs.

## Evidência
```java
// JwtTokenService.java:51–57
bytes = "fisio-dev-jwt-secret-key-v1-abc12".getBytes(...);
```

```java
// CpfCryptoService.java:157–159
String seed = StringUtils.hasText(jwtSecret) ? jwtSecret : "fisio-dev-jwt-secret-key-v1-abc12";
return sha256(seed.getBytes(StandardCharsets.UTF_8));
```

`application-dev.yml:24–26` e `application-local.yml:13–15` ligam `allow-insecure-empty-secret: true`.

## Impacto
Comprometimento total da autenticação e de PII (CPF) no ambiente afetado.

## Sugestão de correção
1. Remover o literal do código; exigir `JWT_SECRET` ≥32 bytes em **todos** os perfis (gerar no README com `openssl rand -base64 48`).
2. Exigir `FISIO_CPF_ENCRYPTION_KEY` também em não-prod, ou recusar boot.
3. Fail-closed no startup se o secret for igual ao literal histórico (lista de defaults proibidos).
4. Rotacionar qualquer JWT/CPF usado em ambiente compartilhado que tenha rodado com o fallback.

## Critérios de aceite
- [ ] Grep no `src/main` não encontra `fisio-dev-jwt-secret-key-v1-abc12`.
- [ ] Boot com `JWT_SECRET` vazio falha em local/dev/docker (não só em prod).
- [ ] Boot com `FISIO_CPF_ENCRYPTION_KEY` vazio falha em não-prod, ou a derivação a partir do JWT é removida.
- [ ] Teste de startup cobre o default proibido.
""",
    },
    {
        "n": 4,
        "title": "[Segurança] Credenciais padrão de desenvolvimento (admin seed, Postgres, MinIO)",
        "labels": "security, severity:high",
        "body": """## Problema
Vários defaults públicos viram credenciais reais se o override de ambiente faltar:

- FisioDevDataLoader.java:52 (perfis dev/docker, BD vazia): admin@clinica.local / Trocar@2026!dev
- docker-compose.yml:8,24-25: teste0101 (Postgres e MinIO), user MinIO minio
- application-dev.yml:6,32-33 e application-local.yml:8,21-22: mesma senha de banco/S3
- FisioStorageProperties.java:31-32: minio / minio123 (fallback Java, inconsistente com o YAML)

## Por que é explorável
Compose publica 5432/9000/9001. Uma API `dev`/`docker` com banco vazio cria um ADMIN conhecido. A senha está no `env.example` e no histórico git (`bcb8b2b`).

## Evidência
```java
@Profile({ "dev", "docker" })
String pass = (devPassword == null || devPassword.isBlank()) ? "Trocar@2026!dev" : devPassword;
```

```yaml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-teste0101}
MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-teste0101}
password: ${DATABASE_PASSWORD:teste0101}
```

## Impacto
Acesso administrativo à aplicação, ao Postgres (dados clínicos) e ao bucket de anexos.

## Sugestão de correção
1. Seed: falhar se `FISIO_DEV_ADMIN_PASSWORD` estiver vazio; não embutir senha no bytecode.
2. Compose: remover `:-teste0101`; exigir `.env` (Compose `required` ou script de check).
3. YAML local/dev: sem default de senha, só `${DATABASE_PASSWORD}` / `${S3_SECRET_KEY}`.
4. Apagar defaults `minio123` da classe Java.
5. Documentar geração de senhas no README; `env.example` com placeholders `CHANGE_ME`.

## Critérios de aceite
- [ ] Grep em `src/main` e `docker-compose.yml` não encontra `Trocar@2026!dev`, `teste0101`, `minio123`.
- [ ] `docker compose up` sem `.env` **falha** na falta de `POSTGRES_PASSWORD`.
- [ ] Perfil `dev` sem `FISIO_DEV_ADMIN_PASSWORD` não cria usuário (ou aborta o boot).
- [ ] `application-prod.yml` continua sem fallbacks (já está correto).
""",
    },
]


def issue_markdown(issue: dict) -> str:
    return (
        f"--- ISSUE {issue['n']} ---\n\n"
        f"# {issue['title']}\n\n"
        f"**Labels sugeridas:** `{issue['labels']}`\n\n"
        f"{issue['body'].strip()}\n\n"
        f"--- FIM ISSUE {issue['n']} ---\n"
    )


def issue_block(issue: dict):
    lines = []
    for raw in issue_markdown(issue).splitlines():
        if raw.strip() == "":
            lines.append(Spacer(1, 3))
            continue
        lines.append(Paragraph(escape_xml(raw), S["issue"]))
    inner = lines
    box = Table([[inner]], colWidths=[16.8 * cm])
    box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#94A3B8")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return [
        Paragraph(f"Issue {issue['n']}: {escape_xml(issue['title'])}", S["h3"]),
        box,
        Spacer(1, 10),
    ]


def build_story(donut: Path, bars: Path):
    story = []
    # Cover content sits on dark page — use white text styles already on canvas;
    # platypus still needs flowables in the frame.
    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph("RELATÓRIO CONFIDENCIAL", S["cover_kicker"]))
    story.append(Spacer(1, 0.25 * cm))
    story.append(Paragraph("Relatório de Auditoria de Segurança", S["cover_title"]))
    story.append(Spacer(1, 0.08 * cm))
    story.append(Paragraph(PROJECT, S["cover_title"]))
    story.append(Spacer(1, 0.45 * cm))
    story.append(Paragraph(f"<b>Data:</b> {AUDIT_DATE}", S["cover_sub"]))
    story.append(Paragraph(
        "<b>Repositórios:</b> js-frontend (Next.js 16 / React 19) e "
        "msorquestrador-jf (Spring Boot / JPA / JWT)",
        S["cover_sub"],
    ))
    story.append(Paragraph(
        "<b>Escopo:</b> isolamento de tenant, autorização de papel, IDOR em todos os handlers, "
        "segredos hardcoded e XSS.",
        S["cover_sub"],
    ))
    story.append(Spacer(1, 0.45 * cm))
    story.append(
        Paragraph(
            "<b>Nota metodológica.</b> A stack não é Supabase no runtime da API: o isolamento "
            "é <b>JWT → ClinicId no service/JPQL → RLS Postgres</b> via "
            "<font face='Courier'>set_config('app.clinic_id')</font>. "
            "«Permissão no navegador» foi cruzada com <font face='Courier'>@PreAuthorize</font> e com a ausência de gates "
            "<font face='Courier'>isAdmin</font> no frontend. IDOR percorreu os 15 controllers REST (52 handlers) "
            "e as 9 rotas Next.js. Segredos incluem YAML, Compose, classes Java, "
            "<font face='Courier'>env.example</font> e <font face='Courier'>git log -S</font>. "
            "XSS cobriu <font face='Courier'>dangerouslySetInnerHTML</font>, TipTap, PDFs e sanitizers OWASP/DOMPurify. "
            "Só entram achados verificados no código.",
            S["cover_sub"],
        )
    )
    story.append(NextPageTemplate("body"))
    story.append(PageBreak())

    # Resumo
    story.append(Paragraph("1. Resumo executivo", S["h1"]))
    story.append(
        Paragraph(
            "Foram confirmados <b>10 achados</b> (0 crítica, 3 alta, 4 média, 2 baixa, 1 informativa). "
            "As categorias «permissão definida no navegador», «IDOR» e «XSS» foram auditadas por completo "
            "e <b>não produziram falhas exploráveis</b>. O risco central está nos defaults de desenvolvimento "
            "e no endpoint público / RLS fail-open — não no CRUD autenticado.",
            S["body"],
        )
    )

    sev_counts = Counter(f["sev"] for f in FINDINGS)
    kpis = Table(
        [[
            kpi_box(str(len(FINDINGS)), "Achados totais", PALETTE["cover"]),
            kpi_box(str(sev_counts["alta"]), "Alta", PALETTE["alta"]),
            kpi_box(str(sev_counts["media"]), "Média", PALETTE["media"]),
            kpi_box(str(sev_counts["baixa"] + sev_counts["informativa"]), "Baixa + info", PALETTE["baixa"]),
            kpi_box("0", "IDOR / XSS", PALETTE["forte"]),
        ]],
        colWidths=[3.36 * cm] * 5,
    )
    kpis.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 2), ("RIGHTPADDING", (0, 0), (-1, -1), 2)]))
    story.append(kpis)
    story.append(Spacer(1, 0.45 * cm))

    charts = Table(
        [[Image(str(donut), width=8.0 * cm, height=5.5 * cm), Image(str(bars), width=8.6 * cm, height=5.5 * cm)]],
        colWidths=[8.4 * cm, 8.6 * cm],
    )
    charts.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    story.append(charts)

    story.append(Paragraph("2. Pontos fortes e pontos fracos", S["h1"]))
    story.append(Paragraph("O que está protegido", S["h2"]))
    for title, body in STRENGTHS:
        story.append(Paragraph(f"<font color='{PALETTE['forte']}'><b>●</b></font>  <b>{escape_xml(title)}.</b> {escape_xml(body)}", S["body_left"]))
    story.append(Paragraph("Riscos centrais", S["h2"]))
    for w in WEAKNESSES:
        story.append(Paragraph(f"<font color='{PALETTE['alta']}'><b>●</b></font>  {escape_xml(w)}", S["body_left"]))

    story.append(Paragraph("3. Tabela de achados", S["h1"]))
    story.append(
        Paragraph(
            "Chip colorido: crítica #B91C1C · alta #EA580C · média #D97706 · baixa #2563EB · informativa cinza. "
            "Detalhe arquivo-a-arquivo na secção seguinte.",
            S["small"],
        )
    )
    story.append(Spacer(1, 6))
    findings_table(story)

    story.append(PageBreak())
    story.append(Paragraph("4. Achados detalhados por categoria", S["h1"]))

    story.append(Paragraph("Categoria 1 — Banco sem tranca (isolamento de inquilino)", S["h2"]))
    story.append(
        Paragraph(
            "Mecanismo detectado: <b>não é RLS-only tipo Supabase client</b>. "
            "A API Java é multi-tenant por clínica: claim <font face='Courier'>clinic_id</font> no JWT, "
            "<font face='Courier'>FisioPrincipal</font>, filtro JPQL e RLS Postgres. "
            "Não há isolamento por terapeuta dentro da clínica (modelo de negócio). "
            "Não há header de tenant spoofável.",
            S["body"],
        )
    )
    for f in FINDINGS:
        if f["cat"].startswith("1."):
            story.append(finding_card(f))

    story.append(Paragraph("Categoria 2 — Permissão definida no navegador", S["h2"]))
    story.append(
        Paragraph(
            "<b>Não se aplica como falha.</b> O frontend não implementa <font face='Courier'>isAdmin</font>, "
            "<font face='Courier'>canEdit</font> nem filtro de <font face='Courier'>me.role</font> "
            "(<font face='Courier'>lib/auth-me-api.ts:1–4</font> declara o campo; "
            "<font face='Courier'>lib/navigation.ts:19–28</font> mostra Configurações a todos). "
            "O único privilégio fino está no servidor: "
            "<font face='Courier'>@PreAuthorize(\"hasRole('ADMIN')\")</font> em "
            "<font face='Courier'>ClinicSettingsController.java:43 e 53</font>. "
            "Não existe gestão de usuários nem <font face='Courier'>DELETE /users/{id}</font>. "
            "Operações clínicas (delete paciente, financeiro, prontuário) são autenticadas + tenant, "
            "abertas a ADMIN e THERAPIST — comportamento verificado, sem gate invertido no browser.",
            S["body"],
        )
    )

    story.append(Paragraph("Categoria 3 — IDOR", S["h2"]))
    story.append(
        Paragraph(
            "<b>Nenhum IDOR verificado.</b> Cobertura: Health, Auth (6), PublicClinic, Patient (7), "
            "PatientProntuario (2), PatientAttachment (2), Attachment (2), Anamnese (4), Evolucao (4), "
            "Appointment (7), Finance (8), FinancialReport (1), DashboardMetrics (1), Holiday (1), "
            "ClinicSettings (3) — 15 classes, 52 handlers. Frontend: proxy "
            "<font face='Courier'>app/api/backend/[...path]</font> e PDFs "
            "<font face='Courier'>app/api/pdf/prontuario/[pacienteId]</font> / "
            "<font face='Courier'>alta/[pacienteId]</font> (sessão + GET backend). "
            "Exemplo correto: <font face='Courier'>PatientController.java:61–64</font> → "
            "<font face='Courier'>findActiveByIdAndClinicId</font>; "
            "<font face='Courier'>AttachmentController.java:37–48</font>; "
            "<font face='Courier'>FinanceController.java:91–95</font>; "
            "<font face='Courier'>AnamneseController.java:42–45</font>.",
            S["body"],
        )
    )

    story.append(Paragraph("Categoria 4 — Chaves expostas", S["h2"]))
    story.append(
        Paragraph(
            "Histórico git do backend: o literal JWT e a senha de seed existem desde "
            "<font face='Courier'>bcb8b2b</font> (primeiro commit da API). "
            "Nenhum <font face='Courier'>.env</font> tracked. Sem chaves AWS/sk-/PEM. "
            "Frontend: só URLs <font face='Courier'>NEXT_PUBLIC_*</font>. "
            "Produção tem validação de startup; o risco é perfil errado ou Compose sem override.",
            S["body"],
        )
    )
    for f in FINDINGS:
        if f["cat"].startswith("4."):
            story.append(finding_card(f))

    story.append(Paragraph("Categoria 5 — Inputs sem tratamento (XSS)", S["h2"]))
    story.append(
        Paragraph(
            "<b>Nenhum XSS explorável confirmado.</b> Biblioteca presente: "
            "<font face='Courier'>isomorphic-dompurify</font> (frontend) e "
            "OWASP Java HTML Sanitizer (backend, <font face='Courier'>Sanitizers.BLOCKS+FORMATTING+LINKS</font>). "
            "Aplicação verificada no único sink HTML do React e nos create/update de anamnese/evolução. "
            "Campos de evolução na UI são texto React (escape automático). "
            "PDFs escapam com <font face='Courier'>esc()</font> e recusam "
            "<font face='Courier'>javascript:</font> em imagens (alta-html <font face='Courier'>safeImageSrc</font>). "
            "Não há motor de e-mail/templates no backend.",
            S["body"],
        )
    )

    story.append(Paragraph("5. Recomendações priorizadas", S["h1"]))
    recs = [
        ("P1", "Remover literais JWT/CPF e senha admin do bytecode; exigir env em todos os perfis; lista de defaults proibidos no startup."),
        ("P1", "Compose e YAML local/dev sem ${VAR:-teste0101}; falhar se a senha não vier do ambiente."),
        ("P2", "Substituir findAll().findFirst() por seletor explícito de clínica pública; RLS fail-closed sem contexto."),
        ("P2", "Revalidar clinic_id e role do AppUser no JwtAuthenticationFilter (ou invalidar token na divergência)."),
        ("P3", "Esconder a UI de Configurações para THERAPIST (alinhada ao @PreAuthorize já existente)."),
        ("P3", "Testes de regressão cross-tenant (clínica A acessa IDs da B → 404) e teste do endpoint público com N clínicas."),
        ("P3", "Unificar fallback MinIO (apagar minio123) e placeholders CHANGE_ME no env.example."),
    ]
    for pri, text in recs:
        story.append(Paragraph(f"<b>{pri}.</b>  {escape_xml(text)}", S["body_left"]))

    story.append(PageBreak())
    story.append(Paragraph("6. Issues para o GitHub", S["h1"]))
    story.append(
        Paragraph(
            "Texto completo, pronto para colar. Achados triviais do mesmo tema foram agrupados "
            "(F-01+F-02; F-04+F-05; F-06+F-07+F-08+F-09). F-10 (perfil test) entra só como nota na issue 3 se desejarem limpar o YAML de teste. "
            "Copie o bloco entre as linhas --- ISSUE n --- e --- FIM ISSUE n ---.",
            S["body"],
        )
    )
    issues_dir = HERE / "issues"
    issues_dir.mkdir(parents=True, exist_ok=True)
    for issue in ISSUES:
        md_path = issues_dir / f"issue-{issue['n']:02d}.md"
        md_path.write_text(issue_markdown(issue), encoding="utf-8")
        story.extend(issue_block(issue))

    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor(PALETTE["rule"])))
    story.append(Paragraph(
        "Fim do relatório. Gerado por docs/security-audit/generate_report.py a partir de leitura do código em "
        f"{AUDIT_DATE}. Reexecute o script após correções para atualizar gráficos e a tabela.",
        S["small"],
    ))
    return story


def rasterize(pdf_path: Path) -> list[Path]:
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    try:
        import pypdfium2 as pdfium
    except ImportError:
        return []
    doc = pdfium.PdfDocument(str(pdf_path))
    paths = []
    for i in range(len(doc)):
        page = doc[i]
        bitmap = page.render(scale=1.6)
        pil = bitmap.to_pil()
        dest = PREVIEW_DIR / f"page-{i + 1:02d}.png"
        pil.save(dest, "PNG")
        paths.append(dest)
    return paths


def main() -> None:
    CHART_DIR.mkdir(parents=True, exist_ok=True)
    sev = Counter(f["sev"] for f in FINDINGS)
    by_cat = {
        "Banco sem tranca": sum(1 for f in FINDINGS if f["cat"].startswith("1.")),
        "Permissão no browser": 0,
        "IDOR": 0,
        "Chaves expostas": sum(1 for f in FINDINGS if f["cat"].startswith("4.")),
        "XSS": 0,
    }
    donut = make_donut(sev, CHART_DIR / "severidade.png")
    bars = make_bars(by_cat, CHART_DIR / "categorias.png")

    doc = BaseDocTemplate(
        str(OUT_PDF),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=1.8 * cm,
        title=REPORT_TITLE,
        author="Auditoria estática",
    )
    frame_cover = Frame(2 * cm, 2 * cm, A4[0] - 4 * cm, A4[1] - 4 * cm, id="cover")
    frame_body = Frame(2 * cm, 1.6 * cm, A4[0] - 4 * cm, A4[1] - 3.6 * cm, id="body")
    doc.addPageTemplates(
        [
            PageTemplate(id="cover", frames=[frame_cover], onPage=draw_cover_page),
            PageTemplate(id="body", frames=[frame_body], onPage=draw_header_footer),
        ]
    )
    doc.build(build_story(donut, bars))
    previews = rasterize(OUT_PDF)
    print(f"PDF: {OUT_PDF}")
    print(f"pages_previewed: {len(previews)}")
    for p in previews:
        print(p)


if __name__ == "__main__":
    main()
