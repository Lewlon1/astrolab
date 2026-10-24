"use client";

import { useState, useCallback } from "react";
import type { EngagementTask } from "@/lib/admin/today";
import Toast from "@/components/admin/ui/Toast";
import Link from "next/link";

interface EngagementClientProps {
  /** Today's Tier 3 actions; null when the batch couldn't be loaded. */
  tasks: EngagementTask[] | null;
  activeCount: number;
}

export default function EngagementClient({ tasks, activeCount }: EngagementClientProps) {
  const [list, setList] = useState(tasks ?? []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [postContext, setPostContext] = useState("");
  const [suggestedReply, setSuggestedReply] = useState("");
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const doneCount = list.filter((t) => t.item.status === "done").length;

  // Same endpoint as Lead Queue: "done" also stamps engagement_accounts.last_engaged_at,
  // which is what the daily rotation ranks on.
  const resolve = useCallback(async (id: string, status: "done" | "skipped") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      setList((prev) =>
        prev.map((t) => (t.item.id === id ? { ...t, item: { ...t.item, status } } : t))
      );
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Update failed", type: "error" });
    } finally {
      setBusyId(null);
    }
  }, []);

  const handleSuggestReply = useCallback(async () => {
    if (!comment.trim() || !postContext.trim() || generating) return;

    setGenerating(true);
    setSuggestedReply("");

    try {
      const res = await fetch("/api/suggest-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: comment.trim(), postContext: postContext.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        setToast({ message: json.error || "Failed to generate reply", type: "error" });
        return;
      }

      setSuggestedReply(json.reply);
      setToast({ message: "Reply suggested", type: "success" });
    } catch {
      setToast({ message: "Failed to connect to API", type: "error" });
    } finally {
      setGenerating(false);
    }
  }, [comment, postContext, generating]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(suggestedReply);
    setToast({ message: "Copied to clipboard", type: "success" });
  }, [suggestedReply]);

  return (
    <div className="space-y-6 mt-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left column — Today's engagement list (Daily Actions Tier 3) */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-heading text-lg text-[#1a1a18]">
              Today&apos;s engagement list
            </h2>
            {list.length > 0 && (
              <span className="text-sm text-[#6b6560] shrink-0">
                {doneCount} of {list.length} done
              </span>
            )}
          </div>

          {tasks === null ? (
            <div className="bg-white border border-[#e8e5df] rounded-xl p-6 text-center">
              <p className="text-[#6b6560]">
                Couldn&apos;t load today&apos;s list.{" "}
                <Link href="/admin/lead-queue" className="text-deep hover:underline">
                  Open Lead Queue
                </Link>
              </p>
            </div>
          ) : activeCount === 0 ? (
            <div className="bg-white border border-[#e8e5df] rounded-xl p-6 text-center">
              <p className="text-[#6b6560]">
                No accounts yet.{" "}
                <Link
                  href="/admin/engagement/accounts"
                  className="text-deep hover:underline"
                >
                  Add some accounts
                </Link>{" "}
                to get started.
              </p>
            </div>
          ) : list.length === 0 ? (
            <div className="bg-white border border-[#e8e5df] rounded-xl p-6 text-center">
              <p className="text-[#6b6560]">
                No engagement in today&apos;s actions — follow-ups filled the time budget.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {list.map(({ item, account }) => {
                const isDone = item.status === "done";
                const isSkipped = item.status === "skipped";
                const busy = busyId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-xl p-4 transition-colors ${
                      isDone
                        ? "border-green-200 bg-green-50/30"
                        : "border-[#e8e5df]"
                    } ${isSkipped ? "opacity-60" : ""}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-[#1a1a18]">
                            {account?.handle ?? item.title}
                          </span>
                          {account?.followers && (
                            <span className="text-xs text-[#6b6560]">
                              {account.followers} followers
                            </span>
                          )}
                          {account?.niche && (
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {account.niche}
                            </span>
                          )}
                        </div>
                        {item.reason && (
                          <p className="text-sm text-[#6b6560] mt-1">{item.reason}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 justify-end">
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#6b6560] hover:text-[#1a1a18] hover:bg-[#f5f3ef] px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Open &rarr;
                          </a>
                        )}
                        {item.status === "pending" ? (
                          <>
                            <button
                              onClick={() => resolve(item.id, "skipped")}
                              disabled={busy}
                              className="text-sm text-[#6b6560] hover:text-[#1a1a18] px-3 py-1.5 rounded-lg hover:bg-[#f5f3ef] transition-colors disabled:opacity-40"
                            >
                              Skip
                            </button>
                            <button
                              onClick={() => resolve(item.id, "done")}
                              disabled={busy}
                              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors bg-[#fafaf8] text-[#6b6560] border border-[#e8e5df] hover:bg-[#f5f3ef] disabled:opacity-40"
                            >
                              {busy ? "…" : "Done"}
                            </button>
                          </>
                        ) : (
                          <span
                            className={`text-sm font-medium px-3 py-1.5 rounded-lg ${
                              isDone ? "bg-green-100 text-green-700" : "text-[#b8b0a4]"
                            }`}
                          >
                            {isDone ? "Done ✓" : "Skipped"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Link
            href="/admin/engagement/accounts"
            className="inline-block text-sm text-deep hover:underline"
          >
            Manage accounts →
          </Link>
        </div>

        {/* Right column — Comment reply assistant */}
        <div className="space-y-4">
          <h2 className="font-heading text-lg text-[#1a1a18]">
            Comment reply assistant
          </h2>

          <div className="bg-white border border-[#e8e5df] rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1a1a18] mb-1.5">
                Paste the comment
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="e.g. This really resonated with me! I'm a Scorpio rising and..."
                className="w-full px-3 py-2.5 border border-[#e8e5df] rounded-lg text-sm text-[#1a1a18] bg-[#fafaf8] placeholder:text-[#b8b0a4] focus:outline-none focus:ring-2 focus:ring-deep/20 focus:border-deep transition-colors resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a18] mb-1.5">
                Which post was this on?
              </label>
              <input
                type="text"
                value={postContext}
                onChange={(e) => setPostContext(e.target.value)}
                placeholder="e.g. The Saturn return carousel from last week"
                className="w-full px-3 py-2.5 border border-[#e8e5df] rounded-lg text-sm text-[#1a1a18] bg-[#fafaf8] placeholder:text-[#b8b0a4] focus:outline-none focus:ring-2 focus:ring-deep/20 focus:border-deep transition-colors"
              />
            </div>

            <button
              onClick={handleSuggestReply}
              disabled={!comment.trim() || !postContext.trim() || generating}
              className="text-sm font-medium px-5 py-2.5 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? "Generating reply..." : "Suggest reply"}
            </button>

            {generating && (
              <div className="flex items-center gap-3 py-2">
                <div className="w-5 h-5 border-2 border-deep/20 border-t-deep rounded-full animate-spin" />
                <span className="text-sm text-[#6b6560]">
                  Generating reply...
                </span>
              </div>
            )}

            {suggestedReply && !generating && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[#1a1a18]">
                  Suggested reply
                </label>
                <textarea
                  value={suggestedReply}
                  onChange={(e) => setSuggestedReply(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2.5 border border-[#e8e5df] rounded-lg text-sm text-[#1a1a18] bg-[#fafaf8] focus:outline-none focus:ring-2 focus:ring-deep/20 focus:border-deep transition-colors resize-y"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="text-sm font-medium px-4 py-2 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={handleSuggestReply}
                    disabled={generating}
                    className="text-sm font-medium px-4 py-2 rounded-lg border border-[#e8e5df] text-[#1a1a18] hover:bg-[#f5f3ef] transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom stats bar */}
      <div className="bg-white border border-[#e8e5df] rounded-xl px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-sm text-[#1a1a18]">
            <span className="font-medium">Accounts engaged today:</span>{" "}
            <span className={doneCount === list.length ? "text-green-600 font-medium" : "text-[#6b6560]"}>
              {doneCount}/{list.length}
            </span>
          </span>
          <span className="text-sm text-[#6b6560]">
            Time spent: ~{doneCount * 3}m
          </span>
        </div>
        {doneCount === list.length && list.length > 0 && (
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-50 text-green-700">
            All done for today
          </span>
        )}
      </div>
    </div>
  );
}
