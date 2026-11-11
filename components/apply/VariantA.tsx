"use client";

// Variant A — Apply: long-form page, with the Lab method as an optional hands-on demo
// mid-page (in place of a static "How it works"), then the multi-step application.
// One email state is shared by the demo and the application, so it's never asked twice.
import { useState } from "react";
import type { Hero as HeroCopy } from "@/content/apply/concepts";
import { OFFER, type Market } from "@/content/apply/offer";
import { CTA, SECTIONS } from "@/content/apply/ui";
import { DEMO_UI } from "@/content/apply/demo";
import Hero from "./Hero";
import { Inclusions, VideoSlot, WhoFor } from "./OfferBlocks";
import { About, Testimonials } from "./Proof";
import Faq from "./Faq";
import ApplicationForm from "./ApplicationForm";
import LabDemo from "./LabDemo";
import type { Captured } from "./EmailCapture";

export default function VariantA({ hero, market }: { hero: HeroCopy; market: Market }) {
  const price = OFFER.price[market];
  const [captured, setCaptured] = useState<Captured | null>(null);
  return (
    <div className="flex flex-col gap-12">
      <Hero
        hero={hero}
        eyebrow={OFFER.name}
        price={{ label: SECTIONS.priceLabel, ...price }}
        cta={{ label: CTA.apply, href: "#apply" }}
        secondary={{ label: `${DEMO_UI.heroLink} ↓`, href: "#demo" }}
      />
      <VideoSlot />
      <WhoFor />
      <LabDemo captured={captured} onCaptured={setCaptured} />
      <Inclusions market={market} />
      <Testimonials />
      <About />
      <Faq />
      <ApplicationForm captured={captured} onCaptured={setCaptured} />
    </div>
  );
}
