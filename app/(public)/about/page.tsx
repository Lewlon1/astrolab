import Link from "next/link";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import { BRAND } from "@/lib/constants";

export const metadata = {
  title: "About Gabs",
  description:
    "The human behind the charts. Gabs blends astrology with psychology to help you decode your patterns and rewrite your story.",
};

const approaches = [
  {
    title: "Astrology as language",
    description:
      "Your birth chart is a map of psychological patterns — not a fixed fate. I read it as a living language that reveals your wiring, your rhythms, and your potential.",
  },
  {
    title: "Psychology as depth",
    description:
      "I go beyond prediction into self-understanding. Every aspect and placement connects to real patterns in how you relate, react, and grow.",
  },
  {
    title: "Integration as practice",
    description:
      "Insight without action is just entertainment. I help you turn what you learn into real-world change — in your relationships, career, and sense of self.",
  },
];

const credentials = [
  "Psychological Astrology Certification — Centre for Psychological Astrology, London",
  "BSc Psychology — University of Barcelona",
  "Certified Integrative Coach — ICF accredited programme",
  "200+ birth chart readings delivered",
  "Ongoing study in Jungian psychology and archetypal astrology",
];

export default function AboutPage() {
  return (
    <>
      {/* Section 1 — Hero */}
      <PageHero
        title="About Gabs"
        subtitle="The human behind the charts"
        breadcrumb={[{ label: "About", href: "/about" }]}
      />

      {/* Section 2 — Story */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="aspect-[3/4] rounded-[14px] bg-gradient-to-br from-deep/40 to-ocean/20" />

          <div>
            <p className="text-cream/60 leading-relaxed mb-6">
              I never planned to become an astrologer. I started in psychology
              — fascinated by why people repeat the same patterns, choose the
              same relationships, and feel stuck in the same loops. I wanted a
              framework that went deeper than behaviour.
            </p>
            <p className="text-cream/60 leading-relaxed mb-6">
              Then I found astrology — not the horoscope column kind, but the
              kind that maps your psyche with terrifying accuracy. I trained in
              psychological astrology in London, brought it back to Barcelona,
              and started reading charts for friends. Word spread.
            </p>

            <blockquote className="my-8 pl-6 border-l-2 border-gold/40">
              <p className="font-heading text-xl italic text-cream/80">
                &ldquo;The chart doesn&apos;t tell you who you are. It shows
                you what you&apos;re working with — and what you can do about
                it.&rdquo;
              </p>
            </blockquote>

            <p className="text-cream/60 leading-relaxed">
              Today I run The Astro Psyche Lab from Barcelona — offering birth
              chart readings, synastry sessions, astrocartography, and workshops
              that blend cosmic insight with psychological depth. No fluff, no
              fatalism. Just clarity.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 — Approach */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <SectionHeading
          label="Philosophy"
          title="My approach"
          align="center"
        />

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {approaches.map((item) => (
            <div
              key={item.title}
              className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-6"
            >
              <h3 className="font-heading text-xl mb-3">{item.title}</h3>
              <p className="text-sm text-cream/50 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4 — Credentials */}
      <section className="max-w-3xl mx-auto px-6 py-24">
        <SectionHeading
          label="Credentials"
          title="Training & background"
          align="center"
        />

        <ul className="mt-12 space-y-4">
          {credentials.map((item) => (
            <li
              key={item}
              className="text-cream/50 text-sm pl-4 border-l border-white/10"
            >
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-12 text-center">
          <a
            href={BRAND.site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold text-sm hover:text-gold/80 transition-colors"
          >
            Follow @astropsychelab on Instagram
          </a>
        </p>
      </section>

      {/* Section 5 — CTA */}
      <section className="py-24 px-6 text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-light mb-4">
          Ready to decode your chart?
        </h2>
        <p className="text-cream/50 mb-8 max-w-lg mx-auto">
          Whether you&apos;re curious about your patterns or ready for deep
          transformation, there&apos;s a session for you.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/services"
            className="bg-gold text-midnight text-sm font-medium px-6 py-3 rounded-[22px] hover:bg-gold/90 transition-colors"
          >
            Explore services
          </Link>
          <Link
            href="/#lead-capture"
            className="border border-cream/20 text-cream text-sm px-6 py-3 rounded-[22px] hover:border-cream/40 transition-colors"
          >
            Get your free Love &amp; Career Code
          </Link>
        </div>
      </section>
    </>
  );
}
