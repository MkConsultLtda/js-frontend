import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND_LOGO, BRAND_NAME } from "@/lib/brand";

type Props = {
  title: string;
  version?: string;
  updatedAt: string;
  children: React.ReactNode;
};

export function LegalShell({ title, version, updatedAt, children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label={BRAND_NAME} className="flex items-center">
            <Image
              src={BRAND_LOGO}
              alt={BRAND_NAME}
              width={280}
              height={72}
              unoptimized
              className="h-9 w-auto"
            />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {version ? `Versão ${version} · ` : ""}Última atualização: {updatedAt}
        </p>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:font-semibold [&_h3]:text-foreground [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} {BRAND_NAME}. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
