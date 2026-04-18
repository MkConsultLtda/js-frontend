"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, Building2, Shield } from "lucide-react";

export default function ConfiguracoesPage() {
  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Preferências locais (mock). Com a API, estes dados passarão ao backend.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Clínica
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Nome e contato exibidos nos relatórios (futuro).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinic-name">Nome da clínica</Label>
            <Input id="clinic-name" defaultValue="FisioSystem" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic-phone">Telefone</Label>
            <Input id="clinic-phone" placeholder="(00) 00000-0000" />
          </div>
          <Button type="button" disabled>
            Salvar (mock)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Lembretes de sessão — integração futura.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Quando houver API, você poderá ativar lembretes por e-mail ou WhatsApp.
          </p>
          <Button type="button" variant="secondary" disabled>
            Configurar depois
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Privacidade
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            LGPD e retenção de dados virão com o backend.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum dado sensível é enviado neste protótipo; evite informações reais em
            ambientes públicos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
