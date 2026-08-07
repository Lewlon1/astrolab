import { createClient } from "@/lib/supabase/server";
import ServicesPageContent from "@/components/services/ServicesPageContent";
import LeadCaptureSection from "@/components/LeadCaptureSection";
import { serviceJsonLd } from "@/lib/jsonld";
import type { Service } from "@/types";

export const metadata = {
  title: "Services",
  description:
    "Personalised astrology sessions blending astrological precision with psychological insight. From free voice notes to full chart readings.",
};

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

      <ServicesPageContent services={services ?? []} />
      <LeadCaptureSection />
    </>
  );
}
