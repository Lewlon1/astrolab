import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PageHero from "@/components/PageHero";
import BlogPostList from "@/components/BlogPostList";
import LeadCaptureSection from "@/components/LeadCaptureSection";
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

      {/* Posts */}
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "4rem 1.5rem",
          background: "var(--cream)",
        }}
      >
        <BlogPostList posts={posts ?? []} />
      </section>

      <LeadCaptureSection />
    </>
  );
}
