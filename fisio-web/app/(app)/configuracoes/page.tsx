"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useMockData } from "@/components/mock-data-provider";
import { clearMockSessionCookie } from "@/lib/auth-session";
import { useClinicSettings } from "@/lib/clinic-settings";
import { Bell, Building2, Shield, ScrollText, LogOut, RotateCcw } from "lucide-react";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const { settings, setSettings } = useClinicSettings();
  const { auditLog, clearAuditLog, resetMockDataToSeed } = useMockData();

  const [draft, setDraft] = useState(settings);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const sortedAudit = useMemo(
    () =>
      [...auditLog].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
      ),
    [auditLog]
  );

  const saveClinic = () => {
    setSettings(draft);
    toast.success("Preferências da clínica salvas neste navegador.");
  };

  const logout = () => {
    clearMockSessionCookie();
    router.replace("/login");
    toast.message("Sessão encerrada.");
  };

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Dados locais no navegador (mock). Com API, estes campos virão do backend.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Clínica e profissional
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Usados em mensagens de confirmação (WhatsApp) e identidade na interface.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinic-name">Nome da clínica / marca</Label>
            <Input
              id="clinic-name"
              value={draft.clinicName}
              onChange={(e) => setDraft((d) => ({ ...d, clinicName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="therapist-name">Nome da fisioterapeuta</Label>
            <Input
              id="therapist-name"
              value={draft.therapistName}
              onChange={(e) => setDraft((d) => ({ ...d, therapistName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="therapist-phone">Telefone profissional (opcional)</Label>
            <Input
              id="therapist-phone"
              value={draft.therapistPhone}
              onChange={(e) => setDraft((d) => ({ ...d, therapistPhone: e.target.value }))}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buffer">Intervalo sugerido entre visitas (min)</Label>
            <Input
              id="buffer"
              type="number"
              min={0}
              max={180}
              value={draft.defaultTravelBufferMinutes}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  defaultTravelBufferMinutes: Math.min(
                    180,
                    Math.max(0, parseInt(e.target.value, 10) || 0)
                  ),
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Referência para planejar a rota do dia; a agenda ainda não bloqueia horários
              automaticamente.
            </p>
          </div>
          <Button type="button" onClick={saveClinic}>
            Salvar preferências
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScrollText className="h-5 w-5" />
            Trilha de auditoria (mock)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Registro local das alterações em pacientes e agenda — base para LGPD quando houver API.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedAudit.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3 text-sm">
              {sortedAudit.map((entry) => (
                <li key={entry.id} className="border-b border-border/50 pb-2 last:border-0">
                  <time className="text-xs text-muted-foreground" dateTime={entry.at}>
                    {new Date(entry.at).toLocaleString("pt-BR")}
                  </time>
                  <p className="mt-0.5">{entry.message}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => clearAuditLog()}>
              Limpar trilha
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="gap-1"
              onClick={() => setResetOpen(true)}
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar seed
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Na agenda, use o botão WhatsApp para enviar confirmação com texto pré-preenchido.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Integração futura com API de mensagens e lembretes automáticos.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Privacidade e sessão
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Evite dados reais de pacientes em ambiente público enquanto o protótipo roda só no
            navegador.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sair (encerrar sessão mock)
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Restaurar dados de exemplo?"
        description="Isso apaga o mock persistido neste navegador (pacientes, agenda, anamneses, evoluções e trilha) e recarrega o conteúdo inicial de demonstração."
        confirmLabel="Restaurar"
        variant="destructive"
        onConfirm={() => {
          resetMockDataToSeed();
          toast.success("Dados restaurados ao exemplo inicial.");
        }}
      />
    </div>
  );
}
