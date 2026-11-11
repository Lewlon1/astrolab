"use client";

// Variant B — Lab first: short hero → mini draw → instant reading → email gate →
// personalised offer (same blocks as A) → application with step 1 already done.
import { useRef, useState } from "react";
import type { Hero as HeroCopy } from "@/content/apply/concepts";
import { OFFER, type Market } from "@/content/apply/offer";
import { CTA } from "@/content/apply/ui";
import { cx } from "@/components/lab/classes";
import styles from "@/components/lab/lab.module.css";
import Hero from "./Hero";
import LabMiniDraw from "./LabMiniDraw";
import { HowItWorks, Inclusions, VideoSlot, WhoFor } from "./OfferBlocks";
import { About, Testimonials } from "./Proof";
import Faq from "./Faq";
import ApplicationForm from "./ApplicationForm";
import type { Captured, ReadingSummary } from "./EmailCapture";

export default function VariantB({ hero, market }: { hero: HeroCopy; market: Market }) {
  const [captured, setCaptured] = useState<Captured | null>(null);
  const [reading, setReading] = useState<ReadingSummary | null>(null);
  const offerRef = useRef<HTMLDivElement>(null);

  const bridge = reading ? OFFER.bridgeLine.replace("{card}", reading.card).replace("{sun}", reading.sun) : "";

  return (
    <div className="flex flex-col gap-12">
      <Hero hero={hero} eyebrow={OFFER.name} price={null} cta={{ label: CTA.drawFirst, href: "#draw" }} />
      <LabMiniDraw
        onCaptured={(c, r) => {
          setCaptured(c);
          setReading(r);
          requestAnimationFrame(() => offerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
        }}
      />
      {captured && (
        <div ref={offerRef} className={cx("flex scroll-mt-6 flex-col gap-12", styles.reveal)}>
          <p className="m-0 max-w-[40ch] font-heading text-[clamp(22px,4.5vw,28px)] italic leading-[1.3] text-coral2">{bridge}</p>
          <VideoSlot />
          <WhoFor />
          <Inclusions market={market} />
          <HowItWorks />
          <Testimonials />
          <About />
          <Faq />
          <ApplicationForm captured={captured} />
        </div>
      )}
    </div>
  );
}
