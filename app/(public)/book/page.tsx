import { Metadata } from "next";
import PageHero from "@/components/PageHero";
import LangText from "@/components/LangText";
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
        title={<LangText en="Book a session" es="Reserva una sesión" />}
        subtitle={
          <LangText
            en="Choose a reading and book in a few taps — payment is handled securely at checkout."
            es="Elige una lectura y reserva en unos toques — el pago se gestiona de forma segura al finalizar."
          />
        }
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
