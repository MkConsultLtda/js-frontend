"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import {
  clearPersistedMockState,
  loadPersistedMockState,
  savePersistedMockState,
} from "@/lib/mock-persistence";
import {
  createInitialMockState,
  mockReducer,
  type MockState,
} from "@/lib/mock-reducer";
import type { Anamnese, Appointment, Evolucao, Patient } from "@/lib/types";

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
  resetMockDataToSeed: () => void;
  clearAuditLog: () => void;
};

const MockDataContext = createContext<MockDataContextValue | null>(null);

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mockReducer, undefined, createInitialMockState);
  const [persistReady, setPersistReady] = useState(false);

  useEffect(() => {
    const loaded = loadPersistedMockState();
    if (loaded) {
      dispatch({ type: "HYDRATE", payload: loaded });
    }
    setPersistReady(true);
  }, []);

  useEffect(() => {
    if (!persistReady) return;
    savePersistedMockState(state);
  }, [state, persistReady]);

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

  const resetMockDataToSeed = useCallback(() => {
    clearPersistedMockState();
    dispatch({ type: "RESET" });
  }, []);

  const clearAuditLog = useCallback(() => {
    dispatch({ type: "CLEAR_AUDIT_LOG" });
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
      resetMockDataToSeed,
      clearAuditLog,
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
      resetMockDataToSeed,
      clearAuditLog,
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
