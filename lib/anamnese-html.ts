import DOMPurify from "isomorphic-dompurify";
import type { Anamnese } from "@/lib/types";

/** Escapa texto puro antes de montar HTML a partir de campos legados. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Sanitiza qualquer HTML antes de ser renderizado com dangerouslySetInnerHTML. */
export function normalizeAnamneseHtml(raw: string): string {
  if (!raw.trim()) return "";
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
}

/** HTML seguro da anamnese: usa o texto rico quando existe, senão monta as seções legadas. */
export function anamneseToHtml(anamnese: Anamnese): string {
  if (anamnese.anamneseTexto?.trim()) {
    return normalizeAnamneseHtml(anamnese.anamneseTexto);
  }
  const sections = [
    { title: "Queixa principal", body: anamnese.queixaPrincipal },
    { title: "História da doença atual", body: anamnese.historiaDoenca },
    { title: "Antecedentes familiares", body: anamnese.antecedentesFamiliares },
    { title: "Medicamentos", body: anamnese.medicamentos },
    { title: "Alergias", body: anamnese.alergias },
    { title: "Hábitos de vida", body: anamnese.habitosVida },
    { title: "Exame físico", body: anamnese.exameFisico },
    { title: "Diagnóstico fisioterapêutico", body: anamnese.diagnosticoFisioterapico },
    { title: "Objetivos do tratamento", body: anamnese.objetivosTratamento },
  ];
  const html = sections
    .filter((section) => section.body?.trim())
    .map((section) => `<h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.body ?? "")}</p>`)
    .join("");
  return normalizeAnamneseHtml(html);
}
