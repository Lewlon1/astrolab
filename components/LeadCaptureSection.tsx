import LangText from "@/components/LangText";
import LeadCaptureForm from "@/components/LeadCaptureForm";

export default function LeadCaptureSection() {
  return (
    <section
      id="lead-capture"
      className="px-6 md:px-14 py-20 md:py-[100px]"
      style={{ background: "var(--ed-ink)", color: "var(--ed-paper)" }}
    >
      <div className="max-w-[880px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
        <div>
          <div
            className="font-dm-mono uppercase mb-4"
            style={{
              fontSize: 11,
              letterSpacing: "0.24em",
              color: "var(--ed-ochre)",
            }}
          >
            <LangText en="· Subscribe ·" es="· Suscríbete ·" />
          </div>
          <h2
            className="font-fraunces m-0"
            style={{
              fontSize: "clamp(36px, 6vw, 56px)",
              fontWeight: 300,
              color: "var(--ed-paper)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            <LangText
              en={
                <>
                  The{" "}
                  <em
                    style={{ fontStyle: "italic", color: "var(--ed-ochre)" }}
                  >
                    new moon
                  </em>{" "}
                  letter.
                </>
              }
              es={
                <>
                  La carta de{" "}
                  <em
                    style={{ fontStyle: "italic", color: "var(--ed-ochre)" }}
                  >
                    luna nueva
                  </em>
                  .
                </>
              }
            />
          </h2>
        </div>
        <div>
          <p
            className="font-spectral m-0 mb-6"
            style={{
              fontSize: 16,
              color: "rgba(244,239,230,0.75)",
              lineHeight: 1.7,
            }}
          >
            <LangText
              en="One letter per lunar cycle. Astro-psychology, ritual prompts, and the transits worth watching."
              es="Una carta por ciclo lunar. Astro-psicología, prácticas rituales y los tránsitos que vale la pena observar."
            />
          </p>
          <div className="ed-newsletter">
            <LeadCaptureForm />
          </div>
        </div>
      </div>
    </section>
  );
}
