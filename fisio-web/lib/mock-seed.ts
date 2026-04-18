import { addDays, startOfWeekMonday, toLocalDateString } from "@/lib/date-utils";
import type { Anamnese, Appointment, Evolucao, Patient } from "@/lib/types";

function addr(
  cep: string,
  logradouro: string,
  numero: string,
  complemento: string,
  bairro: string,
  cidade: string,
  uf: string
): Patient["address"] {
  return {
    cep: cep.replace(/\D/g, ""),
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    uf: uf.toUpperCase(),
  };
}

export function buildInitialPatients(): Patient[] {
  return [
    {
      id: 1,
      name: "Maria Silva",
      birthDate: "1980-08-12",
      email: "maria.silva@email.com",
      cpf: "123.456.789-00",
      diagnosis: "Hérnia de Disco L4-L5",
      phone: "(11) 98888-7777",
      address: addr(
        "01310100",
        "Av. Paulista",
        "1000",
        "Apto 42",
        "Bela Vista",
        "São Paulo",
        "SP"
      ),
      lastSession: "18/03/2026",
      status: "active",
      registeredAt: "2026-01-10",
    },
    {
      id: 2,
      name: "João Santos",
      birthDate: "1993-11-05",
      email: "joao.santos@email.com",
      diagnosis: "Pós-operatório de LCA",
      phone: "(11) 97777-6666",
      address: addr("05407002", "Rua dos Pinheiros", "450", "", "Pinheiros", "São Paulo", "SP"),
      lastSession: "19/03/2026",
      status: "active",
      registeredAt: "2026-01-15",
    },
    {
      id: 3,
      name: "Ana Oliveira",
      birthDate: "1967-04-22",
      email: "ana.oliveira@email.com",
      diagnosis: "Artrite Reumatoide",
      phone: "(11) 96666-5555",
      address: addr("05078001", "Rua Cardoso de Almeida", "120", "Casa 2", "Perdizes", "São Paulo", "SP"),
      lastSession: "15/03/2026",
      status: "active",
      registeredAt: "2026-02-01",
    },
    {
      id: 4,
      name: "José Carlos",
      birthDate: "1998-01-30",
      email: "",
      diagnosis: "Tendinite de Aquiles",
      phone: "(11) 95555-4444",
      address: addr("03115000", "Rua Vergueiro", "2500", "Bloco B", "Vila Mariana", "São Paulo", "SP"),
      lastSession: "10/03/2026",
      status: "inactive",
      registeredAt: "2025-11-01",
    },
    {
      id: 5,
      name: "Pedro Rocha",
      birthDate: "1984-06-18",
      email: "pedro.rocha@email.com",
      diagnosis: "Epicondilite lateral",
      phone: "(11) 94444-3333",
      address: addr("04551000", "Rua Funchal", "88", "", "Vila Olímpia", "São Paulo", "SP"),
      lastSession: "20/03/2026",
      status: "active",
      registeredAt: "2026-04-01",
    },
  ];
}

export function buildInitialAppointments(): Appointment[] {
  const now = new Date();
  const today = toLocalDateString(now);
  const monday = startOfWeekMonday(now);

  const day = (offset: number) => toLocalDateString(addDays(monday, offset));

  return [
    {
      id: 1,
      patientId: 1,
      patientName: "Maria Silva",
      date: today,
      time: "08:00",
      duration: 50,
      type: "Fisioterapia Motora",
      status: "confirmed",
    },
    {
      id: 2,
      patientId: 2,
      patientName: "João Santos",
      date: today,
      time: "09:00",
      duration: 50,
      type: "Avaliação Inicial",
      status: "confirmed",
    },
    {
      id: 3,
      patientId: 4,
      patientName: "José Carlos",
      date: today,
      time: "10:30",
      duration: 50,
      type: "Acupuntura",
      status: "pending",
    },
    {
      id: 4,
      patientId: 3,
      patientName: "Ana Oliveira",
      date: today,
      time: "14:00",
      duration: 50,
      type: "RPG",
      status: "confirmed",
    },
    {
      id: 5,
      patientId: 5,
      patientName: "Pedro Rocha",
      date: today,
      time: "16:00",
      duration: 50,
      type: "Fisioterapia Esportiva",
      status: "pending",
    },
    {
      id: 6,
      patientId: 2,
      patientName: "João Santos",
      date: day(0),
      time: "14:00",
      duration: 50,
      type: "Fisioterapia Motora",
      status: "confirmed",
    },
    {
      id: 7,
      patientId: 3,
      patientName: "Ana Oliveira",
      date: day(1),
      time: "10:00",
      duration: 50,
      type: "RPG",
      status: "confirmed",
    },
    {
      id: 8,
      patientId: 1,
      patientName: "Maria Silva",
      date: day(2),
      time: "11:00",
      duration: 50,
      type: "Pilates",
      status: "pending",
    },
    {
      id: 9,
      patientId: 5,
      patientName: "Pedro Rocha",
      date: day(3),
      time: "15:30",
      duration: 50,
      type: "Avaliação Inicial",
      status: "confirmed",
    },
    {
      id: 10,
      patientId: 4,
      patientName: "José Carlos",
      date: day(4),
      time: "09:30",
      duration: 50,
      type: "Acupuntura",
      status: "cancelled",
    },
    {
      id: 11,
      patientId: 2,
      patientName: "João Santos",
      date: day(5),
      time: "08:30",
      duration: 50,
      type: "Fisioterapia Esportiva",
      status: "confirmed",
    },
  ];
}

export function buildInitialAnamneses(patients: Patient[]): Anamnese[] {
  return [
    {
      id: 1,
      patientId: 1,
      patientName: patients.find((p) => p.id === 1)?.name ?? "Maria Silva",
      dataColeta: "15/03/2026",
      queixaPrincipal: "Dor lombar intensa",
      historiaDoenca:
        "Paciente apresenta dor lombar há 3 meses, iniciou após levantamento de peso. Dor irradia para membro inferior direito.",
      antecedentesFamiliares: "Pai com hérnia de disco",
      medicamentos: "Nenhum",
      alergias: "Nenhuma conhecida",
      habitosVida: "Sedentária, trabalha sentada 8h/dia",
      exameFisico:
        "Diminuição da amplitude de movimento lombar, teste de Lasègue positivo à direita",
      diagnosticoFisioterapico: "Hérnia de disco L4-L5",
      objetivosTratamento: "Reduzir dor, melhorar mobilidade, prevenir recorrências",
    },
  ];
}

export function buildInitialEvolucoes(patients: Patient[]): Evolucao[] {
  return [
    {
      id: 1,
      patientId: 1,
      patientName: patients.find((p) => p.id === 1)?.name ?? "Maria Silva",
      dataSessao: "18/03/2026",
      tipoSessao: "Fisioterapia Motora",
      objetivosSessao: "Melhorar mobilidade lombar e reduzir dor",
      atividadesRealizadas: "Exercícios de alongamento, fortalecimento abdominal, RPG",
      respostaPaciente: "Boa resposta aos exercícios, relatou diminuição da dor",
      dorPre: 7,
      dorPos: 4,
      observacoes: "Paciente progredindo bem, manter protocolo atual",
      planoProximaSessao: "Continuar exercícios + adicionar hidroterapia",
    },
  ];
}
