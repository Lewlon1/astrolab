import { FAQ } from "@/content/apply/faq";
import { SECTIONS } from "@/content/apply/ui";
import { FOCUS, cx } from "@/components/lab/classes";
import { H2, SECTION } from "./OfferBlocks";

export default function Faq() {
  return (
    <section aria-labelledby="lp-faq" className={SECTION}>
      <h2 id="lp-faq" className={H2}>
        {SECTIONS.faq}
      </h2>
      <div className="flex flex-col">
        {FAQ.map((f) => (
          <details key={f.id} className="group border-b border-cardBorder py-3">
            <summary
              className={cx(
                "flex cursor-pointer list-none items-center justify-between gap-4 font-fraunces text-[19px] font-medium text-deepBrown [&::-webkit-details-marker]:hidden",
                FOCUS,
                "focus-visible:outline-coral2",
              )}
            >
              {f.q}
              <span aria-hidden="true" className="font-dm-mono text-coral2 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="m-0 mt-2 max-w-[62ch] text-[16px] text-midBrown">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
