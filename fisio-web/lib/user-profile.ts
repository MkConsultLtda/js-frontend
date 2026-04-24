"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { UserProfileFormValues } from "@/lib/schemas/user-profile-form";
import { emptyUserProfileForm } from "@/lib/schemas/user-profile-form";

const STORAGE_KEY = "fisio_user_profile_v1";
const listeners = new Set<() => void>();

export type UserProfileState = UserProfileFormValues;

const defaults: UserProfileState = emptyUserProfileForm();

let cachedSnapshot: UserProfileState = defaults;
let cachedRawSnapshot: string | null = null;

function load(): UserProfileState {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<UserProfileState>;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

function emitChange() {
  for (const l of listeners) l();
}

function persist(next: UserProfileState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  emitChange();
}

export function getUserProfileSnapshot(): UserProfileState {
  const next = load();
  const raw = JSON.stringify(next);
  if (raw === cachedRawSnapshot) return cachedSnapshot;
  cachedRawSnapshot = raw;
  cachedSnapshot = next;
  return cachedSnapshot;
}

export function useUserProfile() {
  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  const getSnapshot = useCallback(() => getUserProfileSnapshot(), []);

  const profile = useSyncExternalStore(subscribe, getSnapshot, () => defaults);

  const setProfile = useCallback((next: UserProfileState | ((prev: UserProfileState) => UserProfileState)) => {
    const current = load();
    const resolved = typeof next === "function" ? (next as (p: UserProfileState) => UserProfileState)(current) : next;
    persist({ ...defaults, ...resolved });
  }, []);

  return { profile, setProfile };
}
