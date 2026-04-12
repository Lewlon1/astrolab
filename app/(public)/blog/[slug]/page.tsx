import { cache } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/server";
import SectionHeading from "@/components/SectionHeading";
import BlogPostCard from "@/components/BlogPostCard";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import ShareButtons from "@/components/ShareButtons";
import { articleJsonLd } from "@/lib/jsonld";
import type { BlogPost } from "@/types";

const PILLAR_STYLES: Record<string, string> = {
  Decode: "bg-ocean/10 text-ocean",
  Reframe: "bg-coral/10 text-coral",
  Navigate: "bg-sage/10 text-sage",
  Align: "bg-gold/10 text-gold",
};

// Deduplicate fetch between generateMetadata and page component
const getPost = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  return data as BlogPost | null;
});

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return { title: "Post not found" };

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || "",
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || "",
      images: post.featured_image_url ? [post.featured_image_url] : [],
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  // Fetch related posts from same pillar
  const supabase = await createClient();
  const { data: relatedPosts } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .eq("pillar", post.pillar)
    .neq("id", post.id)
    .order("published_at", { ascending: false })
    .limit(2)
    .returns<BlogPost[]>();

  const formattedDate = post.published_at
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(post.published_at))
    : null;

  const pillarStyle = post.pillar
    ? PILLAR_STYLES[post.pillar] ?? "bg-white/5 text-cream/50"
    : "bg-white/5 text-cream/50";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd(post)),
        }}
      />

      {/* ─── Header ─── */}
      <section className="max-w-2xl mx-auto px-6 pt-32 pb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-cream/40 mb-8">
          <Link href="/blog" className="hover:text-cream/60 transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-cream/60 line-clamp-1">{post.title}</span>
        </nav>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-4">
          {post.pillar && (
            <span
              className={`text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-full ${pillarStyle}`}
            >
              {post.pillar}
            </span>
          )}
          {formattedDate && (
            <span className="text-xs text-cream/40">{formattedDate}</span>
          )}
          {post.reading_time_min && (
            <span className="text-xs text-cream/40">
              {post.reading_time_min} min read
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-light leading-tight">
          {post.title}
        </h1>
      </section>

      {/* ─── Content ─── */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <div className="prose prose-invert prose-lg max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content || ""}
          </ReactMarkdown>
        </div>
      </section>

      {/* ─── Share ─── */}
      <section className="max-w-2xl mx-auto px-6 pb-12">
        <div className="border-t border-white/5 pt-6">
          <ShareButtons title={post.title} slug={post.slug} />
        </div>
      </section>

      {/* ─── About the author ─── */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-8 flex items-start gap-6">
          {/* Avatar placeholder */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/30 to-ocean/20 flex-shrink-0" />
          <div>
            <p className="text-xs uppercase tracking-wider text-cream/40 mb-1">
              Written by
            </p>
            <h3 className="font-heading text-lg text-cream mb-2">Gabs</h3>
            <p className="text-sm text-cream/50 leading-relaxed">
              Astrologer and psychology nerd based in Barcelona. I help people
              decode their charts and understand the patterns that shape their
              relationships, career, and inner world.
            </p>
            <Link
              href="/about"
              className="text-sm text-gold hover:text-gold/80 transition-colors mt-3 inline-block"
            >
              More about me &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Related posts ─── */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 pb-16">
          <SectionHeading label="Keep reading" title="Related posts" />
          <div className="flex flex-col gap-6 mt-10">
            {relatedPosts.map((related) => (
              <BlogPostCard key={related.id} post={related} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Lead capture ─── */}
      <section className="max-w-2xl mx-auto px-6 pb-24 text-center">
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
