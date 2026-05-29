"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Landmark } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useClinicProfile, useUpdateClinicProfile } from "@/lib/api/hooks/use-fisio";
import { formatUserFacingApiError } from "@/lib/api/backend-client";
import type { ClinicProfileUpdate } from "@/lib/clinic-profile-api";

const EMPTY: ClinicProfileUpdate = {
  cnpj: "",
  address: "",
  city: "",
  state: "",
  contactEmail: "",
  contactPhone: "",
  dpoName: "",
  dpoEmail: "",
};

export function ClinicInstitutionalCard() {
  const { data, isLoading, isError } = useClinicProfile();
  const update = useUpdateClinicProfile();
  const [draft, setDraft] = useState<ClinicProfileUpdate>(EMPTY);

  useEffect(() => {
    if (data) {
      setDraft({
        cnpj: data.cnpj,
        address: data.address,
        city: data.city,
        state: data.state,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        dpoName: data.dpoName,
        dpoEmail: data.dpoEmail,
      });
    }
  }, [data]);

  const setField = (field: keyof ClinicProfileUpdate, value: string) =>
    setDraft((d) => ({ ...d, [field]: value }));

  const save = async () => {
    try {
      await update.mutateAsync({ ...draft, state: draft.state.toUpperCase() });
      toast.success("Dados institucionais salvos.");
    } catch (error) {
      toast.error(formatUserFacingApiError(error, "Não foi possível salvar os dados institucionais."));
    }
  };

  const disabled = isLoading || update.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Landmark className="h-5 w-5" />
          Dados institucionais (LGPD)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Usados nos documentos legais (Termos de Uso e Política de Privacidade) e no contato com pacientes.
          Sincronizados automaticamente com sua conta.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError ? (
          <p className="text-sm text-destructive">
            Não foi possível carregar os dados institucionais. Recarregue a página.
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="clinic-cnpj">CNPJ (opcional)</Label>
            <Input
              id="clinic-cnpj"
              value={draft.cnpj}
              disabled={disabled}
              onChange={(e) => setField("cnpj", e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic-phone">Telefone de contato</Label>
            <Input
              id="clinic-phone"
              value={draft.contactPhone}
              disabled={disabled}
              onChange={(e) => setField("contactPhone", e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clinic-address">Endereço</Label>
          <Input
            id="clinic-address"
            value={draft.address}
            disabled={disabled}
            onChange={(e) => setField("address", e.target.value)}
            placeholder="Rua, número, bairro"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
          <div className="space-y-2">
            <Label htmlFor="clinic-city">Cidade</Label>
            <Input
              id="clinic-city"
              value={draft.city}
              disabled={disabled}
              onChange={(e) => setField("city", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic-state">UF</Label>
            <Input
              id="clinic-state"
              value={draft.state}
              disabled={disabled}
              maxLength={2}
              onChange={(e) => setField("state", e.target.value.toUpperCase())}
              placeholder="SP"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clinic-email">E-mail de contato</Label>
          <Input
            id="clinic-email"
            type="email"
            value={draft.contactEmail}
            disabled={disabled}
            onChange={(e) => setField("contactEmail", e.target.value)}
            placeholder="contato@suaclinica.com.br"
          />
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
          <p className="text-sm font-medium">Encarregado de dados (DPO)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dpo-name">Nome do encarregado</Label>
              <Input
                id="dpo-name"
                value={draft.dpoName}
                disabled={disabled}
                onChange={(e) => setField("dpoName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dpo-email">E-mail do encarregado</Label>
              <Input
                id="dpo-email"
                type="email"
                value={draft.dpoEmail}
                disabled={disabled}
                onChange={(e) => setField("dpoEmail", e.target.value)}
                placeholder="dpo@suaclinica.com.br"
              />
            </div>
          </div>
        </div>

        <Button type="button" onClick={() => void save()} disabled={disabled}>
          {update.isPending ? "Salvando..." : "Salvar dados institucionais"}
        </Button>
      </CardContent>
    </Card>
  );
}
