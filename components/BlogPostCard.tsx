import Link from "next/link";
import { BlogPostCardProps } from "@/types";

const PILLAR_STYLES: Record<string, { bg: string; color: string }> = {
  Decode: { bg: "rgba(212,112,74,0.15)", color: "var(--coral)" },
  Reframe: { bg: "rgba(122,155,106,0.2)", color: "var(--forest)" },
  Navigate: { bg: "rgba(232,168,56,0.2)", color: "var(--deep-brown)" },
  Align: { bg: "rgba(184,160,112,0.2)", color: "var(--sage)" },
};

const PILLAR_GRADIENT: Record<string, string> = {
  Decode: "linear-gradient(135deg, var(--coral-pale), var(--rust-pale))",
  Reframe: "linear-gradient(135deg, var(--forest-pale), var(--sage-pale))",
  Navigate: "linear-gradient(135deg, var(--gold-pale), var(--cream))",
  Align: "linear-gradient(135deg, var(--sage-pale), var(--cream))",
};

export default function BlogPostCard({ post }: BlogPostCardProps) {
  const pillar = post.pillar;
  const pillarStyle = pillar
    ? PILLAR_STYLES[pillar] ?? { bg: "var(--cream)", color: "var(--text-muted)" }
    : { bg: "var(--cream)", color: "var(--text-muted)" };

  const gradient = pillar
    ? PILLAR_GRADIENT[pillar] ?? PILLAR_GRADIENT.Navigate
    : PILLAR_GRADIENT.Navigate;

  const formattedDate = post.published_at
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(post.published_at))
    : null;

  const thumbStyle = post.featured_image_url
    ? {
        backgroundImage: `url(${post.featured_image_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: gradient };

  return (
    <Link
      href={`/blog/${post.slug}`}
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        background: "white",
        border: "1px solid rgba(184, 160, 112, 0.3)",
        borderRadius: "16px",
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.3s",
        boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
      }}
      className="blog-post-card"
    >
      <div
        style={{
          minHeight: "150px",
          ...thumbStyle,
        }}
      />
      <div
        style={{
          padding: "1.5rem 2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          {pillar && (
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "0.2rem 0.7rem",
                borderRadius: "4px",
                background: pillarStyle.bg,
                color: pillarStyle.color,
              }}
            >
              {pillar}
            </span>
          )}
          {formattedDate && (
            <span style={{ fontSize: "0.7rem", color: "var(--text-light)" }}>
              {formattedDate}
              {post.reading_time_min
                ? ` · ${post.reading_time_min} min read`
                : ""}
            </span>
          )}
        </div>
        <h3
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "1.3rem",
            fontWeight: 400,
            color: "var(--deep-brown)",
            lineHeight: 1.25,
            marginBottom: "0.4rem",
          }}
        >
          {post.title}
        </h3>
        {post.excerpt && (
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              lineHeight: 1.6,
              fontWeight: 300,
            }}
          >
            {post.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}
