import Link from "next/link";
import type { BlogPost } from "@/types";
import LangText from "@/components/LangText";

const PILLAR_CLASS: Record<string, string> = {
  Decode: "tag-decode",
  Reframe: "tag-reframe",
  Navigate: "tag-navigate",
  Align: "tag-align",
};

const PILLAR_GRADIENT: Record<string, string> = {
  Decode: "linear-gradient(135deg, rgba(212,112,74,0.15), rgba(196,80,48,0.1))",
  Reframe: "linear-gradient(135deg, rgba(122,155,106,0.15), rgba(74,107,58,0.1))",
  Navigate:
    "linear-gradient(135deg, rgba(232,168,56,0.15), rgba(139,74,42,0.1))",
  Align: "linear-gradient(135deg, rgba(191,168,138,0.15), rgba(139,115,85,0.1))",
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  posts: BlogPost[];
};

export default function BlogPreview({ posts }: Props) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="blog-section" id="blog">
      <div style={{ textAlign: "center" }}>
        <p className="section-eyebrow" style={{ color: "var(--gold)" }}>
          Blog
        </p>
        <h2 className="section-title" style={{ color: "white" }}>
          <LangText
            en="From the cosmic journal"
            es="Del diario cósmico"
          />
        </h2>
      </div>

      <div className="blog-grid">
        {posts.map((post) => {
          const pillar = post.pillar ?? "Navigate";
          const tagClass = PILLAR_CLASS[pillar] ?? "tag-navigate";
          const gradient =
            PILLAR_GRADIENT[pillar] ?? PILLAR_GRADIENT.Navigate;
          const thumbStyle = post.featured_image_url
            ? {
                backgroundImage: `url(${post.featured_image_url})`,
              }
            : { background: gradient };

          return (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="blog-card"
            >
              <div className="blog-thumb" style={thumbStyle} />
              <div className="blog-content">
                <div className="blog-meta">
                  <span className={`blog-tag ${tagClass}`}>{pillar}</span>
                  <span className="blog-date">
                    {formatDate(post.published_at)}
                    {post.reading_time_min
                      ? ` · ${post.reading_time_min} min read`
                      : ""}
                  </span>
                </div>
                <h3 className="blog-title">{post.title}</h3>
                {post.excerpt ? (
                  <p className="blog-excerpt">{post.excerpt}</p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="blog-more">
        <Link href="/blog">
          <LangText en="Read more →" es="Leer más →" />
        </Link>
      </div>
    </section>
  );
}
