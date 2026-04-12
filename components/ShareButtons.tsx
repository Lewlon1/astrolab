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
    <div className="flex items-center gap-4 text-sm text-cream/40">
      <span className="uppercase tracking-wider text-xs">Share</span>
      <button
        onClick={copyLink}
        className="hover:text-cream/70 transition-colors"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-cream/70 transition-colors"
      >
        𝕏 Post
      </a>
    </div>
  );
}
