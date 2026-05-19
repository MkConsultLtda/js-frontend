import { jsPDF } from "jspdf";
import { formatIsoDateToBR } from "@/lib/date-utils";
import { htmlToPlainText } from "@/lib/html-to-plain";
import { formatAddressOneLine, formatCepDisplay } from "@/lib/patient-utils";
import type { Anamnese, Appointment, Evolucao, Patient } from "@/lib/types";
import { isSessionAppointment } from "@/lib/types";

const MARGIN = 16;
const LINE = 5.2;
const PAGE_H = 297;
const MAX_W = 178;

/** Acento discreto (linhas finas / ênfase leve) */
const ACCENT_R = 45;
const ACCENT_G = 72;
const ACCENT_B = 58;

const TEXT_PRIMARY = { r: 38, g: 38, b: 40 };
const TEXT_MUTED = { r: 115, g: 118, b: 116 };
const RULE_LIGHT = { r: 232, g: 234, b: 233 };

/** Área máxima da logo na 1.ª página (proporção preservada). */
const LOGO_MAX_W_MM = 34;
const LOGO_MAX_H_MM = 20;
/** Espaço reservado à direita do título (≥ largura máx. da logo + folga). */
const HEADER_LOGO_RESERVE_MM = LOGO_MAX_W_MM + 6;

/**
 * Monta as três linhas da assinatura no PDF a partir do perfil persistido na API (sem valores padrão).
 * Retorna array vazio se faltar qualquer dado obrigatório.
 */
export function buildPdfSignatureLines(params: {
  fullName: string;
  professionalTitle: string;
  crefitoNumber: string;
}): string[] {
  const name = params.fullName.trim();
  const title = params.professionalTitle.trim();
  const rawCref = params.crefitoNumber.trim();
  if (!name || !title || !rawCref) return [];
  const crefLine = /^crefito\s/i.test(rawCref) ? rawCref : `Crefito ${rawCref}`;
  return [name, title, crefLine];
}

/** Dados da clínica / profissional para cabeçalho e página de assinatura nos PDFs. */
export type PdfBranding = {
  clinicTitle: string;
  /** Três linhas: nome, titulo/função, registro Crefito (texto). */
  signatureLines: string[];
  /** Logo no canto superior direito da primeira página (foto do perfil em data URL). */
  logoDataUrl?: string;
};

function fileSlugBase(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
      .slice(0, 48) || "paciente"
  );
}

type JsPdfImageProps = { width: number; height: number };

function getImageDimensionsMm(doc: jsPDF, dataUrl: string): JsPdfImageProps | null {
  const api = doc as jsPDF & { getImageProperties?: (d: string) => JsPdfImageProps };
  if (typeof api.getImageProperties !== "function") return null;
  try {
    const p = api.getImageProperties(dataUrl);
    if (p.width > 0 && p.height > 0) return p;
  } catch {
    /* tipo não suportado ou dados inválidos */
  }
  return null;
}

/** Logo só na 1.ª página, canto superior direito; encaixa em largura/altura máx. independentes. */
function drawLogoTopRightFirstPage(
  doc: jsPDF,
  dataUrl: string | undefined,
  bandTopMm: number,
  maxWMm: number,
  maxHMm: number,
): void {
  if (!dataUrl?.startsWith("data:image")) return;
  const fmt: "PNG" | "JPEG" | null = dataUrl.includes("image/png")
    ? "PNG"
    : dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg")
      ? "JPEG"
      : null;
  if (!fmt) return;
  try {
    const pageW = doc.internal.pageSize.getWidth();
    const dims = getImageDimensionsMm(doc, dataUrl);
    let drawW = maxWMm;
    let drawH = maxHMm;
    if (dims) {
      const scale = Math.min(maxWMm / dims.width, maxHMm / dims.height);
      drawW = dims.width * scale;
      drawH = dims.height * scale;
    } else {
      const side = Math.min(maxWMm, maxHMm);
      drawW = side;
      drawH = side;
    }
    const x = pageW - MARGIN - drawW;
    const y = bandTopMm + 5;
    doc.addImage(dataUrl, fmt, x, y, drawW, drawH);
  } catch {
    /* falha em addImage */
  }
}

/**
 * Primeira página: faixa de cabeçalho com nome da clínica à esquerda e logo à direita.
 */
