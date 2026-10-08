import LangText from "@/components/LangText";
import LeadCaptureForm from "@/components/LeadCaptureForm";

/** Compact newsletter strip shown right after the tarot spread. */
export default function LeadCaptureInline() {
  return (
    <section
      id="lead-inline"
      className="px-6 md:px-14 py-10 md:py-12"
      style={{ borderBottom: "1px solid var(--ed-rule)" }}
    >
      <div className="max-w-[880px] mx-auto flex flex-col md:flex-row md:items-center gap-5 md:gap-10">
        <p
          className="font-fraunces m-0 md:flex-1"
          style={{
            fontSize: "clamp(20px, 2.4vw, 26px)",
            fontWeight: 400,
            lineHeight: 1.2,
            color: "var(--ed-ink)",
          }}
        >
          <LangText
            en="Not ready to book? Get the new moon letter."
            es="¿Aún no estás lista para reservar? Recibe la carta de luna nueva."
          />
        </p>
        <div className="ed-newsletter ed-newsletter-light md:flex-1">
          <LeadCaptureForm placement="inline" />
        </div>
      </div>
    </section>
  );
}
