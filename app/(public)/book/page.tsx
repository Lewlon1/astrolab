import { Metadata } from "next";
import PageHero from "@/components/PageHero";
import BookingGrid from "@/components/booking/BookingGrid";

export const metadata: Metadata = {
  title: "Book a Session",
  description:
    "Book your personalised astrology session online. Choose from birth chart readings, synastry, astrocartography, and the Soul Guided Travel Magazine.",
};

export default function BookPage() {
  return (
    <>
      <PageHero
        title="Book a session"
        subtitle="Choose a reading and book in a few taps — payment is handled securely at checkout."
        breadcrumb={[{ label: "Book", href: "/book" }]}
      />

      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "3rem 1.5rem 6rem",
          background: "var(--cream)",
        }}
      >
        <BookingGrid />
      </section>
    </>
  );
}