function newDoc(sectionTitle: string, branding?: PdfBranding): { doc: jsPDF; y: number } {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  /** Cabeçalho minimal: faixa baixa, fundo quase branco, uma regra fina. */
  const HEADER_BAND = 34;

  doc.setFillColor(252, 252, 252);
  doc.rect(0, 0, pageW, HEADER_BAND, "F");
  doc.setDrawColor(RULE_LIGHT.r, RULE_LIGHT.g, RULE_LIGHT.b);
  doc.setLineWidth(0.2);
  doc.line(0, HEADER_BAND, pageW, HEADER_BAND);

  drawLogoTopRightFirstPage(doc, branding?.logoDataUrl, 0, LOGO_MAX_W_MM, LOGO_MAX_H_MM);

  const brand = branding?.clinicTitle?.trim() || "FisioSystem";
  const titleMaxW = pageW - 2 * MARGIN - HEADER_LOGO_RESERVE_MM;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(TEXT_PRIMARY.r, TEXT_PRIMARY.g, TEXT_PRIMARY.b);
  const brandLines = doc.splitTextToSize(brand, titleMaxW);
  let ty = 13;
  doc.text(brandLines, MARGIN, ty);
  ty += brandLines.length * 6 + 2;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b);
  const subLines = doc.splitTextToSize(sectionTitle, titleMaxW);
  doc.text(subLines, MARGIN, ty);
  ty += subLines.length * 5 + 3;

  doc.setFontSize(8);
  doc.setTextColor(160, 162, 161);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, MARGIN, ty);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  return { doc, y: HEADER_BAND + 12 };
}

function appendSignaturePage(doc: jsPDF, branding?: PdfBranding): void {
  const lines = (branding?.signatureLines ?? []).map((s) => s.trim()).filter(Boolean);
  if (lines.length === 0) return;

  doc.addPage();
  const pageW = doc.internal.pageSize.getWidth();
  const innerW = pageW - 2 * MARGIN;

  const titleY = 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(TEXT_PRIMARY.r, TEXT_PRIMARY.g, TEXT_PRIMARY.b);
  doc.text("Responsável técnico", MARGIN, titleY);
  doc.setDrawColor(RULE_LIGHT.r, RULE_LIGHT.g, RULE_LIGHT.b);
  doc.setLineWidth(0.15);
  doc.line(MARGIN, titleY + 2.5, MARGIN + 52, titleY + 2.5);

  const boxTop = titleY + 16;
  let wrappedCount = 0;
  for (let i = 0; i < lines.length; i++) {
    doc.setFont("helvetica", i === 0 ? "bold" : "normal");
    doc.setFontSize(11);
    const wrapped = doc.splitTextToSize(lines[i], innerW - 16);
    wrappedCount += wrapped.length;
  }
  const boxH = Math.max(46, wrappedCount * LINE + 34);

  doc.setDrawColor(RULE_LIGHT.r, RULE_LIGHT.g, RULE_LIGHT.b);
  doc.setLineWidth(0.2);
  doc.rect(MARGIN, boxTop, innerW, boxH, "S");

  let y = boxTop + 11;
  doc.setFontSize(11);
  for (let i = 0; i < lines.length; i++) {
    const isName = i === 0;
    doc.setFont("helvetica", isName ? "bold" : "normal");
    doc.setTextColor(
      isName ? TEXT_PRIMARY.r : TEXT_MUTED.r,
      isName ? TEXT_PRIMARY.g : TEXT_MUTED.g,
      isName ? TEXT_PRIMARY.b : TEXT_MUTED.b,
    );
    const wrapped = doc.splitTextToSize(lines[i], innerW - 16);
    doc.text(wrapped, MARGIN + 8, y);
    y += wrapped.length * LINE + (i === lines.length - 1 ? 2 : 3);
  }

  doc.setFont("helvetica", "normal");
  doc.setDrawColor(190, 192, 191);
  doc.setLineWidth(0.25);
  const lineY = Math.min(boxTop + boxH - 10, y + 8);
  doc.line(MARGIN + 8, lineY, MARGIN + innerW - 8, lineY);

  doc.setFontSize(7);
  doc.setTextColor(150, 153, 152);
  doc.text("Assinatura eletrónica conforme dados cadastrados no sistema.", MARGIN + 8, lineY + 5.5);
}

function ensureRoom(doc: jsPDF, y: number, need: number): number {
  if (y + need > PAGE_H - 18) {
    doc.addPage();
    return 22;
  }
  return y;
}

