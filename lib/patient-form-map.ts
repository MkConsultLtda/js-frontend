import { toLocalDateString } from "@/lib/date-utils";
import type { PatientCreateFormValues, PatientEditFormValues } from "@/lib/schemas/patient-form";
import type { Patient } from "@/lib/types";

export const emptyPatientCreateFormValues: PatientCreateFormValues = {
  name: "",
  birthDate: "",
  email: "",
  cpf: "",
  diagnosis: "",
  phone: "",
  responsiblePhone: "",
  profession: "",
  educationLevel: "",
  referralSource: "",
  addressCep: "",
  addressLogradouro: "",
  addressNumero: "",
  addressComplemento: "",
  addressBairro: "",
  addressCidade: "",
  addressUf: "",
};

export function patientFromCreateForm(data: PatientCreateFormValues): Omit<Patient, "id"> {
  const cpf = data.cpf.trim();
  return {
    name: data.name,
    birthDate: data.birthDate,
    email: data.email.trim(),
    ...(cpf ? { cpf } : {}),
    diagnosis: data.diagnosis,
    phone: data.phone.trim(),
    responsiblePhone: data.responsiblePhone.trim() || undefined,
    profession: data.profession.trim() || undefined,
    educationLevel: data.educationLevel.trim() || undefined,
    referralSource: data.referralSource.trim() || undefined,
    address: {
      cep: data.addressCep,
      logradouro: data.addressLogradouro,
      numero: data.addressNumero,
      complemento: data.addressComplemento.trim(),
      bairro: data.addressBairro,
      cidade: data.addressCidade,
      uf: data.addressUf,
    },
    status: "active",
    lastSession: new Date().toLocaleDateString("pt-BR"),
    registeredAt: toLocalDateString(new Date()),
  };
}

export function patientFromEditForm(editing: Patient, data: PatientEditFormValues): Patient {
  const cpf = data.cpf.trim();
  return {
    ...editing,
    name: data.name,
    birthDate: data.birthDate,
    email: data.email.trim(),
    cpf: cpf || undefined,
    diagnosis: data.diagnosis,
    phone: data.phone.trim(),
    responsiblePhone: data.responsiblePhone.trim() || undefined,
    profession: data.profession.trim() || undefined,
    educationLevel: data.educationLevel.trim() || undefined,
    referralSource: data.referralSource.trim() || undefined,
    address: {
      cep: data.addressCep,
      logradouro: data.addressLogradouro,
      numero: data.addressNumero,
      complemento: data.addressComplemento.trim(),
      bairro: data.addressBairro,
      cidade: data.addressCidade,
      uf: data.addressUf,
    },
    status: data.status,
  };
}

export function patientToEditFormValues(p: Patient): PatientEditFormValues {
  return {
    name: p.name,
    birthDate: p.birthDate,
    email: p.email,
    cpf: p.cpf ?? "",
    diagnosis: p.diagnosis,
    phone: p.phone,
    responsiblePhone: p.responsiblePhone ?? "",
    profession: p.profession ?? "",
    educationLevel: p.educationLevel ?? "",
    referralSource: p.referralSource ?? "",
    addressCep: p.address.cep,
    addressLogradouro: p.address.logradouro,
    addressNumero: p.address.numero,
    addressComplemento: p.address.complemento,
    addressBairro: p.address.bairro,
    addressCidade: p.address.cidade,
    addressUf: p.address.uf,
    status: p.status,
  };
}
