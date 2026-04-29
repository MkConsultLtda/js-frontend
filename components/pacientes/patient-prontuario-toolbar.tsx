"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileDown, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  apiDeleteAttachment,
  apiUploadAttachment,
  fetchAttachmentsForPatient,
} from "@/lib/api/fisio-api";
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
import type { Anamnese, Appointment, Evolucao, Patient } from "@/lib/types";
import { isSessionAppointment } from "@/lib/types";

type Props = {
  patient: Patient;
  patientId: number;
  appointments: Appointment[];
  anamneses: Anamnese[];
  evolucoes: Evolucao[];
};

export function PatientProntuarioToolbar({
  patient,
  patientId,
  appointments,
  anamneses,
  evolucoes,
}: Props) {
  const queryClient = useQueryClient();

  const { data: patientAttachments = [] } = useQuery({
    queryKey: ["patient-attachments", patientId],
    queryFn: () => fetchAttachmentsForPatient(patientId),
    staleTime: 10_000,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => apiUploadAttachment(patientId, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["patient-attachments", patientId],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDeleteAttachment(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["patient-attachments", patientId],
      });
    },
  });

  const sortedAtt = React.useMemo(
    () =>
      [...patientAttachments].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    [patientAttachments],
  );

  const fileRef = React.useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_PATIENT_ATTACHMENT_BYTES) {
      toast.error(
        `Arquivo muito grande. Tamanho máximo: ${formatBytes(MAX_PATIENT_ATTACHMENT_BYTES)}.`,
      );
      return;
    }
    if (!isAllowedAttachmentMime(file.type)) {
      toast.error("Formato não suportado. Use PDF, JPEG, PNG, GIF ou WebP.");
      return;
    }
    void (async () => {
      try {
        await uploadMutation.mutateAsync(file);
        toast.success("Upload concluído.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Não foi possível enviar o arquivo.",
        );
      }
    })();
  };

  const handleDelete = async (attachmentId: number) => {
    try {
      await deleteMutation.mutateAsync(attachmentId);
      toast.message("Anexo removido.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover.");
    }
  };

  const myAptForPatient = React.useMemo(
    () =>
      appointments.filter(
        (a) => isSessionAppointment(a) && a.patientId === patientId,
      ),
    [appointments, patientId],
  );

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          Anexos e relatórios (PDF)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Anexos são armazenados no servidor (URL pré-assinada para download). PDFs combinam dados
          carregados do backend para este paciente.
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

        {sortedAtt.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {sortedAtt.map((a) => {
              const url = a.downloadUrl;
              return (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{a.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(a.sizeBytes)} ·{" "}
                      {new Date(a.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {url ? (
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={a.fileName}
                        >
                          Abrir
                        </a>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" disabled>
                        Abrir
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(a.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
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
                  downloadProntuarioPdf(patient, anamneses, evolucoes, myAptForPatient);
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
                  downloadEvolucaoPdf(patient, evolucoes);
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
                  downloadAtendimentosPdf(patient, myAptForPatient);
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
