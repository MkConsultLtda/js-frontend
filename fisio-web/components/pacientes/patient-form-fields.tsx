"use client";

import type { UseFormReturn } from "react-hook-form";
import { FormFieldError } from "@/components/form-field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PATIENT_EDUCATION_OPTIONS, PATIENT_REFERRAL_OPTIONS } from "@/lib/constants";
import type { PatientCreateFormValues, PatientEditFormValues } from "@/lib/schemas/patient-form";
import { fetchViaCep } from "@/lib/viacep";
import { cn } from "@/lib/utils";

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="w-full text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">
      {children}
    </p>
  );
}

type PatientFormProps = {
  form: UseFormReturn<PatientCreateFormValues> | UseFormReturn<PatientEditFormValues>;
  idPrefix: "add" | "edit";
};

export function PatientFormRows({ form: formProp, idPrefix }: PatientFormProps) {
  const form = formProp as UseFormReturn<PatientCreateFormValues>;
  const {
    register,
    setValue,
    formState: { errors: err },
  } = form;

  const fieldClass = (hasError: boolean) => cn(hasError && "border-destructive");

  const { onBlur: cepOnBlur, ...cepRegister } = register("addressCep");

  return (
    <>
      <SectionTitle>Dados pessoais</SectionTitle>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}-name`} className="text-right pt-2">
          Nome
        </Label>
        <div className="col-span-3 space-y-1">
          <Input
            id={`${idPrefix}-name`}
            className={fieldClass(!!err.name)}
            aria-invalid={!!err.name}
            aria-describedby={err.name ? `${idPrefix}-name-error` : undefined}
            {...register("name")}
          />
          <FormFieldError message={err.name?.message} id={`${idPrefix}-name-error`} />
        </div>
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}-birth`} className="text-right pt-2">
          Nascimento
        </Label>
        <div className="col-span-3 space-y-1">
          <Input
            id={`${idPrefix}-birth`}
            type="date"
            className={fieldClass(!!err.birthDate)}
            aria-invalid={!!err.birthDate}
            aria-describedby={err.birthDate ? `${idPrefix}-birth-error` : undefined}
            {...register("birthDate")}
          />
          <FormFieldError message={err.birthDate?.message} id={`${idPrefix}-birth-error`} />
        </div>
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}-cpf`} className="text-right pt-2">
          CPF
        </Label>
        <div className="col-span-3 space-y-1">
          <Input
            id={`${idPrefix}-cpf`}
            placeholder="Opcional"
            className={fieldClass(!!err.cpf)}
            aria-invalid={!!err.cpf}
            {...register("cpf")}
          />
          <FormFieldError message={err.cpf?.message} />
        </div>
      </div>

      <SectionTitle>Contato</SectionTitle>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}-email`} className="text-right pt-2">
          E-mail
        </Label>
        <div className="col-span-3 space-y-1">
          <Input
            id={`${idPrefix}-email`}
            type="email"
            autoComplete="email"
            placeholder="Opcional"
            className={fieldClass(!!err.email)}
            aria-invalid={!!err.email}
            {...register("email")}
          />
          <FormFieldError message={err.email?.message} />
        </div>
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}-phone`} className="text-right pt-2">
          Telefone
        </Label>
        <div className="col-span-3 space-y-1">
          <Input
            id={`${idPrefix}-phone`}
            type="tel"
            className={fieldClass(!!err.phone)}
            aria-invalid={!!err.phone}
            {...register("phone")}
          />
          <FormFieldError message={err.phone?.message} id={`${idPrefix}-phone-error`} />
        </div>
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}-responsible-phone`} className="text-right pt-2">
          Telefone responsável
        </Label>
        <div className="col-span-3 space-y-1">
          <Input
            id={`${idPrefix}-responsible-phone`}
            type="tel"
            placeholder="Opcional"
            className={fieldClass(!!err.responsiblePhone)}
            aria-invalid={!!err.responsiblePhone}
            {...register("responsiblePhone")}
          />
          <FormFieldError
            message={err.responsiblePhone?.message}
            id={`${idPrefix}-responsible-phone-error`}
          />
        </div>
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}-dx`} className="text-right pt-2">
          Diagnóstico
        </Label>
        <div className="col-span-3 space-y-1">
          <Input
            id={`${idPrefix}-dx`}
            className={fieldClass(!!err.diagnosis)}
            aria-invalid={!!err.diagnosis}
            {...register("diagnosis")}
          />
          <FormFieldError message={err.diagnosis?.message} id={`${idPrefix}-dx-error`} />
        </div>
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}-profession`} className="text-right pt-2">
          Profissão
        </Label>
        <div className="col-span-3 space-y-1">
          <Input
            id={`${idPrefix}-profession`}
            placeholder="Opcional"
            className={fieldClass(!!err.profession)}
            aria-invalid={!!err.profession}
            {...register("profession")}
          />
          <FormFieldError message={err.profession?.message} id={`${idPrefix}-profession-error`} />
        </div>
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}-education`} className="text-right pt-2">
          Escolaridade
        </Label>
        <div className="col-span-3 space-y-1">
          <Select
            value={form.watch("educationLevel") || "none"}
            onValueChange={(value) =>
              setValue("educationLevel", value === "none" ? "" : value, { shouldValidate: true })
            }
          >
            <SelectTrigger
              id={`${idPrefix}-education`}
              className={fieldClass(!!err.educationLevel)}
              aria-invalid={!!err.educationLevel}
            >
              <SelectValue placeholder="Selecione (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Não informado</SelectItem>
              {PATIENT_EDUCATION_OPTIONS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormFieldError message={err.educationLevel?.message} id={`${idPrefix}-education-error`} />
        </div>
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}-referral`} className="text-right pt-2">
          Indicação
        </Label>
        <div className="col-span-3 space-y-1">
          <Select
            value={form.watch("referralSource") || "none"}
            onValueChange={(value) =>
              setValue("referralSource", value === "none" ? "" : value, { shouldValidate: true })
            }
          >
            <SelectTrigger
              id={`${idPrefix}-referral`}
              className={fieldClass(!!err.referralSource)}
              aria-invalid={!!err.referralSource}
            >
              <SelectValue placeholder="Selecione (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Não informado</SelectItem>
              {PATIENT_REFERRAL_OPTIONS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormFieldError message={err.referralSource?.message} id={`${idPrefix}-referral-error`} />
        </div>
      </div>

      <SectionTitle>Endereço (domicílio)</SectionTitle>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}-cep`} className="text-right pt-2">
          CEP
        </Label>
        <div className="col-span-3 space-y-1">
          <p className="text-[11px] text-muted-foreground mb-0.5">
            Ao sair do campo com 8 dígitos, buscamos logradouro e cidade (ViaCEP).
          </p>
          <Input
            id={`${idPrefix}-cep`}
            placeholder="00000-000"
            inputMode="numeric"
            className={fieldClass(!!err.addressCep)}
            aria-invalid={!!err.addressCep}
            aria-describedby={`${idPrefix}-cep-hint ${idPrefix}-cep-error`}
            {...cepRegister}
            onBlur={async (e) => {
              await cepOnBlur(e);
              const digits = e.target.value.replace(/\D/g, "");
              if (digits.length !== 8) return;
              const data = await fetchViaCep(digits);
              if (!data) return;
              if (data.logradouro)
                setValue("addressLogradouro", data.logradouro, { shouldValidate: true });
              if (data.bairro) setValue("addressBairro", data.bairro, { shouldValidate: true });
              if (data.localidade)
                setValue("addressCidade", data.localidade, { shouldValidate: true });
              if (data.uf) setValue("addressUf", data.uf.toUpperCase(), { shouldValidate: true });
            }}
          />
          <span id={`${idPrefix}-cep-hint`} className="sr-only">
            CEP com oito dígitos; preenchimento automático opcional
          </span>
          <FormFieldError message={err.addressCep?.message} id={`${idPrefix}-cep-error`} />
        </div>
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}-log`} className="text-right pt-2">
          Logradouro
        </Label>
        <div className="col-span-3 space-y-1">
          <Input
            id={`${idPrefix}-log`}
            className={fieldClass(!!err.addressLogradouro)}
            aria-invalid={!!err.addressLogradouro}
            {...register("addressLogradouro")}
          />
          <FormFieldError message={err.addressLogradouro?.message} />
        </div>
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}-num`} className="text-right pt-2">
          Número
        </Label>
        <div className="col-span-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Input
              id={`${idPrefix}-num`}
              className={fieldClass(!!err.addressNumero)}
              aria-invalid={!!err.addressNumero}
              {...register("addressNumero")}
            />
            <FormFieldError message={err.addressNumero?.message} />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor={`${idPrefix}-comp`} className="text-xs text-muted-foreground">
              Complemento (opcional)
            </Label>
            <Input id={`${idPrefix}-comp`} {...register("addressComplemento")} />
            <FormFieldError message={err.addressComplemento?.message} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${idPrefix}-bairro`} className="text-right pt-2">
          Bairro
        </Label>
        <div className="col-span-3 space-y-1">
          <Input
            id={`${idPrefix}-bairro`}
            className={fieldClass(!!err.addressBairro)}
            aria-invalid={!!err.addressBairro}
            {...register("addressBairro")}
          />
          <FormFieldError message={err.addressBairro?.message} />
        </div>
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">Cidade / UF</Label>
        <div className="col-span-3 grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div className="sm:col-span-4 space-y-1">
            <Input
              id={`${idPrefix}-cidade`}
              placeholder="Cidade"
              className={fieldClass(!!err.addressCidade)}
              aria-invalid={!!err.addressCidade}
              {...register("addressCidade")}
            />
            <FormFieldError message={err.addressCidade?.message} />
          </div>
          <div className="space-y-1">
            <Input
              id={`${idPrefix}-uf`}
              placeholder="UF"
              maxLength={2}
              className={cn("uppercase", fieldClass(!!err.addressUf))}
              aria-invalid={!!err.addressUf}
              {...register("addressUf")}
            />
            <FormFieldError message={err.addressUf?.message} />
          </div>
        </div>
      </div>
    </>
  );
}
