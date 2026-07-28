import { formatIsoDateToBR } from "@/lib/date-utils";
import { formatAddressOneLine } from "@/lib/patient-utils";
import { patientStatusLabel } from "@/lib/patient-labels";
import {
  attendanceRatePercent,
  countCompletedSessions,
} from "@/lib/patient-treatment";
import type { Appointment, Patient } from "@/lib/types";
import type { ProntuarioProfessional } from "@/lib/pdf/prontuario-html";

export interface AltaPdfData {
  clinicTitle: string;
  generatedAt: string;
  professional: ProntuarioProfessional;
  patient: Patient;
  appointments: Appointment[];
  contentHash: string;
  systemVersion: string;
}

const PRIMARY = "#445552";
const ACCENT = "#6c7d61";

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeImageSrc(url: string | undefined | null): string | null {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return null;
  if (trimmed.startsWith("data:image/") || trimmed.startsWith("https:")) {
    return esc(trimmed);
  }
  return null;
}

export function buildAltaHtml(data: AltaPdfData): string {
  const { patient, appointments, professional } = data;
  const completed = countCompletedSessions(appointments, patient.id);
  const attendance = attendanceRatePercent(appointments, patient.id);
  const sigSrc = safeImageSrc(professional.signatureImage);
  const logoSrc = safeImageSrc(professional.logoDataUrl);
  const sigImg = sigSrc
    ? `<img src="${sigSrc}" alt="Assinatura" class="sig-img" />`
    : "";
  const logo = logoSrc ? `<img src="${logoSrc}" alt="Logo" class="logo" />` : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Termo de alta — ${esc(patient.name)}</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    body { font-family: Georgia, "Times New Roman", serif; font-size: 11pt; color: #1a1a1a; line-height: 1.45; }
    header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${PRIMARY}; padding-bottom: 10px; margin-bottom: 16px; }
    .logo { max-height: 48px; max-width: 120px; object-fit: contain; }
    h1 { font-size: 16pt; color: ${PRIMARY}; margin: 0 0 4px; }
    .meta { font-size: 9pt; color: #555; }
    h2 { font-size: 12pt; color: ${ACCENT}; margin: 18px 0 8px; border-bottom: 1px solid #d4cfc4; padding-bottom: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
    .field { margin-bottom: 6px; }
    .lbl { display: block; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.04em; color: #666; }
    .val { font-weight: 600; }
    .summary { white-space: pre-wrap; margin-top: 8px; padding: 12px; background: #f7f6fb; border-radius: 6px; border: 1px solid #e8e4dc; }
    footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #d4cfc4; }
    .sig { margin-top: 24px; text-align: center; }
    .sig-img { max-height: 56px; max-width: 200px; display: block; margin: 0 auto 8px; }
    .hash { font-size: 7pt; color: #888; word-break: break-all; margin-top: 12px; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Termo de alta fisioterapêutica</h1>
      <p class="meta">${esc(data.clinicTitle)} · Gerado em ${esc(data.generatedAt)}</p>
    </div>
    ${logo}
  </header>

  <section>
    <h2>Paciente</h2>
    <div class="grid">
      <div class="field"><span class="lbl">Nome</span><span class="val">${esc(patient.name)}</span></div>
      <div class="field"><span class="lbl">Nascimento</span><span class="val">${esc(formatIsoDateToBR(patient.birthDate))}</span></div>
      <div class="field"><span class="lbl">Status</span><span class="val">${esc(patientStatusLabel(patient.status))}</span></div>
      <div class="field"><span class="lbl">Data da alta</span><span class="val">${esc(patient.dischargedAt ? formatIsoDateToBR(patient.dischargedAt) : "—")}</span></div>
      <div class="field"><span class="lbl">Diagnóstico</span><span class="val">${esc(patient.diagnosis)}</span></div>
      <div class="field"><span class="lbl">Sessões concluídas</span><span class="val">${completed}${patient.totalSessionsPlanned > 0 ? ` de ${patient.totalSessionsPlanned} planejadas` : ""}</span></div>
      <div class="field"><span class="lbl">Comparecimento</span><span class="val">${attendance != null ? `${attendance}%` : "—"}</span></div>
    </div>
    <div class="field" style="margin-top:8px"><span class="lbl">Endereço</span><span class="val">${esc(formatAddressOneLine(patient.address))}</span></div>
  </section>

  <section>
    <h2>Resumo da alta</h2>
    <div class="summary">${esc(patient.dischargeSummary?.trim() || "Alta registrada sem resumo textual adicional.")}</div>
  </section>

  <footer>
    <div class="sig">
      ${sigImg}
      <p><strong>${esc(professional.name)}</strong></p>
      <p>${esc(professional.title)} · CREFITO ${esc(professional.crefito)}</p>
    </div>
    <p class="hash">Integridade (${esc(data.systemVersion)}): ${esc(data.contentHash.slice(0, 16))}…</p>
  </footer>
</body>
</html>`;
}
