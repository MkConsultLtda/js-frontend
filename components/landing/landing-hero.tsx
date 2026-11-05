import Link from "next/link";
import { ShieldCheck, Lock, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const badges = [
  { icon: FileCheck2, label: "Conforme COFFITO 414/2012" },
  { icon: ShieldCheck, label: "LGPD" },
  { icon: Lock, label: "Dados seguros" },
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-secondary/40 to-background">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28">
        <div className="animate-fade-in-up space-y-6">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            O movimento da sua clínica
          </span>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Agenda, prontuário e pacientes em um só lugar
          </h1>
          <p className="mx-auto max-w-2xl text-balance text-lg text-muted-foreground">
            Gestão completa para fisioterapeutas autônomos. Organize seu dia,
            registre evoluções e mantenha tudo conforme a COFFITO 414/2012 e a LGPD.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                Entrar no sistema
              </Button>
            </Link>
            <Link href="#features" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Ver recursos
              </Button>
            </Link>
          </div>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-4">
            {badges.map((b) => (
              <li
                key={b.label}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <b.icon className="h-4 w-4 text-primary" aria-hidden />
                {b.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
