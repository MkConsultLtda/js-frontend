"use client";

import * as React from "react";
import { toast } from "sonner";
import { FileDown, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMockData } from "@/components/mock-data-provider";
import {
  downloadAtendimentosPdf,
  downloadEvolucaoPdf,
  downloadProntuarioPdf,
} from "@/lib/patient-pdf";
import {
  formatBytes,
  isAllowedAttachmentMime,
  MAX_PATIENT_ATTACHMENT_BYTES,
} from "@/lib/patient-attachment-utils";

const MAX_DATA_URL_LEN = 1_400_000;

type Props = {
  patientId: number;
};

export function PatientProntuarioToolbar({ patientId }: Props) {
  const {
    patients,
    anamneses,
    evolucoes,
    appointments,
    patientAttachments,
    addPatientAttachment,
    deletePatientAttachment,
  } = useMockData();
  const fileRef = React.useRef<HTMLInputElement>(null);

  const patient = patients.find((p) => p.id === patientId);
  const myAna = anamneses.filter((a) => a.patientId === patientId);
  const myEvo = evolucoes.filter((e) => e.patientId === patientId);
  const myApt = appointments;
  const myAtt = patientAttachments
    .filter((a) => a.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (!patient) return null;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_PATIENT_ATTACHMENT_BYTES) {
      toast.error(`Arquivo muito grande. Tamanho máximo: ${formatBytes(MAX_PATIENT_ATTACHMENT_BYTES)}.`);
      return;
    }
    if (!isAllowedAttachmentMime(file.type)) {
      toast.error("Formato não suportado. Use PDF, JPEG, PNG, GIF ou WebP.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (typeof dataUrl !== "string" || dataUrl.length > MAX_DATA_URL_LEN) {
        toast.error("Arquivo excede o limite seguro de armazenamento local. Tente um arquivo menor.");
        return;
      }
      addPatientAttachment({
        patientId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        createdAt: new Date().toISOString(),
        dataUrl,
      });
      toast.success("Anexo adicionado ao prontuário.");
    };
    reader.onerror = () => toast.error("Não foi possível ler o arquivo.");
    reader.readAsDataURL(file);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          Anexos e relatórios (PDF)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Anexos ficam salvos neste navegador (dados de demonstração). PDFs reúnem anamnese, evolução e
          agendamentos deste paciente.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            accept="application/pdf,image/*"
            onChange={onFile}
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2 w-fit"
            onClick={() => fileRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
            Adicionar anexo
          </Button>
        </div>

        {myAtt.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {myAtt.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{a.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(a.sizeBytes)} · {new Date(a.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <a href={a.dataUrl} download={a.fileName} target="_blank" rel="noopener noreferrer">
                      Abrir
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      deletePatientAttachment(a.id);
                      toast.message("Anexo removido.");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum anexo ainda. Use o botão acima.</p>
        )}

        <div className="border-t pt-4 space-y-2">
          <p className="text-sm font-medium">Gerar PDF</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="secondary"
              className="gap-2 w-fit"
              onClick={() => {
                try {
                  downloadProntuarioPdf(patient, myAna, myEvo, myApt);
                  toast.message("Download do prontuário iniciado.");
                } catch {
                  toast.error("Falha ao gerar o PDF. Tente novamente.");
                }
              }}
            >
              <FileDown className="h-4 w-4" />
              Prontuário (anamnese + evolução + agenda)
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="gap-2 w-fit"
              onClick={() => {
                try {
                  downloadEvolucaoPdf(patient, myEvo);
                  toast.message("Download da evolução iniciado.");
                } catch {
                  toast.error("Falha ao gerar o PDF. Tente novamente.");
                }
              }}
            >
              <FileDown className="h-4 w-4" />
              Só evolução
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="gap-2 w-fit"
              onClick={() => {
                try {
                  downloadAtendimentosPdf(patient, myApt);
                  toast.message("Download do histórico de atendimentos iniciado.");
                } catch {
                  toast.error("Falha ao gerar o PDF. Tente novamente.");
                }
              }}
            >
              <FileDown className="h-4 w-4" />
              Histórico de atendimentos
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
