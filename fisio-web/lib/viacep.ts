/** Resposta mínima da API pública ViaCEP (Brasil). */
export type ViaCepSuccess = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

export async function fetchViaCep(cepDigits: string): Promise<ViaCepSuccess | null> {
  const d = cepDigits.replace(/\D/g, "");
  if (d.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${d}/json/`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ViaCepSuccess & { erro?: boolean };
    if (data?.erro) return null;
    return data;
  } catch {
    return null;
  }
}
