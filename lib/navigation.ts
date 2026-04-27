import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Calendar,
  FileText,
  LayoutDashboard,
  Settings,
  TrendingUp,
  UserCircle,
  Users,
} from "lucide-react";

export type AppNavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export const APP_NAV: AppNavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Pacientes", href: "/pacientes", icon: Users },
  { name: "Anamnese", href: "/anamnese", icon: FileText },
  { name: "Evolução", href: "/evolucao", icon: TrendingUp },
  { name: "Meu perfil", href: "/perfil", icon: UserCircle },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

export { Activity };
