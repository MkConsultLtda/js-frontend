"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useUserProfile } from "@/lib/user-profile";
import { MAX_PATIENT_ATTACHMENT_BYTES } from "@/lib/patient-attachment-utils";

const MAX_PHOTO_BYTES = Math.min(MAX_PATIENT_ATTACHMENT_BYTES, 400 * 1024);

export default function PerfilPage() {
  const { settings, setSettings } = useClinicSettings();
  const { profile, setProfile } = useUserProfile();
  const photoRef = React.useRef<HTMLInputElement>(null);

  const mergedDefaults = React.useMemo((): UserProfileFormValues => {
    const base = { ...emptyUserProfileForm(), ...profile };
    if (!base.fullName.trim()) base.fullName = settings.therapistName;
    if (!base.phone.trim()) base.phone = settings.therapistPhone;
    return base;
  }, [profile, settings.therapistName, settings.therapistPhone]);

  const form = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileFormSchema),
    defaultValues: mergedDefaults,
  });

  React.useEffect(() => {
    form.reset(mergedDefaults);
  }, [form, mergedDefaults]);

  const onSubmit = (values: UserProfileFormValues) => {
    setProfile({
      ...values,
      photoDataUrl: values.photoDataUrl?.trim() || "",
    });
    setSettings({
      therapistName: values.fullName.trim(),
      therapistPhone: values.phone.trim(),
    });
    toast.success("Perfil salvo neste navegador. Nome e telefone foram alinhados às configurações da clínica.");
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem (JPEG, PNG, etc.).");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("Imagem muito grande. Use até cerca de 400 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      form.setValue("photoDataUrl", dataUrl, { shouldDirty: true });
      toast.message("Foto atualizada (pré-visualização). Salve para persistir.");
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    form.setValue("photoDataUrl", "", { shouldDirty: true });
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = form;
  const photoUrl = watch("photoDataUrl");

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UserCircle className="h-8 w-8 text-primary" />
          Meu perfil
        </h1>
        <p className="text-muted-foreground">
          Dados do fisioterapeuta (armazenados localmente). Com API, estes campos serão vinculados à sua conta.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Foto (opcional)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border bg-muted">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs text-center p-1">
                  Sem foto
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
                Carregar imagem
              </Button>
              {photoUrl ? (
                <Button type="button" variant="ghost" onClick={clearPhoto}>
                  Remover
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados profissionais</CardTitle>
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
                placeholder="ex.: 123456-F"
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
              <Label htmlFor="perfil-titulo">Título / especialidade (opcional)</Label>
              <Input
                id="perfil-titulo"
                placeholder="ex.: Fisioterapia traumato-ortopédica"
                {...register("professionalTitle")}
              />
              <FormFieldError message={errors.professionalTitle?.message} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="perfil-obs">Observações (opcional)</Label>
              <Textarea id="perfil-obs" rows={3} {...register("notes")} />
              <FormFieldError message={errors.notes?.message} />
            </div>
            <input type="hidden" {...register("photoDataUrl")} />
          </CardContent>
        </Card>

        <Button type="submit" className="gap-2" disabled={!isDirty}>
          <Save className="h-4 w-4" />
          Salvar perfil
        </Button>
      </form>
    </div>
  );
}
