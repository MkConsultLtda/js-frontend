import {
  Calendar,
  ClipboardList,
  Users,
  BarChart3,
  FileDown,
  ShieldCheck,
  NotebookPen,
  MessageSquareOff,
  Clock,
  FileWarning,
} from "lucide-react";

const problems = [
  { icon: NotebookPen, text: "Prontuários perdidos ou ilegíveis" },
  { icon: MessageSquareOff, text: "Agenda bagunçada em papel ou WhatsApp" },
  { icon: Clock, text: "Horas em burocracia ao invés de pacientes" },
  { icon: FileWarning, text: "PDFs manuais sem padrão profissional" },
];

const features = [
  {
    icon: Calendar,
    title: "Agenda inteligente",
    description: "Visualize dia, semana e mês. Sem conflitos de horário.",
  },
  {
    icon: ClipboardList,
    title: "Prontuário COFFITO",
    description: "Anamnese e evoluções conforme a Resolução 414/2012.",
  },
  {
    icon: Users,
    title: "Gestão de pacientes",
    description: "Todos os dados em um só lugar, com busca rápida.",
  },
  {
    icon: BarChart3,
    title: "Dashboard",
    description: "Métricas do seu consultório em tempo real.",
  },
  {
    icon: FileDown,
    title: "PDF profissional",
    description: "Exporte prontuários com sua assinatura e identidade.",
  },
  {
    icon: ShieldCheck,
    title: "Dados seguros",
    description: "Conforme a LGPD, com autenticação e acesso protegido.",
  },
];

export function LandingFeatures() {
  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Chega de cadernos, WhatsApp e planilhas
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((p) => (
            <div
              key={p.text}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-5 text-card-foreground"
            >
              <p.icon className="h-5 w-5 shrink-0 text-accent" aria-hidden />
              <p className="text-sm text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-20 border-y border-border/60 bg-secondary/30"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Tudo o que a sua clínica precisa
            </h2>
            <p className="mt-3 text-muted-foreground">
              Recursos pensados para o dia a dia da fisioterapeuta autônoma.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
