import Link from "next/link";
import { BlogPostCardProps } from "@/types";

const PILLAR_STYLES: Record<string, string> = {
  Decode: "bg-ocean/10 text-ocean",
  Reframe: "bg-coral/10 text-coral",
  Navigate: "bg-sage/10 text-sage",
  Align: "bg-gold/10 text-gold",
};

export default function BlogPostCard({ post }: BlogPostCardProps) {
  const pillarStyle = post.pillar
    ? PILLAR_STYLES[post.pillar] ?? "bg-white/5 text-cream/50"
    : "bg-white/5 text-cream/50";

  const formattedDate = post.published_at
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(post.published_at))
    : null;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[14px] overflow-hidden flex flex-col md:flex-row"
    >
      {/* Image placeholder */}
      <div className="md:w-1/3 h-48 md:h-auto bg-gradient-to-br from-deep/30 to-ocean/20 flex-shrink-0" />

      {/* Content */}
      <div className="md:w-2/3 p-6">
        <div className="flex items-center gap-3">
          {post.pillar && (
            <span
              className={`text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-full ${pillarStyle}`}
            >
              {post.pillar}
            </span>
          )}
        </div>

        <div className="flex gap-3 text-xs text-cream/40 mt-2">
          {formattedDate && <span>{formattedDate}</span>}
          {post.reading_time_min && (
            <span>{post.reading_time_min} min read</span>
          )}
        </div>

        <h3 className="font-heading text-xl mt-2 group-hover:text-gold/90 transition-colors">
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="text-sm text-cream/50 mt-2 line-clamp-2">
            {post.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}
