import LangText from "@/components/LangText";

export default function JungRibbon() {
  return (
    <section
      className="px-6 md:px-14 py-20 md:py-[120px]"
      style={{ background: "var(--ed-paper-deep)" }}
    >
      <div className="max-w-[1080px] mx-auto grid grid-cols-[auto_1fr] gap-8 md:gap-14 items-start">
        <div
          className="font-fraunces"
          style={{
            fontStyle: "italic",
            fontSize: "clamp(120px, 18vw, 220px)",
            color: "var(--ed-rust)",
            lineHeight: 0.7,
            fontWeight: 300,
          }}
          aria-hidden
        >
          &ldquo;
        </div>
        <div>
          <p
            className="font-fraunces m-0 mb-8"
            style={{
              fontStyle: "italic",
              fontSize: "clamp(28px, 5vw, 56px)",
              fontWeight: 300,
              color: "var(--ed-rust-deep)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            <LangText
              en="Who looks outside, dreams; who looks inside, awakes."
              es="Quien mira hacia afuera, sueña; quien mira hacia adentro, despierta."
            />
          </p>
          <div className="flex items-center gap-4">
            <div
              style={{
                width: 60,
                height: 1,
                background: "var(--ed-ink)",
              }}
            />
            <span
              className="font-dm-mono uppercase"
              style={{
                fontSize: 11,
                letterSpacing: "0.22em",
                color: "var(--ed-ink-soft)",
              }}
            >
              Carl Gustav Jung
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
