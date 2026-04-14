import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PageHero from "@/components/PageHero";
import EventCard from "@/components/EventCard";
import PastEventsSection from "@/components/PastEventsSection";
import { BRAND } from "@/lib/constants";
import type { Event } from "@/types";

export const metadata = {
  title: "Events",
  description:
    "In-person astrology workshops, cosmic tasters, and pop-up events in Barcelona.",
};

export default async function EventsPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("is_published", true)
    .order("date")
    .returns<Event[]>();

  const now = new Date().toISOString();
  const upcoming = events?.filter((e) => e.date && e.date > now) ?? [];
  const past = events?.filter((e) => e.date && e.date <= now) ?? [];

  return (
    <>
      <PageHero
        title="Events"
        subtitle="In-person astrology experiences in Barcelona."
        breadcrumb={[{ label: "Events", href: "/events" }]}
      />

      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "3rem 1.5rem 4rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p className="section-eyebrow">What&apos;s next</p>
          <h2 className="section-title">Upcoming</h2>
        </div>

        {upcoming.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              marginTop: "2.5rem",
            }}
          >
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p
            style={{
              marginTop: "2rem",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "0.9rem",
              fontWeight: 300,
            }}
          >
            No upcoming events — follow{" "}
            <Link
              href={BRAND.site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--gold)", textDecoration: "none" }}
            >
              @astropsychelab
            </Link>{" "}
            for announcements.
          </p>
        )}
      </section>

      {past.length > 0 && (
        <section
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "0 1.5rem 4rem",
          }}
        >
          <PastEventsSection events={past} />
        </section>
      )}

      <section
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "0 1.5rem 6rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: "white",
            border: "1px solid rgba(184,160,112,0.3)",
            borderRadius: "16px",
            padding: "3rem 2rem",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              fontWeight: 300,
              color: "var(--deep-brown)",
              marginBottom: "1rem",
            }}
          >
            Want to host an event with me?
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.9rem",
              marginBottom: "1.5rem",
              fontWeight: 300,
              lineHeight: 1.7,
            }}
          >
            I collaborate on workshops, pop-ups, and branded experiences.
          </p>
          <Link
            href={`mailto:${BRAND.site.email}`}
            className="btn-primary"
          >
            Get in touch
          </Link>
        </div>
      </section>
    </>
  );
}
