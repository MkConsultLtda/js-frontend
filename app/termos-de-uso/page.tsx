import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal/legal-shell";
import { BRAND_OWNER } from "@/lib/brand";
import { fetchPublicClinicProfile, formatCityState } from "@/lib/public-clinic-api";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de Uso do sistema JS Fisioterapia.",
};

export default async function TermosDeUsoPage() {
  const clinic = await fetchPublicClinicProfile();
  const foro = formatCityState(clinic) || "a definir pela administradora";
  const contactEmail = clinic?.contactEmail?.trim() || "a definir pela administradora";
  const contactPhone = clinic?.contactPhone?.trim() || "a definir";
  const responsibleName = clinic?.responsibleName?.trim() || BRAND_OWNER;
  const crefito = clinic?.responsibleCrefito?.trim() || "CREFITO a informar";

  return (
    <LegalShell title="Termos de Uso" version="1.0" updatedAt="01/06/2026">
      <section className="space-y-3">
        <h2>1. Aceitação dos termos</h2>
        <p>
          Ao acessar ou utilizar o sistema <strong>JS Fisioterapia</strong>, você
          concorda integralmente com estes Termos de Uso. Se não concordar com
          qualquer disposição, não utilize o sistema. O uso continuado após
          alterações publicadas constitui aceitação das novas condições.
        </p>
      </section>

      <section className="space-y-3">
        <h2>2. Definições</h2>
        <ul>
          <li><strong>Sistema</strong>: plataforma JS Fisioterapia e seus módulos.</li>
          <li><strong>Profissional</strong>: fisioterapeuta registrado que utiliza o sistema.</li>
          <li><strong>Paciente</strong>: pessoa cujos dados são inseridos pelo Profissional.</li>
          <li><strong>Prontuário</strong>: conjunto de registros clínicos do paciente.</li>
          <li><strong>Administradora</strong>: Julli Severina, responsável pelo sistema.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>3. Acesso e uso do sistema</h2>
        <h3>3.1 Quem pode usar</h3>
        <p>
          O sistema é destinado exclusivamente a profissionais de fisioterapia
          devidamente registrados no CREFITO, para uso em sua prática clínica.
        </p>
        <h3>3.2 Conta de acesso</h3>
        <p>
          O Profissional é integralmente responsável por manter o sigilo de suas
          credenciais, por toda ação realizada com sua conta e por notificar
          imediatamente qualquer acesso não autorizado. É proibido compartilhar
          credenciais com terceiros.
        </p>
        <h3>3.3 Uso aceitável</h3>
        <p>
          O sistema deve ser usado somente para registro e gestão de atendimentos
          fisioterapêuticos, prontuários conforme a COFFITO 414/2012, controle de
          agenda e gestão de dados de pacientes sob seus cuidados. É proibido
          registrar dados de pacientes fora de seus cuidados, tentar acessar dados
          de terceiros, realizar engenharia reversa ou inserir dados falsos.
        </p>
      </section>

      <section className="space-y-3">
        <h2>4. Responsabilidades do profissional</h2>
        <p>
          O Profissional atua como <strong>controlador dos dados</strong> dos
          pacientes (LGPD, Art. 5º, VI) e é o único responsável pelo conteúdo
          clínico inserido, pela obtenção do consentimento dos pacientes, pela
          veracidade das informações e pela guarda dos prontuários pelo prazo
          mínimo legal de 5 anos (COFFITO Res. 414/2012).
        </p>
      </section>

      <section className="space-y-3">
        <h2>5. Responsabilidades da administradora</h2>
        <p>
          A Administradora compromete-se a manter o sistema operacional com
          disponibilidade razoável, implementar medidas técnicas de segurança,
          realizar backups periódicos e tratar os dados em conformidade com a LGPD.
        </p>
      </section>

      <section className="space-y-3">
        <h2>6. Limitações de responsabilidade</h2>
        <p>
          O sistema é fornecido &quot;no estado em que se encontra&quot;, sem garantia de
          disponibilidade ininterrupta ou ausência absoluta de erros. A
          Administradora não se responsabiliza por decisões clínicas tomadas com
          base nos dados inseridos, nem por danos indiretos decorrentes do uso,
          salvo dolo ou culpa grave comprovados.
        </p>
      </section>

      <section className="space-y-3">
        <h2>7. Privacidade e proteção de dados</h2>
        <p>
          O tratamento de dados pessoais é regido pela{" "}
          <Link href="/politica-de-privacidade" className="text-primary underline-offset-4 hover:underline">
            Política de Privacidade
          </Link>
          , parte integrante destes Termos.
        </p>
      </section>

      <section className="space-y-3">
        <h2>8. Propriedade intelectual</h2>
        <p>
          O sistema, incluindo código-fonte, design, marca e logotipo, é de
          propriedade exclusiva da Administradora (Lei 9.610/1998). Os dados
          inseridos pelo Profissional pertencem ao Profissional e/ou ao paciente,
          conforme a legislação aplicável.
        </p>
      </section>

      <section className="space-y-3">
        <h2>9. Suspensão e encerramento</h2>
        <p>
          O acesso pode ser suspenso em caso de violação destes Termos ou uso
          fraudulento. O Profissional pode encerrar o uso a qualquer momento; os
          dados serão mantidos pelo prazo legal obrigatório e então eliminados
          conforme a Política de Privacidade.
        </p>
      </section>

      <section className="space-y-3">
        <h2>10. Legislação aplicável e foro</h2>
        <p>
          Estes Termos são regidos pelo direito brasileiro (LGPD 13.709/2018, Lei
          9.610/1998, CDC 8.078/1990, COFFITO Res. 414/2012 e CFM 1.821/2007). Fica
          eleito o foro da comarca de <strong>{foro}</strong> para
          dirimir conflitos.
        </p>
      </section>

      <section className="space-y-3">
        <h2>11. Contato</h2>
        <p>
          E-mail: <strong>{contactEmail}</strong> · Telefone:{" "}
          <strong>{contactPhone}</strong>
        </p>
        <p className="text-xs">
          JS Fisioterapia — {responsibleName} · {crefito}
        </p>
      </section>
    </LegalShell>
  );
}
