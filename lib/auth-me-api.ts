export type AuthMeResponse = {
  id: number;
  email: string;
  role: string;
  name: string;
  crefito: string;
  phone: string | null;
  professionalTitle: string;
  professionalEmail: string;
  notes: string;
  photoDataUrl: string;
};

export type AuthProfilePatchBody = {
  name: string;
  phone: string;
  crefito: string;
  professionalTitle: string;
  professionalEmail: string;
  notes: string;
  photoDataUrl: string;
};

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw Object.assign(new Error(err?.message || "Não foi possível carregar o perfil da conta."), {
      status: res.status,
    });
  }
  return (await res.json()) as AuthMeResponse;
}

export async function patchAuthProfile(body: AuthProfilePatchBody): Promise<AuthMeResponse> {
  const res = await fetch("/api/auth/profile", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw Object.assign(new Error(err?.message || "Não foi possível salvar o perfil na API."), {
      status: res.status,
    });
  }
  return (await res.json()) as AuthMeResponse;
}
