// Homepage teaser for the Lab Draw: one line and a link to /lab.
import Link from "next/link";
import { HOME_TEASER } from "@/content/lab/ui";
import { MOTIF_COLORS, SunMotif } from "./motifs";

export default function LabTeaser() {
  return (
    <section className="bg-cream2 px-6 py-12 md:px-14 md:py-16" style={{ borderBottom: "1px solid var(--ed-rule)" }}>
      <div className="mx-auto flex max-w-[720px] flex-col items-center gap-5 text-center">
        <SunMotif color={MOTIF_COLORS.gold2} rays={16} className="w-10" />
        <p className="m-0 max-w-[34ch] font-heading text-[clamp(22px,3vw,28px)] italic leading-[1.3] text-deepBrown">
          {HOME_TEASER.line}
        </p>
        <Link
          href="/lab"
          data-analytics="lab_teaser_click"
          data-section="lab_teaser"
          className="inline-flex items-center rounded-full border-[1.5px] border-deepBrown bg-deepBrown px-[22px] py-[14px] font-dm-mono text-[12px] font-medium uppercase leading-none tracking-[0.12em] text-cream2 hover:border-coral2 hover:bg-coral2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-coral2"
        >
          {HOME_TEASER.cta}
          <span aria-hidden="true" className="ml-2">→</span>
        </Link>
      </div>
    </section>
  );
}
