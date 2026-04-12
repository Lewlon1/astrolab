"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  BlogPost,
  ContentQueueItem,
  ContentChannel,
  RepurposeResponse,
} from "@/types";
import AdminSelect from "@/components/admin/ui/AdminSelect";
import Toast from "@/components/admin/ui/Toast";

interface RepurposeClientProps {
  blogPosts: BlogPost[];
  existingQueue: ContentQueueItem[];
}

const CHANNELS: { key: string; dbChannel: ContentChannel; label: string }[] = [
  {
    key: "instagram_carousel",
    dbChannel: "instagram_carousel",
    label: "Instagram Carousel",
  },
  {
    key: "instagram_caption",
    dbChannel: "instagram_caption",
    label: "Instagram Caption",
  },
  {
    key: "email_newsletter",
    dbChannel: "email_newsletter",
    label: "Email Newsletter",
  },
  { key: "reel_script", dbChannel: "reel_script", label: "Reel Script" },
  { key: "threads_post", dbChannel: "threads", label: "Threads" },
  { key: "pinterest_pin", dbChannel: "pinterest", label: "Pinterest" },
];

const pillarBadgeStyles: Record<string, string> = {
  Decode: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Reframe: "bg-orange-50 text-orange-700 border-orange-200",
  Navigate: "bg-green-50 text-green-700 border-green-200",
  Align: "bg-amber-50 text-amber-700 border-amber-200",
};

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  edited: "bg-amber-50 text-amber-700",
  published: "bg-green-50 text-green-700",
};

function formatChannelContent(key: string, data: unknown): string {
  if (!data) return "";
  const d = data as Record<string, unknown>;

  switch (key) {
    case "instagram_carousel": {
      const slides = (d.slides as string[]) || [];
      const notes = (d.notes as string) || "";
      return (
        slides.map((s, i) => `Slide ${i + 1}: ${s}`).join("\n\n") +
        (notes ? `\n\n---\nDesign notes: ${notes}` : "")
      );
    }
    case "instagram_caption": {
      const text = (d.text as string) || "";
      const hashtags = (d.hashtags as string[]) || [];
      const cta = (d.cta as string) || "";
      return `${text}\n\n${hashtags.map((h) => `#${h}`).join(" ")}\n\nCTA: ${cta}`;
    }
    case "email_newsletter": {
      const subject = (d.subject_line as string) || "";
      const preview = (d.preview_text as string) || "";
      const body = (d.body as string) || "";
      return `Subject: ${subject}\nPreview: ${preview}\n\n${body}`;
    }
    case "reel_script": {
      const hook = (d.hook as string) || "";
      const body = (d.body as string) || "";
      const cta = (d.cta as string) || "";
      return `HOOK: ${hook}\n\nBODY: ${body}\n\nCTA: ${cta}`;
    }
    case "threads_post":
      return (d.text as string) || "";
    case "pinterest_pin": {
      const title = (d.title as string) || "";
      const desc = (d.description as string) || "";
      return `Title: ${title}\n\nDescription: ${desc}`;
    }
    default:
      return JSON.stringify(data, null, 2);
  }
}

