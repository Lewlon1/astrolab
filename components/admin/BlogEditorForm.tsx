"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import type { BlogPost } from "@/types";
import AdminInput from "@/components/admin/ui/AdminInput";
import AdminTextarea from "@/components/admin/ui/AdminTextarea";
import AdminToggle from "@/components/admin/ui/AdminToggle";
import Toast from "@/components/admin/ui/Toast";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";

const PILLARS = ["Decode", "Reframe", "Navigate", "Align"] as const;
type Pillar = (typeof PILLARS)[number];

const pillarStyles: Record<Pillar, { active: string; inactive: string }> = {
  Decode: {
    active: "bg-cyan-50 text-cyan-700 border-cyan-200",
    inactive: "bg-white text-[#6b6560] border-[#e8e5df] hover:border-cyan-300",
  },
  Reframe: {
    active: "bg-orange-50 text-orange-700 border-orange-200",
    inactive: "bg-white text-[#6b6560] border-[#e8e5df] hover:border-orange-300",
  },
  Navigate: {
    active: "bg-green-50 text-green-700 border-green-200",
    inactive: "bg-white text-[#6b6560] border-[#e8e5df] hover:border-green-300",
  },
  Align: {
    active: "bg-amber-50 text-amber-700 border-amber-200",
    inactive: "bg-white text-[#6b6560] border-[#e8e5df] hover:border-amber-300",
  },
};

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function calcReadingTime(content: string | null) {
  return Math.max(
    1,
    Math.ceil((content || "").split(/\s+/).filter(Boolean).length / 200)
  );
}

function toLocalDatetime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface BlogEditorFormProps {
  initialData?: BlogPost;
}

export default function BlogEditorForm({ initialData }: BlogEditorFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [pillar, setPillar] = useState<Pillar | null>(
    (initialData?.pillar as Pillar | null) ?? null
  );
  const [isPublished, setIsPublished] = useState(
    initialData?.is_published ?? false
  );
  const [publishedAt, setPublishedAt] = useState(
    toLocalDatetime(initialData?.published_at ?? null)
  );
  const [metaTitle, setMetaTitle] = useState(initialData?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(
    initialData?.meta_description ?? ""
  );

  const [slugEdited, setSlugEdited] = useState(!!initialData);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const readingTime = calcReadingTime(content);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugEdited) {
      setSlug(generateSlug(title));
    }
  }, [title, slugEdited]);

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSlugEdited(true);
      setSlug(e.target.value);
    },
    []
  );

  const handlePublishedToggle = useCallback(
    (checked: boolean) => {
      setIsPublished(checked);
      if (checked && !publishedAt) {
        setPublishedAt(toLocalDatetime(new Date().toISOString()));
      }
    },
    [publishedAt]
  );

  async function save(publish?: boolean) {
    setSaving(true);

    const shouldPublish = publish ?? isPublished;
    let finalPublishedAt = publishedAt || null;
    if (publish && !publishedAt) {
      const now = toLocalDatetime(new Date().toISOString());
      setPublishedAt(now);
      finalPublishedAt = now;
    }

    const record = {
      title,
      slug,
      content: content || null,
      excerpt: excerpt || null,
      pillar,
      is_published: shouldPublish,
      published_at: finalPublishedAt
        ? new Date(finalPublishedAt).toISOString()
        : null,
      reading_time_min: readingTime,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
    };

    if (publish) {
      setIsPublished(true);
    }

    try {
      if (initialData) {
        const { error } = await supabase
          .from("blog_posts")
          .update(record)
          .eq("id", initialData.id);
        if (error) throw error;
        setToast({ message: "Post saved successfully", type: "success" });
      } else {
        const { data, error } = await supabase
          .from("blog_posts")
          .insert(record)
          .select("id")
          .single();
        if (error) throw error;
        setToast({ message: "Post created successfully", type: "success" });
        router.replace(`/admin/blog/${data.id}`);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setToast({ message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initialData) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", initialData.id);
      if (error) throw error;
      router.replace("/admin/blog");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete post";
      setToast({ message, type: "error" });
      setDeleting(false);
      setShowDelete(false);
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmModal
        isOpen={showDelete}
        title="Delete post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/blog"
          className="text-sm text-[#6b6560] hover:text-[#1a1a18] transition-colors"
        >
          &larr; Blog
        </Link>
      </div>

      {/* Title & slug */}
      <div className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          className="w-full text-2xl font-heading text-[#1a1a18] bg-transparent border-0 border-b border-[#e8e5df] pb-2 focus:outline-none focus:border-[#1a1a18] transition-colors placeholder:text-[#b8b0a4]"
        />
        <div className="flex items-center gap-1 text-sm text-[#6b6560]">
          <span>/blog/</span>
          <input
            type="text"
            value={slug}
            onChange={handleSlugChange}
            placeholder="post-slug"
            className="bg-transparent border-0 text-sm text-[#1a1a18] focus:outline-none placeholder:text-[#b8b0a4]"
          />
        </div>
      </div>

      {/* Meta row: pillar selector + reading time */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {PILLARS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPillar(pillar === p ? null : p)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                pillar === p
                  ? pillarStyles[p].active
                  : pillarStyles[p].inactive
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="text-sm text-[#6b6560]">{readingTime} min read</span>
      </div>

      {/* Excerpt */}
      <AdminTextarea
        label="Excerpt"
        id="excerpt"
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        placeholder="Brief summary for cards and SEO..."
        rows={3}
      />

      {/* Split-pane markdown editor */}
      <div>
        <label className="block text-sm font-medium text-[#1a1a18] mb-1.5">
          Content
        </label>
        <div className="grid grid-cols-2 border border-[#e8e5df] rounded-xl overflow-hidden min-h-[500px]">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post in Markdown..."
            className="font-mono text-sm p-4 bg-[#fafaf8] resize-none h-full border-r border-[#e8e5df] focus:outline-none placeholder:text-[#b8b0a4]"
          />
          <div className="bg-[#0a1628] p-6 overflow-y-auto">
            <div className="prose prose-invert prose-lg max-w-none">
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              ) : (
                <p className="text-gray-500 italic">
                  Preview will appear here...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SEO section */}
      <div className="bg-white border border-[#e8e5df] rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-[#1a1a18]">SEO</h3>
        <AdminInput
          label="Meta title"
          id="meta_title"
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          placeholder="Custom page title for search engines"
        />
        <AdminTextarea
          label="Meta description"
          id="meta_description"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          placeholder="Short description for search results"
          rows={2}
        />
      </div>

      {/* Publishing controls */}
      <div className="bg-white border border-[#e8e5df] rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-[#1a1a18]">Publishing</h3>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <AdminToggle
            label="Published"
            checked={isPublished}
            onChange={handlePublishedToggle}
          />
          <AdminInput
            label="Publish date"
            id="published_at"
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => save(false)}
            disabled={saving || !title.trim()}
            className="text-sm font-medium px-5 py-2.5 rounded-lg border border-[#e8e5df] text-[#1a1a18] hover:bg-[#f5f3ef] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving || !title.trim()}
            className="text-sm font-medium px-5 py-2.5 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Publish"}
          </button>
        </div>
        {initialData && (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            Delete post
          </button>
        )}
      </div>
    </div>
  );
}