function writeBlock(doc: jsPDF, y: number, label: string, body: string): number {
  const bodyText = body.trim() || "—";
  const bodyLines = doc.splitTextToSize(bodyText, MAX_W - 14);
  const labelLineH = 6;
  const boxPad = 5;
  const boxH = labelLineH + bodyLines.length * LINE + boxPad * 2;
  y = ensureRoom(doc, y, boxH + 10);

  const pageW = doc.internal.pageSize.getWidth();
  const innerLeft = MARGIN + 3;
  doc.setFillColor(ACCENT_R, ACCENT_G, ACCENT_B);
  doc.rect(MARGIN, y - 2, 0.75, boxH + 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(TEXT_PRIMARY.r, TEXT_PRIMARY.g, TEXT_PRIMARY.b);
  doc.text(label, innerLeft + 2, y + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(TEXT_PRIMARY.r, TEXT_PRIMARY.g, TEXT_PRIMARY.b);
  doc.text(bodyLines, innerLeft + 2, y + 4 + labelLineH);

  doc.setDrawColor(RULE_LIGHT.r, RULE_LIGHT.g, RULE_LIGHT.b);
  doc.setLineWidth(0.12);
  doc.line(MARGIN, y + boxH + 1, pageW - MARGIN, y + boxH + 1);

  return y + boxH + 8;
}

function writeTitle(doc: jsPDF, y: number, t: string): number {
  y = ensureRoom(doc, y, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(TEXT_PRIMARY.r, TEXT_PRIMARY.g, TEXT_PRIMARY.b);
  doc.text(t, MARGIN, y);
  y += 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(TEXT_PRIMARY.r, TEXT_PRIMARY.g, TEXT_PRIMARY.b);
  return y;
}

function patientHeaderLines(p: Patient): string {
  const nasc = formatIsoDateToBR(p.birthDate);
  const addr = formatAddressOneLine(p.address);
  return [
    `Nome: ${p.name}`,
    `Nasc.: ${nasc} · CPF: ${p.cpf || "—"}`,
    `E-mail: ${p.email || "—"}`,
    `Telefone: ${p.phone || "—"}`,
    p.responsiblePhone ? `Responsável: ${p.responsiblePhone}` : "",
    `Endereço: ${addr} · CEP ${formatCepDisplay(p.address.cep)}`,
    `Diagnóstico clínico: ${p.diagnosis}`,
    `Indicação: ${p.referralSource || "—"}`,
    `Status: ${p.status === "active" ? "Ativo" : "Inativo"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function anamneseBlock(a: Anamnese): string {
  const bloco = a.anamneseTexto ? htmlToPlainText(a.anamneseTexto) : "";
  const parts = [
    `Data coleta: ${a.dataColeta}`,
    a.anamneseTexto ? `Conteúdo (texto):\n${bloco}` : null,
    `Queixa principal: ${a.queixaPrincipal}`,
    `História da doença: ${a.historiaDoenca}`,
    `Antecedentes familiares: ${a.antecedentesFamiliares}`,
    `Medicamentos: ${a.medicamentos}`,
    `Alergias: ${a.alergias}`,
    `Hábitos de vida: ${a.habitosVida}`,
    `Exame físico: ${a.exameFisico}`,
    `Diagnóstico fisioterapêutico: ${a.diagnosticoFisioterapico}`,
    `Objetivos do tratamento: ${a.objetivosTratamento}`,
  ].filter(Boolean) as string[];
  return parts.join("\n\n");
}

function evolucaoTipoLine(e: Evolucao): string | null {
  const t = e.tipoSessao?.trim();
  if (!t || t === "-") return null;
  return `Tipo de sessão: ${t}`;
}

function evolucaoBlock(e: Evolucao): string {
  const hora = e.horaAtendimento?.trim();
  return [
    `Data da sessão: ${e.dataSessao}${hora ? ` · ${hora}` : ""}`,
    evolucaoTipoLine(e),
    e.sinaisVitaisInicio || e.sinaisVitaisFim
      ? `Sinais vitais — início: ${e.sinaisVitaisInicio || "—"} | fim: ${e.sinaisVitaisFim || "—"}`
      : null,
    `Objetivos: ${e.objetivosSessao}`,
    `Atividades: ${e.atividadesRealizadas}`,
    `Resposta do paciente: ${e.respostaPaciente}`,
    `Observações: ${e.observacoes || "—"}`,
    `Plano próxima sessão: ${e.planoProximaSessao || "—"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function appointmentLine(a: Appointment): string {
  if (!isSessionAppointment(a)) return "";
  const pay = a.paymentStatus === "paid" ? "Pago" : "Pendente";
  const st =
    a.status === "confirmed"
      ? "Confirmado"
      : a.status === "scheduled"
        ? "Agendado"
        : a.status === "completed"
          ? "Concluído"
          : "Cancelado";
  return `${a.date} ${a.time} · ${a.type} · ${st} · Pagto: ${pay}${a.notes ? ` · Obs.: ${a.notes}` : ""}`;
}

export function downloadProntuarioPdf(
  patient: Patient,
  anamneses: Anamnese[],
  evolucoes: Evolucao[],
  appointments: Appointment[],
  branding?: PdfBranding,
): void {
  const { doc, y: y0 } = newDoc("Prontuário (resumo)", branding);
  let y = y0;
  y = writeTitle(doc, y, "Identificação");
  y = writeBlock(doc, y, "Paciente", patientHeaderLines(patient));

  const orderedAna = [...anamneses].sort((a, b) => b.dataColeta.localeCompare(a.dataColeta));
  y = writeTitle(doc, y, "Anamnese");
  if (orderedAna.length === 0) {
    y = writeBlock(doc, y, "Registros", "Nenhuma anamnese cadastrada para este paciente.");
  } else {
    for (const a of orderedAna) {
      y = writeBlock(doc, y, `Anamnese #${a.id}`, anamneseBlock(a));
    }
  }

  const orderedEvo = [...evolucoes].sort((a, b) => b.dataSessao.localeCompare(a.dataSessao));
  y = writeTitle(doc, y, "Evolução");
  if (orderedEvo.length === 0) {
    y = writeBlock(doc, y, "Registros", "Nenhuma evolução para este paciente.");
  } else {
    for (const e of orderedEvo) {
      const title =
        e.tipoSessao && e.tipoSessao !== "-"
          ? `Evolução #${e.id} · ${e.dataSessao} · ${e.tipoSessao}`
          : `Evolução #${e.id} · ${e.dataSessao}`;
      y = writeBlock(doc, y, title, evolucaoBlock(e));
    }
  }

  const sessoes = appointments
    .filter((a) => isSessionAppointment(a) && a.patientId === patient.id)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  y = writeTitle(doc, y, "Histórico de atendimentos");
  if (sessoes.length === 0) {
    y = writeBlock(doc, y, "Sessões", "Nenhum agendamento registrado para este paciente.");
  } else {
    y = writeBlock(
      doc,
      y,
      "Linha do tempo",
      sessoes.map(appointmentLine).filter(Boolean).join("\n\n"),
    );
  }

  appendSignaturePage(doc, branding);
  doc.save(`prontuario-${fileSlugBase(patient.name)}.pdf`);
}

export function downloadEvolucaoPdf(
  patient: Patient,
  evolucoes: Evolucao[],
  branding?: PdfBranding,
): void {
  const { doc, y: y0 } = newDoc("Relatório de evolução", branding);
  let y = y0;
  y = writeBlock(doc, y, "Paciente", patientHeaderLines(patient));
  const ordered = [...evolucoes].sort((a, b) => b.dataSessao.localeCompare(a.dataSessao));
  if (ordered.length === 0) {
    y = writeBlock(doc, y, "Evoluções", "Nenhum registro.");
  } else {
    for (const e of ordered) {
      const title =
        e.tipoSessao && e.tipoSessao !== "-"
          ? `Sessão ${e.dataSessao} · ${e.tipoSessao}`
          : `Sessão ${e.dataSessao}`;
      y = writeBlock(doc, y, title, evolucaoBlock(e));
    }
  }
  appendSignaturePage(doc, branding);
  doc.save(`evolucao-${fileSlugBase(patient.name)}.pdf`);
}

export function downloadAtendimentosPdf(
  patient: Patient,
  appointments: Appointment[],
  branding?: PdfBranding,
): void {
  const { doc, y: y0 } = newDoc("Histórico de atendimentos", branding);
  let y = y0;
  y = writeBlock(doc, y, "Paciente", patientHeaderLines(patient));
  const sessoes = appointments
    .filter((a) => isSessionAppointment(a) && a.patientId === patient.id)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  if (sessoes.length === 0) {
    writeBlock(doc, y, "Sessões", "Nenhum agendamento para este paciente.");
  } else {
    writeBlock(
      doc,
      y,
      "Atendimentos",
      sessoes.map(appointmentLine).filter(Boolean).join("\n\n"),
    );
  }
  appendSignaturePage(doc, branding);
  doc.save(`atendimentos-${fileSlugBase(patient.name)}.pdf`);
}
