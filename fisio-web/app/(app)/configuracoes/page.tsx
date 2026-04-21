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
import {
  Bell,
  Building2,
  Shield,
  ScrollText,
  LogOut,
  RotateCcw,
  CalendarDays,
  PlusCircle,
  X,
} from "lucide-react";
import { normalizeWorkingWeekdays } from "@/lib/schedule-utils";

const WEEKDAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

export default function ConfiguracoesPage() {
  const router = useRouter();
  const { settings, setSettings } = useClinicSettings();
  const { auditLog, clearAuditLog, resetMockDataToSeed } = useMockData();

  const [draft, setDraft] = useState(settings);
  const [resetOpen, setResetOpen] = useState(false);
  const [newDuration, setNewDuration] = useState("");
  const [newType, setNewType] = useState("");

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

          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4" />
              Agenda e dashboard
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm text-muted-foreground mb-2">
                Dias em que você atende (o calendário e o gráfico da semana seguem esta escolha)
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {WEEKDAY_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted/60"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      checked={normalizeWorkingWeekdays(draft.workingWeekdays).includes(value)}
                      onChange={() => {
                        setDraft((prev) => {
                          const cur = new Set(normalizeWorkingWeekdays(prev.workingWeekdays));
                          if (cur.has(value)) cur.delete(value);
                          else cur.add(value);
                          let arr = [...cur].sort((a, b) => a - b);
                          if (arr.length === 0) arr = [1];
                          return { ...prev, workingWeekdays: arr };
                        });
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="max-sessions">Meta de sessões por dia (card Ocupação)</Label>
              <Input
                id="max-sessions"
                type="number"
                min={1}
                max={24}
                value={draft.maxSessionsPerDay}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    maxSessionsPerDay: Math.min(
                      24,
                      Math.max(1, parseInt(e.target.value, 10) || 1)
                    ),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Usado só como referência percentual no dashboard; não bloqueia novos agendamentos.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="session-price">Valor da sessão (R$)</Label>
                <Input
                  id="session-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={draft.sessionPrice}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      sessionPrice: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Referência para estimar valor recebido em dia/semana/mês.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly-goal">Meta financeira mensal (R$)</Label>
                <Input
                  id="monthly-goal"
                  type="number"
                  min={0}
                  step="0.01"
                  value={draft.monthlyRevenueGoal}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      monthlyRevenueGoal: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Usada para mostrar progresso financeiro no dashboard.
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-md border bg-background p-3">
              <Label className="text-sm font-medium">Durações de atendimento</Label>
              <div className="flex flex-wrap gap-2">
                {draft.appointmentDurations.map((duration) => (
                  <span
                    key={duration}
                    className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-200"
                  >
                    {duration === 60
                      ? "1 hora"
                      : duration === 90
                        ? "1h30"
                        : duration === 120
                          ? "2 horas"
                          : `${duration} min`}
                    <button
                      type="button"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-cyan-200/70 dark:hover:bg-cyan-500/30"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          appointmentDurations:
                            prev.appointmentDurations.length <= 1
                              ? prev.appointmentDurations
                              : prev.appointmentDurations.filter((x) => x !== duration),
                        }))
                      }
                      aria-label={`Remover duração ${duration} minutos`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="number"
                  min={15}
                  max={240}
                  step={5}
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  placeholder="Ex.: 75"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    const parsed = Math.round(Number(newDuration));
                    if (!Number.isFinite(parsed) || parsed < 15 || parsed > 240) {
                      toast.error("Informe uma duração entre 15 e 240 minutos.");
                      return;
                    }
                    setDraft((prev) => ({
                      ...prev,
                      appointmentDurations: [...new Set([...prev.appointmentDurations, parsed])].sort(
                        (a, b) => a - b
                      ),
                    }));
                    setNewDuration("");
                  }}
                >
                  <PlusCircle className="h-4 w-4" />
                  Adicionar duração
                </Button>
              </div>
            </div>

            <div className="space-y-3 rounded-md border bg-background p-3">
              <Label className="text-sm font-medium">Tipos de atendimento</Label>
              <div className="flex flex-wrap gap-2">
                {draft.appointmentTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-900 dark:bg-violet-500/20 dark:text-violet-200"
                  >
                    {type}
                    <button
                      type="button"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-violet-200/70 dark:hover:bg-violet-500/30"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          appointmentTypes:
                            prev.appointmentTypes.length <= 1
                              ? prev.appointmentTypes
                              : prev.appointmentTypes.filter((x) => x !== type),
                        }))
                      }
                      aria-label={`Remover tipo ${type}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder="Ex.: Ventosaterapia"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    const trimmed = newType.trim();
                    if (trimmed.length < 2) {
                      toast.error("Digite um tipo de atendimento válido.");
                      return;
                    }
                    setDraft((prev) => ({
                      ...prev,
                      appointmentTypes: [...new Set([...prev.appointmentTypes, trimmed])],
                    }));
                    setNewType("");
                  }}
                >
                  <PlusCircle className="h-4 w-4" />
                  Adicionar tipo
                </Button>
              </div>
            </div>
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
