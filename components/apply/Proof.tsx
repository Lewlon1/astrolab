// Testimonials (only with written consent; hidden when empty) and About Gabs.
import { ABOUT, CREDENTIAL, PRESS, TESTIMONIALS } from "@/content/apply/proof";
import { SECTIONS } from "@/content/apply/ui";
import { H2, SECTION } from "./OfferBlocks";

export function Testimonials() {
  if (TESTIMONIALS.length === 0 && PRESS.length === 0) return null;
  return (
    <section aria-labelledby="lp-proof" className={SECTION}>
      <h2 id="lp-proof" className={H2}>
        {SECTIONS.proof}
      </h2>
      {TESTIMONIALS.map((t) => (
        <figure key={t.quote} className="m-0 flex flex-col gap-2 border-l-2 border-gold2 pl-4">
          <blockquote className="m-0 font-heading text-[22px] italic leading-[1.35] text-deepBrown">{t.quote}</blockquote>
          <figcaption className="text-[14px] text-midBrown">
            {t.name}
            {t.detail ? `, ${t.detail}` : ""}
          </figcaption>
        </figure>
      ))}
      {PRESS.length > 0 && <p className="m-0 text-[14px] text-midBrown">{PRESS.join(" · ")}</p>}
    </section>
  );
}

export function About() {
  return (
    <section aria-labelledby="lp-about" className={SECTION}>
      <h2 id="lp-about" className={H2}>
        {ABOUT.title}
      </h2>
      <p className="m-0 max-w-[62ch]">{ABOUT.body}</p>
      <p className="m-0 max-w-[62ch] text-[15px] text-midBrown">{CREDENTIAL}</p>
    </section>
  );
}
