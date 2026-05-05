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

  const magazineCalendly =
    services?.find((s) => s.slug === "soul-guided-travel-magazine")
      ?.calendly_url ?? null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd()),
        }}
      />

      <Hero editorialDate={editorialDate} />
      <JungRibbon />
      <Founder editorialDate={editorialDate} />
      <TarotDeck services={services ?? []} />
      <MagazineDetail
        magazineCalendlyUrl={magazineCalendly}
        editorialDate={editorialDate}
      />
      <Testimonials testimonials={testimonials ?? []} />
      <LeadCaptureSection />
      <BlogPreview posts={posts ?? []} />
      <HomeCTA />
    </>
  );
}
