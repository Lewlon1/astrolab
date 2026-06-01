import { createClient } from "@/lib/supabase/server";
import Hero from "@/components/Hero";
import JungRibbon from "@/components/JungRibbon";
import Founder from "@/components/Founder";
import TarotDeck from "@/components/TarotDeck";
import MagazineDetail from "@/components/MagazineDetail";
import Testimonials from "@/components/Testimonials";
import LeadCaptureSection from "@/components/LeadCaptureSection";
import BlogPreview from "@/components/BlogPreview";
import HomeCTA from "@/components/HomeCTA";
import TrackSection from "@/components/analytics/TrackSection";
import { organizationJsonLd } from "@/lib/jsonld";
import { getEditorialDate } from "@/lib/editorialDate";
import type { Service, Testimonial, BlogPost } from "@/types";

const TAROT_SLUGS = [
  "cosmic-quick-hit",
  "astro-psyche-blend",
  "stellar-insights",
  "cosmic-alliance",
  "soul-guided-travel-magazine",
];

export default async function HomePage() {
  const supabase = await createClient();
  const editorialDate = getEditorialDate();

  const [{ data: services }, { data: testimonials }, { data: posts }] =
    await Promise.all([
      supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .in("slug", TAROT_SLUGS)
        .returns<Service[]>(),
      supabase
        .from("testimonials")
        .select("*")
        .eq("is_featured", true)
        .order("sort_order")
        .returns<Testimonial[]>(),
      supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3)
        .returns<BlogPost[]>(),
    ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd()),
        }}
      />

      <TrackSection name="hero" index={0}>
        <Hero editorialDate={editorialDate} />
      </TrackSection>
      <TrackSection name="jung" index={1}>
        <JungRibbon />
      </TrackSection>
      <TrackSection name="founder" index={2}>
        <Founder editorialDate={editorialDate} />
      </TrackSection>
      <TrackSection name="tarot" index={3}>
        <TarotDeck services={services ?? []} />
      </TrackSection>
      <TrackSection name="magazine" index={4}>
        <MagazineDetail />
      </TrackSection>
      <TrackSection name="testimonials" index={5}>
        <Testimonials testimonials={testimonials ?? []} />
      </TrackSection>
      <TrackSection name="lead_capture" index={6}>
        <LeadCaptureSection />
      </TrackSection>
      <TrackSection name="blog" index={7}>
        <BlogPreview posts={posts ?? []} />
      </TrackSection>
      <TrackSection name="home_cta" index={8}>
        <HomeCTA />
      </TrackSection>
    </>
  );
}
