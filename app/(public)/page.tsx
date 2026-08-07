import { createClient } from "@/lib/supabase/server";
import Hero from "@/components/Hero";
import ContentsIndex from "@/components/ContentsIndex";
import JungRibbon from "@/components/JungRibbon";
import Founder from "@/components/Founder";
import TarotDeck from "@/components/TarotDeck";
import MagazineDetail from "@/components/MagazineDetail";
import Testimonials from "@/components/Testimonials";
import LeadCaptureSection from "@/components/LeadCaptureSection";
import BlogPreview from "@/components/BlogPreview";
import ServicesIndex from "@/components/services/ServicesIndex";
import HomeCTA from "@/components/HomeCTA";
import TrackSection from "@/components/analytics/TrackSection";
import { organizationJsonLd } from "@/lib/jsonld";
import { getEditorialDate } from "@/lib/editorialDate";
import type { Service, Testimonial, BlogPost } from "@/types";

export default async function HomePage() {
  const supabase = await createClient();
  const editorialDate = getEditorialDate();

  const [{ data: services }, { data: testimonials }, { data: posts }] =
    await Promise.all([
      supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
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
      <TrackSection name="tarot" index={1}>
        <TarotDeck services={services ?? []} />
      </TrackSection>
      <TrackSection name="jung" index={2}>
        <JungRibbon />
      </TrackSection>
      <TrackSection name="founder" index={3}>
        <Founder editorialDate={editorialDate} />
      </TrackSection>
      <TrackSection name="contents" index={4}>
        <ContentsIndex />
      </TrackSection>
      <TrackSection name="magazine" index={5}>
        <MagazineDetail />
      </TrackSection>
      <TrackSection name="services_index" index={6}>
        <ServicesIndex services={services ?? []} />
      </TrackSection>
      <TrackSection name="testimonials" index={7}>
        <Testimonials testimonials={testimonials ?? []} />
      </TrackSection>
      <TrackSection name="lead_capture" index={8}>
        <LeadCaptureSection />
      </TrackSection>
      <TrackSection name="blog" index={9}>
        <BlogPreview posts={posts ?? []} />
      </TrackSection>
      <TrackSection name="home_cta" index={10}>
        <HomeCTA />
      </TrackSection>
    </>
  );
}