export default function RepurposeClient({
  blogPosts,
  existingQueue,
}: RepurposeClientProps) {
  const [selectedPostId, setSelectedPostId] = useState("");
  const [generatedContent, setGeneratedContent] =
    useState<RepurposeResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateCooldown, setGenerateCooldown] = useState(false);
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string, string>>(
    {}
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [queueItems, setQueueItems] =
    useState<ContentQueueItem[]>(existingQueue);
  const [activeTab, setActiveTab] = useState<"generate" | "queue">("generate");

  const router = useRouter();
  const supabase = createClient();

  const selectedPost = blogPosts.find((p) => p.id === selectedPostId) ?? null;
  const wordCount = selectedPost?.content
    ? selectedPost.content.split(/\s+/).filter(Boolean).length
    : 0;

  const handleGenerate = useCallback(async () => {
    if (!selectedPostId || generating || generateCooldown) return;

    setGenerating(true);
    setGeneratedContent(null);

    try {
      const res = await fetch("/api/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blog_post_id: selectedPostId }),
      });

      const json = await res.json();

      if (!res.ok) {
        setToast({ message: json.error || "Generation failed", type: "error" });
        setGenerating(false);
        return;
      }

      setGeneratedContent(json.data);

      // Initialise editable content from generated data
      const editable: Record<string, string> = {};
      for (const ch of CHANNELS) {
        const raw = (json.data as Record<string, unknown>)[ch.key];
        editable[ch.key] = formatChannelContent(ch.key, raw);
      }
      setEditedContent(editable);

      setToast({ message: "Content generated for all channels", type: "success" });
    } catch {
      setToast({ message: "Failed to connect to API", type: "error" });
    } finally {
      setGenerating(false);
      setGenerateCooldown(true);
      setTimeout(() => setGenerateCooldown(false), 30000);
    }
  }, [selectedPostId, generating, generateCooldown]);

  const handleCopy = useCallback(
    async (channelKey: string) => {
      const text = editedContent[channelKey] || "";
      await navigator.clipboard.writeText(text);
      setToast({ message: "Copied to clipboard", type: "success" });
    },
    [editedContent]
  );

  const handleSave = useCallback(
    async (channelKey: string, dbChannel: ContentChannel) => {
      const content = editedContent[channelKey] || "";

      // Check if row already exists for this post + channel
      const existing = queueItems.find(
        (q) =>
          q.blog_post_id === selectedPostId && q.channel === dbChannel
      );

      if (existing) {
        const { error } = await supabase
          .from("content_queue")
          .update({
            generated_content: content,
            status: "edited" as const,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          setToast({ message: "Failed to update", type: "error" });
          return;
        }
      } else {
        const { error } = await supabase.from("content_queue").insert({
          blog_post_id: selectedPostId,
          channel: dbChannel,
          generated_content: content,
          status: "draft" as const,
        });

        if (error) {
          setToast({ message: "Failed to save", type: "error" });
          return;
        }
      }

      setToast({ message: "Saved to content queue", type: "success" });

      // Refresh queue data
      const { data: refreshed } = await supabase
        .from("content_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<ContentQueueItem[]>();

      if (refreshed) setQueueItems(refreshed);
      router.refresh();
    },
    [editedContent, selectedPostId, queueItems, supabase, router]
  );

  const handleStatusCycle = useCallback(
    async (item: ContentQueueItem) => {
      const cycle: Record<string, string> = {
        draft: "edited",
        edited: "published",
        published: "draft",
      };
      const nextStatus = cycle[item.status] || "draft";

      const { error } = await supabase
        .from("content_queue")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", item.id);

      if (error) {
        setToast({ message: "Failed to update status", type: "error" });
        return;
      }

      setQueueItems((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: nextStatus as ContentQueueItem["status"] } : q
        )
      );
      setToast({ message: `Status updated to ${nextStatus}`, type: "success" });
    },
    [supabase]
  );

  // Group queue items by blog post
  const groupedQueue = queueItems.reduce(
    (acc, item) => {
      const key = item.blog_post_id || "unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, ContentQueueItem[]>
  );

  const getPostTitle = (postId: string) =>
    blogPosts.find((p) => p.id === postId)?.title || "Unknown post";

  const formatChannel = (ch: string) =>
    ch
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#e8e5df]">
        <button
          onClick={() => setActiveTab("generate")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "generate"
              ? "border-deep text-deep"
              : "border-transparent text-[#6b6560] hover:text-[#1a1a18]"
          }`}
        >
          Generate Content
        </button>
        <button
          onClick={() => setActiveTab("queue")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "queue"
              ? "border-deep text-deep"
              : "border-transparent text-[#6b6560] hover:text-[#1a1a18]"
          }`}
        >
          Content Queue
          {queueItems.length > 0 && (
            <span className="ml-2 text-xs bg-deep/10 text-deep px-2 py-0.5 rounded-full">
              {queueItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Generate Tab */}
      {activeTab === "generate" && (
        <div className="space-y-6">
          {/* Blog Post Selector */}
          <div className="bg-white border border-[#e8e5df] rounded-xl p-5 space-y-4">
            <AdminSelect
              id="blog-post-select"
              label="Select a published blog post"
              value={selectedPostId}
              onChange={(e) => {
                setSelectedPostId(e.target.value);
                setGeneratedContent(null);
                setEditedContent({});
                setEditingChannel(null);
              }}
              options={blogPosts.map((p) => ({
                value: p.id,
                label: p.title,
              }))}
              placeholder="Choose a blog post..."
            />

            {selectedPost && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <h3 className="font-heading text-lg text-[#1a1a18]">
                  {selectedPost.title}
                </h3>
                {selectedPost.pillar && (
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full border ${
                      pillarBadgeStyles[selectedPost.pillar] || ""
                    }`}
                  >
                    {selectedPost.pillar}
                  </span>
                )}
                <span className="text-sm text-[#6b6560]">
                  {wordCount.toLocaleString()} words
                </span>
                {selectedPost.published_at && (
                  <span className="text-sm text-[#6b6560]">
                    Published{" "}
                    {new Date(selectedPost.published_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedPostId || generating || generateCooldown}
              className="text-sm font-medium px-5 py-2.5 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating
                ? "Generating..."
                : generateCooldown
                  ? "Please wait (30s)..."
                  : "Generate All Content"}
            </button>
          </div>

          {/* Loading State */}
          {generating && (
            <div className="bg-white border border-[#e8e5df] rounded-xl p-8 text-center space-y-3">
              <div className="inline-block w-6 h-6 border-2 border-deep/20 border-t-deep rounded-full animate-spin" />
              <p className="text-sm text-[#6b6560]">
                Generating content for 6 channels... This may take 30-60 seconds.
              </p>
            </div>
          )}

          {/* Generated Content Grid */}
          {generatedContent && !generating && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CHANNELS.map(({ key, dbChannel, label }) => {
                const content = editedContent[key] || "";
                const isEditing = editingChannel === key;
                const isSaved = queueItems.some(
                  (q) =>
                    q.blog_post_id === selectedPostId &&
                    q.channel === dbChannel
                );

                return (
                  <div
                    key={key}
                    className="bg-white border border-[#e8e5df] rounded-xl p-5 space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-[#1a1a18]">
                        {label}
                      </h4>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full ${
                          isSaved
                            ? "bg-green-50 text-green-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {isSaved ? "Saved" : "Ready to edit"}
                      </span>
                    </div>

                    {/* Content */}
                    {isEditing ? (
                      <textarea
                        value={content}
                        onChange={(e) =>
                          setEditedContent((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        rows={10}
                        className="w-full px-3 py-2.5 border border-[#e8e5df] rounded-lg text-sm text-[#1a1a18] bg-[#fafaf8] font-mono focus:outline-none focus:ring-2 focus:ring-deep/20 focus:border-deep transition-colors resize-y"
                      />
                    ) : (
                      <div className="relative max-h-48 overflow-hidden">
                        <pre className="text-sm text-[#6b6560] whitespace-pre-wrap font-sans leading-relaxed">
                          {content}
                        </pre>
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() =>
                          setEditingChannel(isEditing ? null : key)
                        }
                        className="text-sm text-deep hover:underline"
                      >
                        {isEditing ? "Done" : "Edit"}
                      </button>
                      <button
                        onClick={() => handleCopy(key)}
                        className="text-sm text-deep hover:underline"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => handleSave(key, dbChannel)}
                        className="ml-auto text-sm font-medium px-4 py-2 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Queue Tab */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          {Object.keys(groupedQueue).length === 0 ? (
            <div className="bg-white border border-[#e8e5df] rounded-xl p-8 text-center">
              <p className="text-[#6b6560]">
                No content in queue yet. Select a post and generate content
                above.
              </p>
            </div>
          ) : (
            Object.entries(groupedQueue).map(([postId, items]) => (
              <div
                key={postId}
                className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-[#e8e5df] bg-[#fafaf8]">
                  <h3 className="font-heading text-sm text-[#1a1a18]">
                    {getPostTitle(postId)}
                  </h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e8e5df] text-left">
                      <th className="px-5 py-2.5 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                        Channel
                      </th>
                      <th className="px-5 py-2.5 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-5 py-2.5 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                        Preview
                      </th>
                      <th className="px-5 py-2.5 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                        Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[#e8e5df] last:border-0"
                      >
                        <td className="px-5 py-3 text-sm text-[#1a1a18]">
                          {formatChannel(item.channel)}
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => handleStatusCycle(item)}
                            className={`text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                              statusStyles[item.status] || statusStyles.draft
                            }`}
                          >
                            {item.status}
                          </button>
                        </td>
                        <td className="px-5 py-3 text-sm text-[#6b6560] max-w-xs truncate">
                          {(item.generated_content || "").slice(0, 80)}
                          {(item.generated_content || "").length > 80
                            ? "..."
                            : ""}
                        </td>
                        <td className="px-5 py-3 text-sm text-[#6b6560]">
                          {new Date(item.updated_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
