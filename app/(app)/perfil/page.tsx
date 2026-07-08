"use client";

import * as React from "react";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserCircle, Save, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormFieldError } from "@/components/form-field-error";
import { useClinicSettings } from "@/lib/clinic-settings";
import {
  userProfileFormSchema,
  emptyUserProfileForm,
  type UserProfileFormValues,
} from "@/lib/schemas/user-profile-form";
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from "@/lib/schemas/change-password-form";
import { MAX_PATIENT_ATTACHMENT_BYTES } from "@/lib/patient-attachment-utils";
import { fisioKeys, useAuthMe } from "@/lib/api/hooks/use-fisio";
import { patchAuthProfile, type AuthMeResponse } from "@/lib/auth-me-api";
import { SignaturePad } from "@/components/perfil/signature-pad";

const MAX_PHOTO_BYTES = Math.min(MAX_PATIENT_ATTACHMENT_BYTES, 400 * 1024);

function valuesFromMe(me: AuthMeResponse): UserProfileFormValues {
  return {
    fullName: me.name,
    crefitoNumber: me.crefito,
    professionalEmail: me.professionalEmail?.trim() || me.email,
    phone: me.phone ?? "",
    professionalTitle: me.professionalTitle ?? "",
    notes: me.notes ?? "",
    photoDataUrl: me.photoDataUrl ?? "",
    signatureImageDataUrl: me.signatureImage ?? "",
  };
}

