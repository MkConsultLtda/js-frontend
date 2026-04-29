import { jsPDF } from "jspdf";
import { formatIsoDateToBR } from "@/lib/date-utils";
import { htmlToPlainText } from "@/lib/html-to-plain";
import { formatAddressOneLine, formatCepDisplay } from "@/lib/patient-utils";
import type { Anamnese, Appointment, Evolucao, Patient } from "@/lib/types";
import { isSessionAppointment } from "@/lib/types";

const MARGIN = 14;
const LINE = 5;
const PAGE_H = 297;
const MAX_W = 180;

function fileSlugBase(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 48) || "paciente";
}

function newDoc(title: string): { doc: jsPDF; y: number } {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("FisioSystem (mock local)", MARGIN, y);
  y += 8;
  doc.setFontSize(11);
  doc.text(title, MARGIN, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, MARGIN, y);
  y += 10;
  doc.setTextColor(0, 0, 0);
  return { doc, y };
}

function ensureRoom(doc: jsPDF, y: number, need: number): number {
  if (y + need > PAGE_H - 16) {
    doc.addPage();
    return 20;
  }
  return y;
}

function writeBlock(doc: jsPDF, y: number, label: string, body: string): number {
  const text = `${label}:\n${body.trim() || "—"}`;
  const lines = doc.splitTextToSize(text, MAX_W);
  y = ensureRoom(doc, y, lines.length * LINE + 4);
  doc.setFont("helvetica", "normal");
  doc.text(lines, MARGIN, y);
  return y + lines.length * LINE + 4;
}

function writeTitle(doc: jsPDF, y: number, t: string): number {
  y = ensureRoom(doc, y, 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(t, MARGIN, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
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

function evolucaoBlock(e: Evolucao): string {
  return [
    `Data da sessão: ${e.dataSessao} · Tipo: ${e.tipoSessao}`,
    e.sinaisVitaisInicio || e.sinaisVitaisFim
      ? `Sinais vitais — início: ${e.sinaisVitaisInicio || "—"} | fim: ${e.sinaisVitaisFim || "—"}`
      : null,
    `Objetivos: ${e.objetivosSessao}`,
    `Atividades: ${e.atividadesRealizadas}`,
    `Resposta do paciente: ${e.respostaPaciente}`,
    `Dor: ${e.dorPre} -> ${e.dorPos} (0-10)`,
    `Observacoes: ${e.observacoes || "—"}`,
    `Plano proxima sessao: ${e.planoProximaSessao || "—"}`,
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
          ? "Concluido"
          : "Cancelado";
  return `${a.date} ${a.time} · ${a.type} · ${st} · Pagto: ${pay}${a.notes ? ` · Obs: ${a.notes}` : ""}`;
}

export function downloadProntuarioPdf(
  patient: Patient,
  anamneses: Anamnese[],
  evolucoes: Evolucao[],
  appointments: Appointment[]
): void {
  const { doc, y: y0 } = newDoc("Prontuario (resumo)");
  let y = y0;
  y = writeTitle(doc, y, "Identificacao");
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
  y = writeTitle(doc, y, "Evolucao (lista)");
  if (orderedEvo.length === 0) {
    y = writeBlock(doc, y, "Registros", "Nenhuma evolucao para este paciente.");
  } else {
    for (const e of orderedEvo) {
      y = writeBlock(doc, y, `Evolucao #${e.id} · ${e.dataSessao}`, evolucaoBlock(e));
    }
  }

  const sessoes = appointments
    .filter((a) => isSessionAppointment(a) && a.patientId === patient.id)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  y = writeTitle(doc, y, "Historico de atendimentos (agenda)");
  if (sessoes.length === 0) {
    y = writeBlock(doc, y, "Sessoes", "Nenhum agendamento registrado para este paciente.");
  } else {
    y = writeBlock(
      doc,
      y,
      "Linha do tempo",
      sessoes.map(appointmentLine).filter(Boolean).join("\n\n")
    );
  }

  doc.save(`prontuario-${fileSlugBase(patient.name)}.pdf`);
}

export function downloadEvolucaoPdf(patient: Patient, evolucoes: Evolucao[]): void {
  const { doc, y: y0 } = newDoc("Relatorio de evolucao");
  let y = y0;
  y = writeBlock(doc, y, "Paciente", patientHeaderLines(patient));
  const ordered = [...evolucoes].sort((a, b) => b.dataSessao.localeCompare(a.dataSessao));
  if (ordered.length === 0) {
    y = writeBlock(doc, y, "Evolucoes", "Nenhum registro.");
  } else {
    for (const e of ordered) {
      y = writeBlock(doc, y, `Sessao ${e.dataSessao} · ${e.tipoSessao}`, evolucaoBlock(e));
    }
  }
  doc.save(`evolucao-${fileSlugBase(patient.name)}.pdf`);
}

export function downloadAtendimentosPdf(patient: Patient, appointments: Appointment[]): void {
  const { doc, y: y0 } = newDoc("Historico de atendimentos");
  let y = y0;
  y = writeBlock(doc, y, "Paciente", patientHeaderLines(patient));
  const sessoes = appointments
    .filter((a) => isSessionAppointment(a) && a.patientId === patient.id)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  if (sessoes.length === 0) {
    y = writeBlock(doc, y, "Sessoes", "Nenhum agendamento para este paciente.");
  } else {
    writeBlock(
      doc,
      y,
      "Atendimentos",
      sessoes.map(appointmentLine).filter(Boolean).join("\n\n")
    );
  }
  doc.save(`atendimentos-${fileSlugBase(patient.name)}.pdf`);
}
