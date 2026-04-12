import { createClient } from "@/lib/supabase/server";
import PageHero from "@/components/PageHero";
import ServiceCard from "@/components/ServiceCard";
import SectionHeading from "@/components/SectionHeading";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import FAQ from "@/components/FAQ";
import { serviceJsonLd } from "@/lib/jsonld";
import type { Service } from "@/types";

export const metadata = {
  title: "Services",
  description:
    "Personalised astrology sessions blending astrological precision with psychological insight. From free voice notes to full chart readings.",
};

const faqItems = [
  {
    question: "What do I need to prepare?",
    answer: "Your birth date, exact time, and location.",
  },
  {
    question: "How are sessions delivered?",
    answer: "Via Zoom, recorded so you can rewatch.",
  },
  {
    question: "Can I gift a session?",
    answer: "Yes! Email me for a gift voucher.",
  },
  {
    question:
      "What's the difference between Stellar Insights and Cosmic Alliance?",
    answer:
      "Stellar is a full chart reading. Cosmic Alliance adds astrocartography and is more comprehensive.",
  },
];

export default async function ServicesPage() {
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .returns<Service[]>();

  return (
    <>
      {services && services.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(services.map(serviceJsonLd)),
          }}
        />
      )}

      <PageHero
        title="Find your reading"
        subtitle="Every session blends astrological precision with psychological insight. Start free, go as deep as you need."
        breadcrumb={[{ label: "Services", href: "/services" }]}
      />

      {/* ─── Services grid ─── */}
      {services && services.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Lead capture ─── */}
      <section id="lead-capture" className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center bg-gold/[0.03] border border-gold/10 rounded-[14px] p-12">
          <h2 className="font-heading text-3xl md:text-4xl font-light mb-4">
            Want your free Love &amp; Career Code?
          </h2>
          <p className="text-cream/50 mb-8 max-w-md mx-auto text-sm">
            Drop your email and I&apos;ll send you a personalised voice note
            decoding your Venus, Saturn &amp; Midheaven — your love language and
            career wiring, in under two minutes.
          </p>
          <LeadCaptureForm />
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <SectionHeading
          label="FAQ"
          title="Common questions"
          align="center"
        />
        <div className="mt-12">
          <FAQ items={faqItems} />
        </div>
      </section>
    </>
  );
}
