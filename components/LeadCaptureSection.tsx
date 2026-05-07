import LangText from "@/components/LangText";
import LeadCaptureForm from "@/components/LeadCaptureForm";

export default function LeadCaptureSection() {
  return (
    <section className="lead-capture-section" id="lead-capture">
      <div className="lead-capture-card">
        <h2>
          <LangText
            en={
              <>
                Want your free Love &amp; Career Code?
              </>
            }
            es={<>¿Quieres tu Código de Amor y Carrera gratis?</>}
          />
        </h2>
        <p className="sub">
          <LangText
            en="Drop your email and I'll send you a personalised voice note decoding your Venus, Saturn & Midheaven — your love language and career wiring, in under two minutes."
            es="Déjame tu email y te enviaré una nota de voz personalizada decodificando tu Venus, Saturno y Medio Cielo — tu lenguaje del amor y cableado profesional, en menos de dos minutos."
          />
        </p>
        <LeadCaptureForm />
      </div>
    </section>
  );
}
