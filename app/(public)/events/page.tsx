import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
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
        subtitle="In-person astrology experiences in Barcelona"
        breadcrumb={[{ label: "Events", href: "/events" }]}
      />

      {/* ─── Upcoming events ─── */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <SectionHeading label="What's next" title="Upcoming" />

        {upcoming.length > 0 ? (
          <div className="flex flex-col gap-6 mt-12">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="mt-12 text-cream/50 text-sm">
            No upcoming events — follow{" "}
            <Link
              href={BRAND.site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:text-gold/80 transition-colors"
            >
              @astropsychelab
            </Link>{" "}
            for announcements.
          </p>
        )}
      </section>

      {/* ─── Past events ─── */}
      {past.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 pb-24">
          <PastEventsSection events={past} />
        </section>
      )}

      {/* ─── Host CTA ─── */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-12">
          <h2 className="font-heading text-2xl md:text-3xl font-light mb-4">
            Want to host an event with me?
          </h2>
          <p className="text-cream/50 text-sm mb-6">
            I collaborate on workshops, pop-ups, and branded experiences.
          </p>
          <Link
            href={`mailto:${BRAND.site.email}`}
            className="inline-flex items-center justify-center text-sm font-medium rounded-[22px] px-6 py-2.5 bg-gold text-midnight hover:bg-gold/90 transition-colors"
          >
            Get in touch
          </Link>
        </div>
      </section>
    </>
  );
}
