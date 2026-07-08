import { formatIsoDateToBR } from "@/lib/date-utils";
import { htmlToPlainText } from "@/lib/html-to-plain";
import { formatAddressOneLine, formatCepDisplay } from "@/lib/patient-utils";
import { patientStatusLabel } from "@/lib/patient-labels";
import { isSessionAppointment } from "@/lib/types";
import type { Anamnese, Appointment, Evolucao, Patient } from "@/lib/types";

export interface ProntuarioProfessional {
  name: string;
  title: string;
  crefito: string;
  signatureImage: string;
  logoDataUrl: string;
}

export interface ProntuarioPdfData {
  clinicTitle: string;
  generatedAt: string;
  professional: ProntuarioProfessional;
  patient: Patient;
  anamneses: Anamnese[];
  evolucoes: Evolucao[];
  appointments: Appointment[];
  contentHash: string;
  systemVersion: string;
}

const PRIMARY = "#445552";
const ACCENT = "#6c7d61";
const MUTED = "#6b6a55";
const RULE = "#d4cfc4";

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function field(label: string, value: string): string {
  return `<div class="field"><span class="lbl">${esc(label)}</span><span class="val">${esc(value || "—")}</span></div>`;
}

function block(label: string, body: string): string {
  const safe = esc(body.trim() || "—");
  return `<div class="block"><div class="block-label">${esc(label)}</div><div class="pre">${safe}</div></div>`;
}

function patientSection(p: Patient): string {
  return `
    <section>
      <h2>1. Identificacao do paciente</h2>
      <div class="grid">
        ${field("Nome completo", p.name)}
        ${field("Nascimento", formatIsoDateToBR(p.birthDate))}
        ${field("CPF", p.cpf || "")}
        ${field("Telefone", p.phone)}
        ${field("E-mail", p.email)}
        ${field("Responsavel", p.responsiblePhone || "")}
        ${field("Profissao", p.profession || "")}
        ${field("Indicacao", p.referralSource || "")}
      </div>
      ${field("Endereco", `${formatAddressOneLine(p.address)} · CEP ${formatCepDisplay(p.address.cep)}`)}
      ${field("Diagnostico clinico", p.diagnosis)}
      ${field("Status", patientStatusLabel(p.status))}
    </section>`;
}

