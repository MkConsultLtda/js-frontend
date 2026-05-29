"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatUserFacingApiError } from "@/lib/api/backend-client";
import { usePatientMutations } from "@/lib/api/hooks/use-fisio";

type Props = {
  patientId: number;
  patientName: string;
};

export function PatientDischargeDialog({ patientId, patientName }: Props) {
  const [open, setOpen] = React.useState(false);
  const [summary, setSummary] = React.useState("");
  const { dischargePatient } = usePatientMutations();
  const queryClient = useQueryClient();

  const onConfirm = async () => {
    if (dischargePatient.isPending) return;
    try {
      await dischargePatient.mutateAsync({ id: patientId, dischargeSummary: summary });
      await queryClient.invalidateQueries({ queryKey: ["patient-bundle", patientId] });
      setOpen(false);
      setSummary("");
      toast.success("Alta registrada com sucesso.");
    } catch (err) {
      toast.error(formatUserFacingApiError(err, "Não foi possível registrar a alta."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2 w-fit">
          <LogOut className="h-4 w-4" />
          Registrar alta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alta fisioterapêutica</DialogTitle>
          <DialogDescription>
            Confirma a alta de <strong>{patientName}</strong>? O status passará para &quot;Alta&quot;
            e a data será registrada hoje.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="discharge-summary">Resumo da alta (opcional)</Label>
          <Textarea
            id="discharge-summary"
            rows={4}
            placeholder="Evolução final, orientações, encaminhamentos…"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void onConfirm()} disabled={dischargePatient.isPending}>
            {dischargePatient.isPending ? "Registrando…" : "Confirmar alta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
