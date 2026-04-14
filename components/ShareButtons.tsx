"use client";

import { useState } from "react";
import { BRAND } from "@/lib/constants";

export default function ShareButtons({
  title,
  slug,
}: {
  title: string;
  slug: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = `${BRAND.site.url}/blog/${slug}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        fontSize: "0.85rem",
        color: "var(--text-muted)",
      }}
    >
      <span
        style={{
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          fontSize: "0.7rem",
          fontWeight: 500,
        }}
      >
        Share
      </span>
      <button
        onClick={copyLink}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--coral)",
          fontFamily: "inherit",
          fontSize: "inherit",
        }}
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "var(--coral)", textDecoration: "none" }}
      >
        𝕏 Post
      </a>
    </div>
  );
}
