import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Activity } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-5xl flex flex-col items-center text-center space-y-8">
        <div className="flex items-center space-x-3">
          <Activity className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            FisioSystem
          </h1>
        </div>
        
        <p className="max-w-2xl text-lg text-muted-foreground">
          O sistema completo para gestão da sua clínica de fisioterapia.
          Gerencie pacientes, agendamentos e evoluções em um só lugar.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">Acessar Dashboard</Button>
            </Link>
            <Link href="/login">
               <Button variant="outline" size="lg" className="w-full sm:w-auto">Login</Button>
            </Link>
        </div>
        
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full">
            <div className="p-6 border rounded-xl bg-card text-card-foreground shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Agendamento Fácil</h3>
                <p className="text-sm text-muted-foreground">Controle total da sua agenda com visualização intuitiva.</p>
            </div>
            <div className="p-6 border rounded-xl bg-card text-card-foreground shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Prontuário Eletrônico</h3>
                <p className="text-sm text-muted-foreground">Histórico completo dos seus pacientes e evoluções.</p>
            </div>
            <div className="p-6 border rounded-xl bg-card text-card-foreground shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Financeiro</h3>
                <p className="text-sm text-muted-foreground">Gestão de pagamentos e relatórios financeiros simples.</p>
            </div>
        </div>
      </div>
    </main>
  );
}
