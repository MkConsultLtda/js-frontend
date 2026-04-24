/** Limite de arquivo antes de ler como data URL (evita estouro de quota no localStorage). */
export const MAX_PATIENT_ATTACHMENT_BYTES = 800 * 1024;

const ACCEPT = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

export function isAllowedAttachmentMime(mime: string): boolean {
  return ACCEPT.has(mime.toLowerCase());
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
