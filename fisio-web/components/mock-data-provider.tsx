"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { nextNumericId } from "@/lib/id";
import {
  buildInitialAnamneses,
  buildInitialAppointments,
  buildInitialEvolucoes,
  buildInitialPatients,
} from "@/lib/mock-seed";
import type { Anamnese, Appointment, Evolucao, Patient } from "@/lib/types";

type MockState = {
  patients: Patient[];
  appointments: Appointment[];
  anamneses: Anamnese[];
  evolucoes: Evolucao[];
};

type Action =
  | { type: "ADD_PATIENT"; payload: Omit<Patient, "id"> }
  | { type: "UPDATE_PATIENT"; payload: Patient }
  | { type: "DELETE_PATIENT"; id: number }
  | { type: "ADD_APPOINTMENT"; payload: Omit<Appointment, "id"> }
  | { type: "UPDATE_APPOINTMENT"; payload: Appointment }
  | { type: "DELETE_APPOINTMENT"; id: number }
  | { type: "ADD_ANAMNESE"; payload: Omit<Anamnese, "id"> }
  | { type: "UPDATE_ANAMNESE"; payload: Anamnese }
  | { type: "DELETE_ANAMNESE"; id: number }
  | { type: "ADD_EVOLUCAO"; payload: Omit<Evolucao, "id"> }
  | { type: "UPDATE_EVOLUCAO"; payload: Evolucao }
  | { type: "DELETE_EVOLUCAO"; id: number };

function reducer(state: MockState, action: Action): MockState {
  switch (action.type) {
    case "ADD_PATIENT": {
      const id = nextNumericId(state.patients);
      return {
        ...state,
        patients: [...state.patients, { ...action.payload, id }],
      };
    }
    case "UPDATE_PATIENT":
      return {
        ...state,
        patients: state.patients.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case "DELETE_PATIENT":
      return {
        ...state,
        patients: state.patients.filter((p) => p.id !== action.id),
      };
    case "ADD_APPOINTMENT": {
      const id = nextNumericId(state.appointments);
      return {
        ...state,
        appointments: [...state.appointments, { ...action.payload, id }],
      };
    }
    case "UPDATE_APPOINTMENT":
      return {
        ...state,
        appointments: state.appointments.map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      };
    case "DELETE_APPOINTMENT":
      return {
        ...state,
        appointments: state.appointments.filter((a) => a.id !== action.id),
      };
    case "ADD_ANAMNESE": {
      const id = nextNumericId(state.anamneses);
      return {
        ...state,
        anamneses: [...state.anamneses, { ...action.payload, id }],
      };
    }
    case "UPDATE_ANAMNESE":
      return {
        ...state,
        anamneses: state.anamneses.map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      };
    case "DELETE_ANAMNESE":
      return {
        ...state,
        anamneses: state.anamneses.filter((a) => a.id !== action.id),
      };
    case "ADD_EVOLUCAO": {
      const id = nextNumericId(state.evolucoes);
      return {
        ...state,
        evolucoes: [...state.evolucoes, { ...action.payload, id }],
      };
    }
    case "UPDATE_EVOLUCAO":
      return {
        ...state,
        evolucoes: state.evolucoes.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case "DELETE_EVOLUCAO":
      return {
        ...state,
        evolucoes: state.evolucoes.filter((e) => e.id !== action.id),
      };
    default:
      return state;
  }
}

function initialState(): MockState {
  const patients = buildInitialPatients();
  return {
    patients,
    appointments: buildInitialAppointments(),
    anamneses: buildInitialAnamneses(patients),
    evolucoes: buildInitialEvolucoes(patients),
  };
}

export type MockDataContextValue = MockState & {
  addPatient: (p: Omit<Patient, "id">) => void;
  updatePatient: (p: Patient) => void;
  deletePatient: (id: number) => void;
  addAppointment: (a: Omit<Appointment, "id">) => void;
  updateAppointment: (a: Appointment) => void;
  deleteAppointment: (id: number) => void;
  addAnamnese: (a: Omit<Anamnese, "id">) => void;
  updateAnamnese: (a: Anamnese) => void;
  deleteAnamnese: (id: number) => void;
  addEvolucao: (e: Omit<Evolucao, "id">) => void;
  updateEvolucao: (e: Evolucao) => void;
  deleteEvolucao: (id: number) => void;
};

const MockDataContext = createContext<MockDataContextValue | null>(null);

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const addPatient = useCallback((payload: Omit<Patient, "id">) => {
    dispatch({ type: "ADD_PATIENT", payload });
  }, []);

  const updatePatient = useCallback((payload: Patient) => {
    dispatch({ type: "UPDATE_PATIENT", payload });
  }, []);

  const deletePatient = useCallback((id: number) => {
    dispatch({ type: "DELETE_PATIENT", id });
  }, []);

  const addAppointment = useCallback((payload: Omit<Appointment, "id">) => {
    dispatch({ type: "ADD_APPOINTMENT", payload });
  }, []);

  const updateAppointment = useCallback((payload: Appointment) => {
    dispatch({ type: "UPDATE_APPOINTMENT", payload });
  }, []);

  const deleteAppointment = useCallback((id: number) => {
    dispatch({ type: "DELETE_APPOINTMENT", id });
  }, []);

  const addAnamnese = useCallback((payload: Omit<Anamnese, "id">) => {
    dispatch({ type: "ADD_ANAMNESE", payload });
  }, []);

  const updateAnamnese = useCallback((payload: Anamnese) => {
    dispatch({ type: "UPDATE_ANAMNESE", payload });
  }, []);

  const deleteAnamnese = useCallback((id: number) => {
    dispatch({ type: "DELETE_ANAMNESE", id });
  }, []);

  const addEvolucao = useCallback((payload: Omit<Evolucao, "id">) => {
    dispatch({ type: "ADD_EVOLUCAO", payload });
  }, []);

  const updateEvolucao = useCallback((payload: Evolucao) => {
    dispatch({ type: "UPDATE_EVOLUCAO", payload });
  }, []);

  const deleteEvolucao = useCallback((id: number) => {
    dispatch({ type: "DELETE_EVOLUCAO", id });
  }, []);

  const value = useMemo<MockDataContextValue>(
    () => ({
      ...state,
      addPatient,
      updatePatient,
      deletePatient,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      addAnamnese,
      updateAnamnese,
      deleteAnamnese,
      addEvolucao,
      updateEvolucao,
      deleteEvolucao,
    }),
    [
      state,
      addPatient,
      updatePatient,
      deletePatient,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      addAnamnese,
      updateAnamnese,
      deleteAnamnese,
      addEvolucao,
      updateEvolucao,
      deleteEvolucao,
    ]
  );

  return (
    <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>
  );
}

export function useMockData(): MockDataContextValue {
  const ctx = useContext(MockDataContext);
  if (!ctx) {
    throw new Error("useMockData deve ser usado dentro de MockDataProvider");
  }
  return ctx;
}
