import { z } from "zod";

const cepDigits = z
  .string()
  .trim()
  .transform((s) => s.replace(/\D/g, ""))
  .refine((s) => s.length === 8, "CEP deve ter 8 dígitos");

export const patientCreateFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome completo")
    .max(200, "Nome muito longo"),
  birthDate: z
    .string()
    .min(1, "Informe a data de nascimento")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  email: z
    .string()
    .trim()
    .max(254)
    .refine((s) => s === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), {
      message: "E-mail inválido",
    }),
  cpf: z.string().trim().max(14, "CPF muito longo"),
  diagnosis: z.string().trim().max(500, "Texto muito longo"),
  phone: z.string().trim().min(1, "Informe o telefone").max(40, "Telefone muito longo"),
  responsiblePhone: z.string().trim().max(40, "Telefone do responsável muito longo"),
  profession: z.string().trim().max(120, "Profissão muito longa"),
  educationLevel: z.string().trim().max(120, "Escolaridade muito longa"),
  referralSource: z.string().trim().max(120, "Indicação muito longa"),
  addressCep: cepDigits,
  addressLogradouro: z
    .string()
    .trim()
    .min(1, "Informe o logradouro")
    .max(200, "Máximo 200 caracteres"),
  addressNumero: z
    .string()
    .trim()
    .min(1, "Informe o número")
    .max(20, "Máximo 20 caracteres"),
  addressComplemento: z.string().trim().max(120),
  addressBairro: z
    .string()
    .trim()
    .min(1, "Informe o bairro")
    .max(120, "Máximo 120 caracteres"),
  addressCidade: z
    .string()
    .trim()
    .min(1, "Informe a cidade")
    .max(120, "Máximo 120 caracteres"),
  addressUf: z
    .string()
    .trim()
    .length(2, "UF com 2 letras")
    .transform((s) => s.toUpperCase()),
});

export type PatientCreateFormValues = z.infer<typeof patientCreateFormSchema>;

export const patientEditFormSchema = patientCreateFormSchema.extend({
  status: z.enum(["active", "inactive"]),
});

export type PatientEditFormValues = z.infer<typeof patientEditFormSchema>;
