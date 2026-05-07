import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PageHero from "@/components/PageHero";
import CalendlyBooking from "@/components/CalendlyBooking";
import type { Service } from "@/types";

export const metadata: Metadata = {
  title: "Book a Session",
  description:
    "Book your personalised astrology session online. Choose from birth chart readings, synastry, astrocartography, and more.",
};

export default async function BookPage() {
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .gt("price", 0)
    .order("sort_order")
    .returns<Service[]>();

  return (
    <>
      <PageHero
        title="Book a session"
        subtitle="Choose a service and pick a time that works for you."
        breadcrumb={[{ label: "Book", href: "/book" }]}
      />

      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "3rem 1.5rem 6rem",
          background: "var(--cream)",
        }}
      >
        {services && services.length > 0 ? (
          <CalendlyBooking services={services} />
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            No bookable services available right now.
          </p>
        )}
      </section>
    </>
  );
}
