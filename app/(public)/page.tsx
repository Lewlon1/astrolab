import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ServiceCard from "@/components/ServiceCard";
import TestimonialCard from "@/components/TestimonialCard";
import BlogPostCard from "@/components/BlogPostCard";
import SectionHeading from "@/components/SectionHeading";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import { organizationJsonLd } from "@/lib/jsonld";
import type { Service, Testimonial, BlogPost } from "@/types";

const steps = [
  {
    number: "01",
    title: "Comment LOVECODE",
    description:
      "Drop the word LOVECODE on any Instagram post and you'll get a DM with your free personalised voice note.",
  },
  {
    number: "02",
    title: "Listen to your code",
    description:
      "In under two minutes you'll hear your Venus, Saturn & Midheaven decoded — your love language and career wiring.",
  },
  {
    number: "03",
    title: "Go deeper",
    description:
      "Ready for more? Book a full session and explore the patterns, blind spots, and growth edges in your chart.",
  },
];

const stats = [
  { value: "250+", label: "Charts read" },
  { value: "4.9★", label: "Client rating" },
  { value: "6", label: "Session types (€25–€180)" },
];

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: services }, { data: testimonials }, { data: posts }] =
    await Promise.all([
      supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .in("name", ["Cosmic Quick Hit", "Stellar Insights", "Cosmic Alliance"])
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

      {/* ─── Section 1 — Hero ─── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Decorative background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
        >
          {/* Radial gradient blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-deep/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-ocean/10 rounded-full blur-[100px]" />

          {/* Circle outlines */}
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] border border-gold/[0.05] rounded-full" />
          <div className="absolute top-16 -right-16 w-[400px] h-[400px] border border-gold/[0.04] rounded-full" />
          <div className="absolute -top-8 right-24 w-[250px] h-[250px] border border-gold/[0.03] rounded-full" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-gold text-xs uppercase tracking-[0.2em] font-medium mb-6">
            Astrology meets psychology
          </p>

          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light leading-tight">
            Decode the patterns.
            <br />
            <span className="italic text-gold">Rewrite your story.</span>
          </h1>

          <p className="mt-6 text-cream/50 text-lg max-w-xl mx-auto">
            Personalised birth chart readings that blend astrological insight
            with psychological depth. Based in Barcelona.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link
              href="#lead-capture"
              className="bg-gold text-midnight text-sm font-medium px-6 py-3 rounded-[22px] hover:bg-gold/90 transition-colors"
            >
              Get your free Love &amp; Career Code
            </Link>
            <Link
              href="/services"
              className="border border-cream/20 text-cream text-sm px-6 py-3 rounded-[22px] hover:border-cream/40 transition-colors"
            >
              Explore services
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-16">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-cream font-medium text-lg">{stat.value}</p>
                <p className="text-cream/40 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 2 — How it works ─── */}
      <section className="max-w-5xl mx-auto px-6 py-24 border-t border-white/5">
        <SectionHeading
          label="How it works"
          title="Three steps to clarity"
          align="center"
        />

        <div className="grid md:grid-cols-3 gap-12 mt-16">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <p className="font-heading text-5xl text-gold/30 mb-4">
                {step.number}
              </p>
              <h3 className="font-heading text-xl mb-2">{step.title}</h3>
              <p className="text-sm text-cream/50 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Section 3 — Featured services ─── */}
      {services && services.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-24">
          <SectionHeading label="Services" title="Find your reading" />

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          <Link
            href="/services"
            className="text-gold text-sm hover:text-gold/80 transition-colors mt-8 inline-block"
          >
            View all services &rarr;
          </Link>
        </section>
      )}

      {/* ─── Section 4 — Testimonials ─── */}
      {testimonials && testimonials.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-24">
          <SectionHeading
            label="Testimonials"
            title="What clients say"
            align="center"
          />

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Section 5 — Lead capture ─── */}
      <section id="lead-capture" className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center bg-gold/[0.03] border border-gold/10 rounded-[14px] p-12">
          <h2 className="font-heading text-3xl md:text-4xl font-light mb-4">
            Want your free Love &amp; Career Code?
          </h2>
          <p className="text-cream/50 mb-8 max-w-md mx-auto text-sm">
            Drop your email and I&apos;ll send you a personalised voice note
            decoding your Venus, Saturn &amp; Midheaven — your love language
            and career wiring, in under two minutes.
          </p>
          <LeadCaptureForm />
        </div>
      </section>

      {/* ─── Section 6 — Blog preview ─── */}
      {posts && posts.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-24">
          <SectionHeading
            label="Blog"
            title="From the cosmic journal"
            align="center"
          />

          <div className="flex flex-col gap-6 mt-12">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/blog"
              className="text-gold text-sm hover:text-gold/80 transition-colors"
            >
              Read more &rarr;
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
