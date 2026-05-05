import type { Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

/** Melhora uso em telemóveis (barra dinâmica, área segura em iOS). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
