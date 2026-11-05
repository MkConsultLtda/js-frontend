import type { jsPDF } from "jspdf";

/**
 * Fonte embutida usada nos PDFs client-side (jsPDF).
 * A Helvetica padrão do jsPDF não possui glifos UTF-8 e "come" acentos (ç, ã, é, õ)
 * e sinais como "—"/"·". Embutimos a Roboto (TTF) para renderizar acentuação correta.
 */
export const PDF_FONT_FAMILY = "Roboto";

type FontVariant = { style: "normal" | "bold"; file: string };

const VARIANTS: FontVariant[] = [
  { style: "normal", file: "/fonts/Roboto-Regular.ttf" },
  { style: "bold", file: "/fonts/Roboto-Bold.ttf" },
];

/** Cache do base64 por arquivo para evitar refetch/reconversão a cada PDF. */
const base64Cache = new Map<string, string>();

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function loadFontBase64(file: string): Promise<string> {
  const cached = base64Cache.get(file);
  if (cached) return cached;
  const res = await fetch(file);
  if (!res.ok) throw new Error(`Falha ao carregar fonte do PDF: ${file}`);
  const base64 = arrayBufferToBase64(await res.arrayBuffer());
  base64Cache.set(file, base64);
  return base64;
}

/**
 * Registra a fonte Roboto (regular + bold) no documento e a define como fonte ativa.
 * Deve ser chamada logo após criar o `jsPDF`. Idempotente por documento.
 */
export async function registerPdfFont(doc: jsPDF): Promise<void> {
  for (const variant of VARIANTS) {
    const vfsName = `${PDF_FONT_FAMILY}-${variant.style}.ttf`;
    const base64 = await loadFontBase64(variant.file);
    doc.addFileToVFS(vfsName, base64);
    doc.addFont(vfsName, PDF_FONT_FAMILY, variant.style);
  }
  doc.setFont(PDF_FONT_FAMILY, "normal");
}
