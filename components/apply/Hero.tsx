"use client";

import type { Hero as HeroCopy } from "@/content/apply/concepts";
import { BTN_LIGHT, EYEBROW, LEDE, cx } from "@/components/lab/classes";
import { useLp } from "./LpContext";

type Props = {
  hero: HeroCopy;
  /** Shown under the headline (variant A shows the price; B leaves it out). */
  price?: { label: string; full: string; instalments: string | null } | null;
  cta: { label: string; href: string };
  /** Quieter second link, e.g. variant A's "Or try the method first". */
  secondary?: { label: string; href: string } | null;
  eyebrow: string;
};

/** Concept-matched hero. The copy is resolved on the server, so it is in the first HTML (no swap, no shift). */
export default function Hero({ hero, price, cta, secondary, eyebrow }: Props) {
  const { lpTrack } = useLp();
  return (
    <section aria-labelledby="lp-hero-title" className="flex flex-col gap-5">
      <p className={cx(EYEBROW, "text-coral2")}>{eyebrow}</p>
      <h1
        id="lp-hero-title"
        className="m-0 font-fraunces text-[clamp(36px,8.5vw,60px)] font-medium leading-[1.05] tracking-[-0.01em] !text-deepBrown [text-wrap:balance]"
      >
        {hero.headline}
      </h1>
      <p className={cx(LEDE, "max-w-[40ch]")}>{hero.subhead}</p>
      {price && (
        <p className="m-0 flex flex-wrap items-baseline gap-x-3 text-deepBrown">
          <span className="font-dm-mono text-[12px] uppercase tracking-[0.12em] text-midBrown">{price.label}</span>
          <span className="font-fraunces text-[28px] font-medium">{price.full}</span>
          {price.instalments && <span className="text-[15px] text-midBrown">{price.instalments}</span>}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <a
          href={cta.href}
          className={cx(BTN_LIGHT, "no-underline")}
          onClick={() => lpTrack("lp_cta_clicked", { placement: "hero" })}
        >
          {cta.label}
        </a>
        {secondary && (
          <a
            href={secondary.href}
            className="text-[15px] text-deepBrown underline underline-offset-[3px] hover:text-coral2"
            onClick={() => lpTrack("lp_cta_clicked", { placement: "hero_demo" })}
          >
            {secondary.label}
          </a>
        )}
      </div>
      <p className="m-0 max-w-[62ch] text-[14px] text-midBrown">{hero.proof}</p>
    </section>
  );
}
