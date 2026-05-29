import "server-only";
import { existsSync } from "node:fs";
import type { Browser } from "puppeteer-core";

const isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
);

/** Navegadores Chromium comuns por plataforma (dev local). */
const LOCAL_BROWSER_CANDIDATES: Record<string, string[]> = {
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ],
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ],
  linux: [
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
  ],
};

function findLocalBrowser(): string | null {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const candidates = LOCAL_BROWSER_CANDIDATES[process.platform] ?? [];
  return candidates.find((p) => existsSync(p)) ?? null;
}

/**
 * Abre um Chromium para gerar PDF.
 * - Produção/serverless (Vercel): binario do @sparticuz/chromium.
 * - Dev (Windows/macOS/Linux): Chrome local (canal 'chrome') ou PUPPETEER_EXECUTABLE_PATH.
 */
export async function launchPdfBrowser(): Promise<Browser> {
  const puppeteer = (await import("puppeteer-core")).default;

  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const executablePath = findLocalBrowser();
  if (executablePath) {
    return puppeteer.launch({ executablePath, headless: true });
  }
  return puppeteer.launch({ channel: "chrome", headless: true });
}

/** Renderiza HTML completo em PDF A4 com margens para cabecalho/rodape. */
export async function renderHtmlToPdf(
  html: string,
  footerText: string,
): Promise<Uint8Array> {
  const browser = await launchPdfBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `
        <div style="width:100%;font-size:8px;color:#888;padding:0 14mm;display:flex;justify-content:space-between;">
          <span>${footerText}</span>
          <span>Pagina <span class="pageNumber"></span> de <span class="totalPages"></span></span>
        </div>`,
      margin: { top: "14mm", bottom: "18mm", left: "14mm", right: "14mm" },
    });
    return pdf;
  } finally {
    await browser.close();
  }
}
