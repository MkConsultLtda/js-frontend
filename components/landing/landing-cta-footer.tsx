import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND_LOGO, BRAND_NAME } from "@/lib/brand";

export function LandingCta() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
      <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Pronta para organizar sua clínica?
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
        Comece a usar o {BRAND_NAME} e tenha agenda, pacientes e prontuário sempre à mão.
      </p>
      <div className="mt-8 flex justify-center">
        <Link href="/login">
          <Button size="lg">Acessar o sistema</Button>
        </Link>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Dados protegidos · LGPD · COFFITO 414/2012
      </p>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:px-6">
        <Image
          src={BRAND_LOGO}
          alt={BRAND_NAME}
          width={280}
          height={72}
          unoptimized
          className="h-9 w-auto"
        />
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <Link
            href="/politica-de-privacidade"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Política de Privacidade
          </Link>
          <Link
            href="/termos-de-uso"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Termos de Uso
          </Link>
        </nav>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {BRAND_NAME}. Todos os direitos reservados.
        </p>
        <p className="max-w-md text-xs text-muted-foreground">
          Desenvolvido em conformidade com a Resolução COFFITO 414/2012 e a LGPD
          (Lei 13.709/2018).
        </p>
      </div>
    </footer>
  );
}