function anamneseBody(a: Anamnese): string {
  const rich = a.anamneseTexto ? htmlToPlainText(a.anamneseTexto) : "";
  return [
    `Data da coleta: ${a.dataColeta}`,
    rich ? `Conteudo:\n${rich}` : "",
    `Queixa principal: ${a.queixaPrincipal}`,
    `Historia da doenca: ${a.historiaDoenca}`,
    `Antecedentes familiares: ${a.antecedentesFamiliares}`,
    `Medicamentos: ${a.medicamentos}`,
    `Alergias: ${a.alergias}`,
    `Habitos de vida: ${a.habitosVida}`,
    `Exame fisico: ${a.exameFisico}`,
    `Diagnostico fisioterapeutico: ${a.diagnosticoFisioterapico}`,
    `Objetivos do tratamento: ${a.objetivosTratamento}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function anamneseSection(items: Anamnese[]): string {
  const ordered = [...items].sort((a, b) => b.dataColeta.localeCompare(a.dataColeta));
  const body =
    ordered.length === 0
      ? block("Registros", "Nenhuma anamnese cadastrada para este paciente.")
      : ordered.map((a) => block(`Anamnese #${a.id}`, anamneseBody(a))).join("");
  return `<section><h2>2. Historico clinico e anamnese</h2>${body}</section>`;
}

function evolucaoBody(e: Evolucao): string {
  const hora = e.horaAtendimento?.trim();
  return [
    `Data da sessao: ${e.dataSessao}${hora ? ` · ${hora}` : ""}`,
    e.tipoSessao && e.tipoSessao !== "-" ? `Tipo: ${e.tipoSessao}` : "",
    e.sinaisVitaisInicio || e.sinaisVitaisFim
      ? `Sinais vitais — inicio: ${e.sinaisVitaisInicio || "—"} | fim: ${e.sinaisVitaisFim || "—"}`
      : "",
    `Objetivos: ${e.objetivosSessao}`,
    `Atividades: ${e.atividadesRealizadas}`,
    `Resposta do paciente: ${e.respostaPaciente}`,
    `Observacoes: ${e.observacoes || "—"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function evolucaoSection(items: Evolucao[]): string {
  const ordered = [...items].sort((a, b) => b.dataSessao.localeCompare(a.dataSessao));
  const body =
    ordered.length === 0
      ? block("Registros", "Nenhuma evolucao registrada para este paciente.")
      : ordered
          .map((e) =>
            block(`Evolucao #${e.id} · ${formatIsoDateToBR(e.dataSessao)}`, evolucaoBody(e)),
          )
          .join("");
  return `<section><h2>3. Evolucao fisioterapeutica</h2>${body}</section>`;
}

function appointmentRow(a: Appointment): string {
  const pay = a.paymentStatus === "paid" ? "Pago" : "Pendente";
  const st =
    a.status === "confirmed"
      ? "Confirmado"
      : a.status === "scheduled"
        ? "Agendado"
        : a.status === "completed"
          ? "Concluido"
          : "Cancelado";
  return `<tr><td>${esc(a.date)}</td><td>${esc(a.time)}</td><td>${esc(a.type)}</td><td>${esc(st)}</td><td>${esc(pay)}</td></tr>`;
}

function appointmentsSection(items: Appointment[], patientId: number): string {
  const sessoes = items
    .filter((a) => isSessionAppointment(a) && a.patientId === patientId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  if (sessoes.length === 0) {
    return `<section><h2>4. Historico de atendimentos</h2>${block("Sessoes", "Nenhum agendamento registrado.")}</section>`;
  }
  return `
    <section>
      <h2>4. Historico de atendimentos</h2>
      <table class="timeline">
        <thead><tr><th>Data</th><th>Hora</th><th>Tipo</th><th>Status</th><th>Pagamento</th></tr></thead>
        <tbody>${sessoes.map(appointmentRow).join("")}</tbody>
      </table>
    </section>`;
}

function authenticitySection(d: ProntuarioPdfData): string {
  const sig =
    d.professional.signatureImage && d.professional.signatureImage.startsWith("data:image/")
      ? `<img class="sig" src="${esc(d.professional.signatureImage)}" alt="" />`
      : `<div class="sig-line"></div>`;
  const cref = /^crefito/i.test(d.professional.crefito)
    ? d.professional.crefito
    : `CREFITO ${d.professional.crefito}`;
  return `
    <section class="authenticity">
      <h2>Responsavel tecnico e autenticidade</h2>
      ${sig}
      <div class="resp">
        <strong>${esc(d.professional.name || "—")}</strong><br/>
        ${esc(d.professional.title || "Fisioterapeuta")} · ${esc(cref)}
      </div>
      <table class="meta">
        <tr><td>Gerado em</td><td>${esc(d.generatedAt)}</td></tr>
        <tr><td>Hash SHA-256</td><td class="hash">${esc(d.contentHash)}</td></tr>
        <tr><td>Sistema</td><td>${esc(d.clinicTitle)} (${esc(d.systemVersion)})</td></tr>
      </table>
    </section>`;
}

export function buildProntuarioHtml(d: ProntuarioPdfData): string {
  const logo = d.professional.logoDataUrl?.startsWith("data:image/")
    ? `<img class="logo" src="${esc(d.professional.logoDataUrl)}" alt="" />`
    : "";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; color: ${PRIMARY}; font-size: 11px; line-height: 1.55; margin: 0; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${ACCENT}; padding-bottom: 10px; margin-bottom: 16px; }
  header h1 { font-size: 16px; margin: 0 0 2px; color: ${PRIMARY}; }
  header .sub { font-size: 10px; color: ${MUTED}; }
  header .logo { max-width: 120px; max-height: 60px; object-fit: contain; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: ${ACCENT}; border-bottom: 1px solid ${RULE}; padding-bottom: 3px; margin: 18px 0 8px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 18px; }
  .field { padding: 2px 0; border-bottom: 1px dotted ${RULE}; }
  .field .lbl { color: ${MUTED}; font-size: 9px; text-transform: uppercase; letter-spacing: .03em; display: block; }
  .field .val { color: ${PRIMARY}; }
  .block { margin: 8px 0; padding-left: 8px; border-left: 2px solid ${ACCENT}; }
  .block-label { font-weight: bold; font-size: 10.5px; margin-bottom: 2px; }
  .pre { white-space: pre-wrap; }
  table.timeline { width: 100%; border-collapse: collapse; font-size: 10px; }
  table.timeline th { text-align: left; color: ${MUTED}; border-bottom: 1px solid ${RULE}; padding: 4px 6px; }
  table.timeline td { padding: 4px 6px; border-bottom: 1px solid #eee; }
  table.timeline tr:nth-child(even) td { background: #faf9f6; }
  .authenticity { margin-top: 22px; border: 1px solid ${RULE}; border-radius: 8px; padding: 12px 14px; page-break-inside: avoid; }
  .authenticity .sig { max-height: 70px; max-width: 240px; object-fit: contain; display: block; }
  .authenticity .sig-line { border-bottom: 1px solid #9aa; width: 240px; height: 40px; }
  .authenticity .resp { margin: 6px 0 10px; }
  table.meta { font-size: 9px; color: ${MUTED}; border-collapse: collapse; }
  table.meta td { padding: 1px 8px 1px 0; vertical-align: top; }
  table.meta .hash { word-break: break-all; font-family: monospace; }
  section { page-break-inside: auto; }
</style>
</head>
<body>
  <header>
    <div>
      <h1>Prontuario Fisioterapeutico</h1>
      <div class="sub">${esc(d.clinicTitle)} · Resolucao COFFITO 414/2012</div>
      <div class="sub">Emitido em ${esc(d.generatedAt)}</div>
    </div>
    ${logo}
  </header>
  ${patientSection(d.patient)}
  ${anamneseSection(d.anamneses)}
  ${evolucaoSection(d.evolucoes)}
  ${appointmentsSection(d.appointments, d.patient.id)}
  ${authenticitySection(d)}
</body>
</html>`;
}
