"use client";

import { useState } from "react";
import BlogPostCard from "@/components/BlogPostCard";
import type { BlogPost } from "@/types";

const PILLARS = ["All", "Decode", "Reframe", "Navigate", "Align"] as const;
type Pillar = (typeof PILLARS)[number];

const TAB_STYLES: Record<string, string> = {
  All: "bg-gold/10 text-gold",
  Decode: "bg-ocean/10 text-ocean",
  Reframe: "bg-coral/10 text-coral",
  Navigate: "bg-sage/10 text-sage",
  Align: "bg-gold/10 text-gold",
};

export default function BlogPostList({ posts }: { posts: BlogPost[] }) {
  const [activePillar, setActivePillar] = useState<Pillar>("All");

  const filtered =
    activePillar === "All"
      ? posts
      : posts.filter((p) => p.pillar === activePillar);

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-10">
        {PILLARS.map((pillar) => (
          <button
            key={pillar}
            onClick={() => setActivePillar(pillar)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              activePillar === pillar
                ? TAB_STYLES[pillar]
                : "bg-white/5 text-cream/40 hover:text-cream/60"
            }`}
          >
            {pillar}
          </button>
        ))}
      </div>

      {/* Post list */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-6">
          {filtered.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-cream/50 text-sm">No posts in this category yet.</p>
      )}
    </div>
  );
}
