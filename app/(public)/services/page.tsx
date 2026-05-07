import { createClient } from "@/lib/supabase/server";
import PageHero from "@/components/PageHero";
import ServiceCard from "@/components/ServiceCard";
import LeadCaptureSection from "@/components/LeadCaptureSection";
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
      "Stellar Insights is a deep-dive into your patterns and purpose. Cosmic Alliance adds astrocartography and is the full integration roadmap.",
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

      {/* Services grid */}
      {services && services.length > 0 && (
        <section
          style={{
            maxWidth: "1050px",
            margin: "0 auto",
            padding: "4rem 1.5rem",
            background: "var(--cream)",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "1.5rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      )}

      <LeadCaptureSection />

      {/* FAQ */}
      <section
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          padding: "4rem 1.5rem 6rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p className="section-eyebrow">FAQ</p>
          <h2 className="section-title">Common questions</h2>
        </div>
        <div style={{ marginTop: "2.5rem" }}>
          <FAQ items={faqItems} />
        </div>
      </section>
    </>
  );
}
