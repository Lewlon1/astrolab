// Variant A — Apply: long-form page, then the multi-step application.
import type { Hero as HeroCopy } from "@/content/apply/concepts";
import { OFFER, type Market } from "@/content/apply/offer";
import { CTA, SECTIONS } from "@/content/apply/ui";
import Hero from "./Hero";
import { HowItWorks, Inclusions, VideoSlot, WhoFor } from "./OfferBlocks";
import { About, Testimonials } from "./Proof";
import Faq from "./Faq";
import ApplicationForm from "./ApplicationForm";

export default function VariantA({ hero, market }: { hero: HeroCopy; market: Market }) {
  const price = OFFER.price[market];
  return (
    <div className="flex flex-col gap-12">
      <Hero
        hero={hero}
        eyebrow={OFFER.name}
        price={{ label: SECTIONS.priceLabel, ...price }}
        cta={{ label: CTA.apply, href: "#apply" }}
      />
      <VideoSlot />
      <WhoFor />
      <Inclusions market={market} />
      <HowItWorks />
      <Testimonials />
      <About />
      <Faq />
      <ApplicationForm />
    </div>
  );
}
