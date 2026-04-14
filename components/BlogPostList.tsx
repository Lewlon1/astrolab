"use client";

import { useState } from "react";
import BlogPostCard from "@/components/BlogPostCard";
import type { BlogPost } from "@/types";

const PILLARS = ["All", "Decode", "Reframe", "Navigate", "Align"] as const;
type Pillar = (typeof PILLARS)[number];

const TAB_ACTIVE: Record<string, { bg: string; color: string }> = {
  All: { bg: "var(--deep-brown)", color: "white" },
  Decode: { bg: "rgba(212,112,74,0.2)", color: "var(--coral)" },
  Reframe: { bg: "rgba(122,155,106,0.25)", color: "var(--forest)" },
  Navigate: { bg: "rgba(232,168,56,0.25)", color: "var(--deep-brown)" },
  Align: { bg: "rgba(184,160,112,0.25)", color: "var(--sage)" },
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
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "2.5rem",
        }}
      >
        {PILLARS.map((pillar) => {
          const isActive = activePillar === pillar;
          const active = TAB_ACTIVE[pillar] ?? {
            bg: "var(--cream)",
            color: "var(--text-muted)",
          };
          return (
            <button
              key={pillar}
              onClick={() => setActivePillar(pillar)}
              style={{
                borderRadius: "50px",
                padding: "0.4rem 1rem",
                fontSize: "0.8rem",
                fontWeight: 500,
                border: "1px solid",
                background: isActive ? active.bg : "transparent",
                color: isActive ? active.color : "var(--text-muted)",
                borderColor: isActive ? active.bg : "rgba(184,160,112,0.4)",
                cursor: "pointer",
                transition: "all 0.2s",
                letterSpacing: "0.04em",
                fontFamily: "inherit",
              }}
            >
              {pillar}
            </button>
          );
        })}
      </div>

      {/* Post list */}
      {filtered.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {filtered.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          No posts in this category yet.
        </p>
      )}
    </div>
  );
}
