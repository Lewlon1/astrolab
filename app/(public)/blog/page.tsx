import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PageHero from "@/components/PageHero";
import BlogPostList from "@/components/BlogPostList";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import type { BlogPost } from "@/types";

export const metadata: Metadata = {
  title: "The Cosmic Journal",
  description:
    "Astrology, psychology, and the patterns that shape your life.",
};

export default async function BlogPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .returns<BlogPost[]>();

  return (
    <>
      <PageHero
        title="The cosmic journal"
        subtitle="Astrology, psychology, and the patterns that shape your life."
        breadcrumb={[{ label: "Blog", href: "/blog" }]}
      />

      {/* ─── Posts ─── */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <BlogPostList posts={posts ?? []} />
      </section>

      {/* ─── Lead capture ─── */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-12">
          <h2 className="font-heading text-2xl md:text-3xl font-light mb-4">
            Want your free Love &amp; Career Code?
          </h2>
          <p className="text-cream/50 text-sm mb-6">
            Drop your email and I&apos;ll send you a personalised voice note
            breaking down your chart highlights.
          </p>
          <LeadCaptureForm />
        </div>
      </section>
    </>
  );
}
