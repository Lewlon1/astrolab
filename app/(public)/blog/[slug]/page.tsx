import { cache } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/server";
import BlogPostCard from "@/components/BlogPostCard";
import LeadCaptureSection from "@/components/LeadCaptureSection";
import ShareButtons from "@/components/ShareButtons";
import { articleJsonLd } from "@/lib/jsonld";
import type { BlogPost } from "@/types";

const PILLAR_STYLES: Record<string, { bg: string; color: string }> = {
  Decode: { bg: "rgba(212,112,74,0.2)", color: "var(--coral)" },
  Reframe: { bg: "rgba(122,155,106,0.25)", color: "var(--forest)" },
  Navigate: { bg: "rgba(232,168,56,0.25)", color: "var(--deep-brown)" },
  Align: { bg: "rgba(184,160,112,0.25)", color: "var(--sage)" },
};

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
    ? PILLAR_STYLES[post.pillar] ?? {
        bg: "var(--cream)",
        color: "var(--text-muted)",
      }
    : { bg: "var(--cream)", color: "var(--text-muted)" };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd(post)),
        }}
      />

      <div style={{ height: "4rem" }} aria-hidden />

      {/* Header */}
      <section
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "4rem 1.5rem 2rem",
        }}
      >
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.8rem",
            color: "var(--text-light)",
            marginBottom: "2rem",
          }}
        >
          <Link
            href="/blog"
            style={{ color: "var(--text-muted)", textDecoration: "none" }}
          >
            Blog
          </Link>
          <span>/</span>
          <span style={{ color: "var(--text-main)" }}>{post.title}</span>
        </nav>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          {post.pillar && (
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "0.2rem 0.7rem",
                borderRadius: "4px",
                background: pillarStyle.bg,
                color: pillarStyle.color,
              }}
            >
              {post.pillar}
            </span>
          )}
          {formattedDate && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-light)",
              }}
            >
              {formattedDate}
            </span>
          )}
          {post.reading_time_min && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
              {post.reading_time_min} min read
            </span>
          )}
        </div>

        <h1
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            fontWeight: 300,
            color: "var(--deep-brown)",
            lineHeight: 1.15,
          }}
        >
          {post.title}
        </h1>
      </section>

      {/* Content */}
      <section
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "0 1.5rem 4rem",
        }}
      >
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content || ""}
          </ReactMarkdown>
        </div>
      </section>

      {/* Share */}
      <section
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "0 1.5rem 3rem",
        }}
      >
        <div
          style={{
            borderTop: "1px solid rgba(184,160,112,0.3)",
            paddingTop: "1.5rem",
          }}
        >
          <ShareButtons title={post.title} slug={post.slug} />
        </div>
      </section>

      {/* Author */}
      <section
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "0 1.5rem 4rem",
        }}
      >
        <div
          style={{
            background: "white",
            border: "1px solid rgba(184,160,112,0.3)",
            borderRadius: "16px",
            padding: "2rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "1.5rem",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, var(--gold-pale), var(--coral-pale))",
              flexShrink: 0,
            }}
          />
          <div>
            <p
              style={{
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "var(--text-light)",
                marginBottom: "0.25rem",
              }}
            >
              Written by
            </p>
            <h3
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontSize: "1.25rem",
                color: "var(--deep-brown)",
                marginBottom: "0.5rem",
              }}
            >
              Gabs
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-muted)",
                lineHeight: 1.7,
                fontWeight: 300,
              }}
            >
              Astrologer and psychology nerd based in Barcelona. I help people
              decode their charts and understand the patterns that shape their
              relationships, career, and inner world.
            </p>
            <Link
              href="/about"
              style={{
                fontSize: "0.85rem",
                color: "var(--gold)",
                textDecoration: "none",
                marginTop: "0.75rem",
                display: "inline-block",
              }}
            >
              More about me →
            </Link>
          </div>
        </div>
      </section>

      {/* Related */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "0 1.5rem 4rem",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p className="section-eyebrow">Keep reading</p>
            <h2 className="section-title">Related posts</h2>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              marginTop: "2.5rem",
            }}
          >
            {relatedPosts.map((related) => (
              <BlogPostCard key={related.id} post={related} />
            ))}
          </div>
        </section>
      )}

      <LeadCaptureSection />
    </>
  );
}
