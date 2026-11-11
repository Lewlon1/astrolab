// Offer sections shared by both variants: who it's for, what you get, how it works.
// All copy comes from content/apply/offer.ts.
import { OFFER, type Market } from "@/content/apply/offer";
import { SECTIONS } from "@/content/apply/ui";
import { EYEBROW, cx } from "@/components/lab/classes";

export const H2 = "m-0 font-fraunces text-[clamp(26px,5.5vw,36px)] font-medium leading-[1.1] !text-deepBrown [text-wrap:balance]";
export const SECTION = "flex flex-col gap-4 border-t-[1.5px] border-deepBrown pt-6";

export function VideoSlot() {
  return (
    <section aria-labelledby="lp-video" className={SECTION}>
      <h2 id="lp-video" className={H2}>
        {SECTIONS.video}
      </h2>
      {/* Fixed 16:9 box so the real video drops in without moving the page. */}
      <div className="flex aspect-video w-full items-center justify-center rounded-[14px] border-[1.5px] border-cardBorder bg-sagePale p-6 text-center text-[15px] text-midBrown">
        {SECTIONS.videoPlaceholder}
      </div>
    </section>
  );
}

function List({ items, mark }: { items: readonly string[]; mark: string }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((t) => (
        <li key={t} className="flex gap-3 text-[16px] leading-[1.55]">
          <span aria-hidden="true" className="flex-none font-dm-mono text-coral2">
            {mark}
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function WhoFor() {
  return (
    <section aria-labelledby="lp-for" className={cx(SECTION, "gap-6")}>
      <div className="flex flex-col gap-4">
        <h2 id="lp-for" className={H2}>
          {SECTIONS.forWho}
        </h2>
        <List items={OFFER.forWho} mark="+" />
      </div>
      <div className="flex flex-col gap-4">
        <h3 className="m-0 font-fraunces text-[22px] font-medium !text-deepBrown">{SECTIONS.notFor}</h3>
        <List items={OFFER.notFor} mark="–" />
      </div>
    </section>
  );
}

export function Inclusions({ market }: { market: Market }) {
  const price = OFFER.price[market];
  return (
    <section aria-labelledby="lp-get" className={SECTION}>
      <p className={EYEBROW}>{OFFER.name}</p>
      <h2 id="lp-get" className={H2}>
        {SECTIONS.inclusions}
      </h2>
      <p className="m-0 max-w-[62ch]">{OFFER.outcome}</p>
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
        {OFFER.inclusions.map((i) => (
          <li key={i.title} className="rounded-[14px] border-[1.5px] border-cardBorder bg-cream2 p-4">
            <p className="m-0 font-fraunces text-[19px] font-medium !text-deepBrown">{i.title}</p>
            <p className="m-0 mt-1 text-[15px] text-midBrown">{i.body}</p>
          </li>
        ))}
      </ul>
      <p className="m-0 flex flex-wrap items-baseline gap-x-3">
        <span className="font-dm-mono text-[12px] uppercase tracking-[0.12em] text-midBrown">{SECTIONS.priceLabel}</span>
        <span className="font-fraunces text-[26px] font-medium text-deepBrown">{price.full}</span>
        {price.instalments && <span className="text-[15px] text-midBrown">{price.instalments}</span>}
      </p>
      {OFFER.cap && <p className="m-0 text-[14px] text-midBrown">{OFFER.cap}</p>}
    </section>
  );
}

export function HowItWorks() {
  return (
    <section aria-labelledby="lp-how" className={SECTION}>
      <h2 id="lp-how" className={H2}>
        {SECTIONS.howItWorks}
      </h2>
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {OFFER.howItWorks.map((s, i) => (
          <li key={s.title} className="flex gap-4">
            <span aria-hidden="true" className="font-fraunces text-[22px] font-medium tabular-nums text-coral2">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>
              <span className="block font-fraunces text-[19px] font-medium text-deepBrown">{s.title}</span>
              <span className="block text-[15px] text-midBrown">{s.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