export default function PerfilPage() {
  const queryClient = useQueryClient();
  const { settings, setSettings } = useClinicSettings();
  const { data: me, isLoading: meLoading, isError: meError } = useAuthMe();
  const photoRef = React.useRef<HTMLInputElement>(null);

  const mergedDefaults = React.useMemo((): UserProfileFormValues => {
    if (!me) return emptyUserProfileForm();
    return valuesFromMe(me);
  }, [me]);

  const form = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileFormSchema),
    defaultValues: mergedDefaults,
  });

  React.useEffect(() => {
    if (me) form.reset(valuesFromMe(me));
  }, [me, form]);

  const onSubmit = async (values: UserProfileFormValues) => {
    try {
      await patchAuthProfile({
        name: values.fullName.trim(),
        phone: values.phone.trim(),
        crefito: values.crefitoNumber.trim(),
        professionalTitle: values.professionalTitle.trim(),
        professionalEmail: values.professionalEmail.trim(),
        notes: values.notes.trim(),
        photoDataUrl: values.photoDataUrl?.trim() || "",
        signatureImage: values.signatureImageDataUrl?.trim() || "",
      });
      await queryClient.invalidateQueries({ queryKey: fisioKeys.authMe });
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Não foi possível concluir a gravação. Verifique os dados e tente novamente.",
      );
      return;
    }
    setSettings({
      therapistName: values.fullName.trim(),
      therapistPhone: values.phone.trim(),
    });
    toast.success("Alterações do perfil gravadas com sucesso.");
  };

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onPasswordSubmit = async (values: ChangePasswordFormValues) => {
    const res = await fetch("/api/auth/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as
        | { message?: string; code?: string }
        | null;
      if (res.status === 429) {
        throw new Error(
          err?.message ||
            "Limite de tentativas excedido. Aguarde alguns instantes antes de solicitar nova alteração.",
        );
      }
      if (res.status === 401) {
        throw new Error(err?.message || "Sessão inválida ou expirada. Efetue login novamente.");
      }
      throw new Error(err?.message || "A alteração de senha não pôde ser concluída.");
    }
    passwordForm.reset();
    toast.success("Senha atualizada com sucesso.");
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Utilize apenas arquivo de imagem (por exemplo JPEG ou PNG).");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("O arquivo excede o tamanho máximo permitido (aproximadamente 400 KB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      form.setValue("photoDataUrl", dataUrl, { shouldDirty: true });
      toast.message("Pré-visualização da foto atualizada. Grave o perfil para persistir a alteração.");
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    form.setValue("photoDataUrl", "", { shouldDirty: true });
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = form;
  const photoUrl = useWatch({
    control: form.control,
    name: "photoDataUrl",
  });
  const signatureUrl = useWatch({
    control: form.control,
    name: "signatureImageDataUrl",
  });
  const passwordState = passwordForm.formState;

  if (meLoading) {
    return (
      <div className="p-8 text-muted-foreground max-w-2xl">Carregando informações do perfil…</div>
    );
  }

  if (meError || !me) {
    return (
      <div className="p-8 max-w-2xl space-y-2">
        <h1 className="text-2xl font-bold">Meu perfil</h1>
        <p className="text-destructive">
          Não foi possível carregar os dados do perfil. Verifique a autenticação e a disponibilidade do serviço.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <UserCircle className="h-8 w-8 text-primary" />
          Meu perfil
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Foto do perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border bg-muted">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt=""
                  width={80}
                  height={80}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs text-center p-1">
                  Nenhuma foto
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={onPhoto}
              />
              <Button type="button" variant="outline" className="gap-2" onClick={() => photoRef.current?.click()}>
                <Camera className="h-4 w-4" />
                Selecionar foto
              </Button>
              {photoUrl ? (
                <Button type="button" variant="ghost" onClick={clearPhoto}>
                  Remover foto
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados profissionais e de contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="perfil-nome">Nome completo</Label>
              <Input id="perfil-nome" {...register("fullName")} aria-invalid={!!errors.fullName} />
              <FormFieldError message={errors.fullName?.message} id="perfil-nome-err" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="perfil-crefito">Registro CREFITO</Label>
              <Input
                id="perfil-crefito"
                placeholder="Ex.: 123456-F"
                {...register("crefitoNumber")}
                aria-invalid={!!errors.crefitoNumber}
              />
              <FormFieldError message={errors.crefitoNumber?.message} id="perfil-crefito-err" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="perfil-mail">E-mail profissional</Label>
                <Input
                  id="perfil-mail"
                  type="email"
                  autoComplete="email"
                  {...register("professionalEmail")}
                  aria-invalid={!!errors.professionalEmail}
                />
                <FormFieldError message={errors.professionalEmail?.message} id="perfil-mail-err" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="perfil-tel">Telefone profissional</Label>
                <Input id="perfil-tel" {...register("phone")} aria-invalid={!!errors.phone} />
                <FormFieldError message={errors.phone?.message} id="perfil-tel-err" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="perfil-titulo">Título ou função (documentos PDF)</Label>
              <Input
                id="perfil-titulo"
                placeholder="Ex.: Fisioterapeuta"
                {...register("professionalTitle")}
                aria-invalid={!!errors.professionalTitle}
              />
              <FormFieldError message={errors.professionalTitle?.message} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="perfil-obs">Observações internas</Label>
              <Textarea id="perfil-obs" rows={3} {...register("notes")} />
              <FormFieldError message={errors.notes?.message} />
            </div>
            <input type="hidden" {...register("photoDataUrl")} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assinatura (documentos PDF)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Usada no rodapé do prontuário em PDF, junto do seu nome e registro CREFITO.
              Desenhe abaixo e grave o perfil para salvar.
            </p>
          </CardHeader>
          <CardContent>
            <SignaturePad
              value={signatureUrl ?? ""}
              onChange={(dataUrl) =>
                form.setValue("signatureImageDataUrl", dataUrl, { shouldDirty: true })
              }
              disabled={isSubmitting}
            />
            <input type="hidden" {...register("signatureImageDataUrl")} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Segurança e credenciais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="perfil-current-password">Senha atual</Label>
                <Input
                  id="perfil-current-password"
                  type="password"
                  autoComplete="current-password"
                  {...passwordForm.register("currentPassword")}
                  aria-invalid={!!passwordState.errors.currentPassword}
                />
                <FormFieldError message={passwordState.errors.currentPassword?.message} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="perfil-new-password">Nova senha</Label>
                <Input
                  id="perfil-new-password"
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register("newPassword")}
                  aria-invalid={!!passwordState.errors.newPassword}
                />
                <FormFieldError message={passwordState.errors.newPassword?.message} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="perfil-confirm-password">Confirmar nova senha</Label>
                <Input
                  id="perfil-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register("confirmNewPassword")}
                  aria-invalid={!!passwordState.errors.confirmNewPassword}
                />
                <FormFieldError message={passwordState.errors.confirmNewPassword?.message} />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={passwordState.isSubmitting}
                onClick={passwordForm.handleSubmit(async (values) => {
                  try {
                    await onPasswordSubmit(values);
                  } catch (err) {
                    toast.error(
                      err instanceof Error
                        ? err.message
                        : "A alteração de senha não pôde ser concluída. Tente novamente.",
                    );
                  }
                })}
              >
                {passwordState.isSubmitting ? "Processando…" : "Alterar senha"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="gap-2" disabled={!isDirty || isSubmitting}>
          <Save className="h-4 w-4" />
          {isSubmitting ? "Gravando…" : "Salvar alterações"}
        </Button>
      </form>
    </div>
  );
}
