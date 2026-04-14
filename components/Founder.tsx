import Image from "next/image";
import LangText from "@/components/LangText";
import Reveal from "@/components/Reveal";

export default function Founder() {
  return (
    <section className="founder-section" id="founder">
      <div className="founder-grid">
        <Reveal>
          <div className="founder-photo">
            <Image
              src="/images/Website_profile.png"
              alt="Gabriela — Founder of The Astro Psyche Lab"
              width={400}
              height={533}
              priority
            />
            <div className="astro-tag">
              <strong>
                <LangText en="Big Three" es="Los Tres Grandes" />
              </strong>
              Pisces Sun · Sagittarius Moon · Taurus Rising
            </div>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <div className="founder-text">
            <h2>
              <LangText
                en={
                  <>
                    Meet the
                    <br />
                    Founder
                  </>
                }
                es={
                  <>
                    Conoce a la
                    <br />
                    Fundadora
                  </>
                }
              />
            </h2>

            <p>
              <LangText
                en={
                  <>
                    Puerto Rico born and now Europe based, I&apos;m{" "}
                    <strong>Gabriela</strong>, a psychotherapist with over 10
                    years in the field and a lover of astrology. I created the
                    Astro Psyche Lab, a carefully designed project that fuses my
                    profession and passion into tailored sessions for you.
                  </>
                }
                es={
                  <>
                    Nacida en Puerto Rico y ahora basada en Europa, soy{" "}
                    <strong>Gabriela</strong>, psicoterapeuta con más de 10 años
                    en el campo y amante de la astrología. Creé el Astro Psyche
                    Lab, un proyecto que fusiona mi profesión y pasión en
                    sesiones personalizadas para ti.
                  </>
                }
              />
            </p>

            <p>
              <LangText
                en="This Spanglish sanctuary blends psychology and astrology, offering cosmic insight to empower a vibrant, curious community. Here, we support your journey toward deeper alignment and radical growth, honoring your unique path every step of the way."
                es="Este santuario Spanglish mezcla psicología y astrología, ofreciendo insights cósmicos para empoderar una comunidad vibrante y curiosa. Aquí apoyamos tu viaje hacia una alineación más profunda y un crecimiento radical, honrando tu camino único en cada paso."
              />
            </p>

            <div className="jung-ref">
              <p>
                &ldquo;The privilege of a lifetime is to become who you truly
                are.&rdquo;
              </p>
              <span className="ref">C.G. Jung</span>
            </div>

            <div className="founder-details">
              <div className="founder-detail">
                <div className="num">10+</div>
                <div className="label">
                  <LangText
                    en="Years in Psychology"
                    es="Años en Psicología"
                  />
                </div>
              </div>
              <div className="founder-detail">
                <div className="num">EN/ES</div>
                <div className="label">
                  <LangText
                    en="Bilingual Sessions"
                    es="Sesiones Bilingües"
                  />
                </div>
              </div>
              <div className="founder-detail">
                <div className="num">BCN</div>
                <div className="label">
                  <LangText
                    en="In Person + Online"
                    es="Presencial + Online"
                  />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
