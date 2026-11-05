import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal/legal-shell";
import { fetchPublicClinicProfile } from "@/lib/public-clinic-api";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de Privacidade do JS Fisioterapia, em conformidade com a LGPD (Lei 13.709/2018).",
};

export default async function PoliticaDePrivacidadePage() {
  const clinic = await fetchPublicClinicProfile();
  const dpoName = clinic?.dpoName?.trim() || "a definir pela administradora";
  const dpoEmail = clinic?.dpoEmail?.trim() || "a definir pela administradora";

  return (
    <LegalShell title="Política de Privacidade" version="1.0" updatedAt="01/06/2026">
      <section className="space-y-3">
        <p>
          Esta Política descreve como o <strong>JS Fisioterapia</strong> trata
          dados pessoais, em conformidade com a Lei Geral de Proteção de Dados
          (<strong>LGPD — Lei 13.709/2018</strong>). Dados de saúde são
          classificados como <strong>dados pessoais sensíveis</strong> e recebem
          proteção reforçada.
        </p>
      </section>

      <section className="space-y-3">
        <h2>1. Dados coletados</h2>
        <ul>
          <li><strong>Do profissional</strong>: nome, e-mail, número CREFITO, telefone e foto de perfil.</li>
          <li><strong>Dos pacientes</strong> (inseridos pelo profissional): identificação, contato, histórico clínico, anamneses e evoluções.</li>
          <li><strong>De uso</strong>: registros de acesso e ações relevantes para segurança e auditoria.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>2. Finalidade do tratamento</h2>
        <p>
          Os dados são tratados exclusivamente para viabilizar a gestão clínica:
          agenda, prontuário eletrônico, emissão de documentos e cumprimento de
          obrigações legais e regulatórias (COFFITO Res. 414/2012).
        </p>
      </section>

      <section className="space-y-3">
        <h2>3. Base legal</h2>
        <p>
          O tratamento fundamenta-se no consentimento do titular e no cumprimento
          de obrigação legal/regulatória, conforme os Art. 7º e Art. 11 da LGPD.
          Para dados de saúde, aplica-se a hipótese de tutela da saúde por
          profissional habilitado.
        </p>
      </section>

      <section className="space-y-3">
        <h2>4. Período de retenção</h2>
        <p>
          Os prontuários são mantidos pelo prazo mínimo de <strong>5 anos</strong> a
          partir do último registro (COFFITO Res. 414/2012), podendo ser maior por
          exigência legal. Após o prazo, os dados são eliminados ou anonimizados.
        </p>
      </section>

      <section className="space-y-3">
        <h2>5. Compartilhamento</h2>
        <p>
          Os dados não são vendidos nem compartilhados com terceiros para fins
          comerciais. O compartilhamento ocorre apenas quando necessário para a
          operação do serviço (ex.: provedores de infraestrutura) ou por
          determinação legal.
        </p>
      </section>

      <section className="space-y-3">
        <h2>6. Segurança</h2>
        <p>
          São adotadas medidas técnicas e administrativas para proteger os dados
          (LGPD Art. 46): criptografia em trânsito (HTTPS), autenticação por
          tokens, controle de acesso e backups periódicos.
        </p>
      </section>

      <section className="space-y-3">
        <h2>7. Direitos do titular</h2>
        <p>
          Nos termos do Art. 18 da LGPD, o titular pode solicitar confirmação do
          tratamento, acesso, correção, anonimização, portabilidade e eliminação
          dos dados, além de revogar o consentimento. As solicitações devem ser
          feitas ao profissional responsável (controlador) ou ao contato abaixo.
        </p>
      </section>

      <section className="space-y-3">
        <h2>8. Incidentes</h2>
        <p>
          Em caso de incidente de segurança que possa acarretar risco aos
          titulares, será realizada comunicação à ANPD e aos afetados, conforme o
          Art. 48 da LGPD.
        </p>
      </section>

      <section className="space-y-3">
        <h2>9. Encarregado (DPO) e contato</h2>
        <p>
          Encarregado pelo tratamento de dados: <strong>{dpoName}</strong> ·
          E-mail: <strong>{dpoEmail}</strong>.
        </p>
        <p>
          Consulte também os{" "}
          <Link href="/termos-de-uso" className="text-primary underline-offset-4 hover:underline">
            Termos de Uso
          </Link>
          .
        </p>
      </section>
    </LegalShell>
  );
}
