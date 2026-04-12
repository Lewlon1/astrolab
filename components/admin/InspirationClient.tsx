"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { TrendItem, ContentIdea } from "@/types";
import Toast from "@/components/admin/ui/Toast";

const NICHE_OPTIONS = [
  "All niches",
  "Astrology",
  "Psychology",
  "Wellness",
  "Astro x Psych",
];

const heatStyles: Record<string, string> = {
  Surging: "bg-red-50 text-red-700 border-red-200",
  Growing: "bg-orange-50 text-orange-700 border-orange-200",
  Emerging: "bg-blue-50 text-blue-700 border-blue-200",
  Sustained: "bg-green-50 text-green-700 border-green-200",
  "Pre-trend": "bg-purple-50 text-purple-700 border-purple-200",
};

const pillarStyles: Record<string, string> = {
  Decode: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Reframe: "bg-orange-50 text-orange-700 border-orange-200",
  Navigate: "bg-green-50 text-green-700 border-green-200",
  Align: "bg-amber-50 text-amber-700 border-amber-200",
};

const effortStyles: Record<string, string> = {
  Low: "bg-green-50 text-green-700",
  Medium: "bg-amber-50 text-amber-700",
  High: "bg-red-50 text-red-700",
};

const platformStyles: Record<string, string> = {
  Instagram: "bg-pink-50 text-pink-700",
  TikTok: "bg-gray-100 text-gray-700",
  Pinterest: "bg-red-50 text-red-600",
};

export default function InspirationClient() {
  const router = useRouter();
  const supabase = createClient();

  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [nicheFilter, setNicheFilter] = useState("All niches");
  const [expandedIdx, setExpandedIdx] = useState<Set<number>>(new Set());
  const [savedIdeas, setSavedIdeas] = useState<Set<string>>(new Set());
  const [userContext, setUserContext] = useState("");
  const [searchResultCount, setSearchResultCount] = useState<number | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setTrends([]);
    setExpandedIdx(new Set());
    setError(null);
    setSearchResultCount(null);

    try {
      const res = await fetch("/api/inspiration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: nicheFilter,
          userContext: userContext.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json.error || "Failed to fetch trends";
        setError(msg);
        setToast({ message: msg, type: "error" });
        setLoading(false);
        return;
      }

      setTrends(json.trends || []);
      setSearchResultCount(json.searchResultCount ?? null);
      setToast({ message: "5 trends discovered", type: "success" });
    } catch {
      const msg = "Failed to connect to API";
      setError(msg);
      setToast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  }, [nicheFilter, userContext]);

  const toggleExpand = useCallback((idx: number) => {
    setExpandedIdx((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, []);

  const handleSaveToQueue = useCallback(
    async (idea: ContentIdea, trendTopic: string) => {
      const ideaKey = `${trendTopic}-${idea.title}`;
      if (savedIdeas.has(ideaKey)) return;

      // Map content type to a channel
      const channelMap: Record<string, string> = {
        carousel: "instagram_carousel",
        reel: "reel_script",
        email: "email_newsletter",
        blog: "instagram_caption",
        workshop: "instagram_caption",
        "lead magnet": "instagram_caption",
      };
      const channel =
        channelMap[idea.type.toLowerCase()] || "instagram_caption";

      const { error } = await supabase.from("content_queue").insert({
        blog_post_id: null,
        channel,
        generated_content: `[${idea.type}] ${idea.title}\n\nTrend: ${trendTopic}\nPillar: ${idea.pillar}\nEffort: ${idea.effort}`,
        status: "draft",
      });

      if (error) {
        setToast({ message: "Failed to save to queue", type: "error" });
        return;
      }

      setSavedIdeas((prev) => new Set(prev).add(ideaKey));
      setToast({ message: "Saved to content queue", type: "success" });
    },
    [savedIdeas, supabase]
  );

  const handleDraftNow = useCallback(
    (title: string) => {
      router.push(`/admin/blog/new?title=${encodeURIComponent(title)}`);
    },
    [router]
  );

  // Client-side niche filter (secondary — the API also filters by niche)
  const filteredTrends =
    nicheFilter === "All niches"
      ? trends
      : trends.filter(
          (t) => t.niche.toLowerCase() === nicheFilter.toLowerCase()
        );

  return (
    <div className="space-y-6 mt-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* User context textarea */}
      <div>
        <label
          htmlFor="userContext"
          className="block text-sm font-medium text-[#6b6560] mb-1.5"
        >
          Paste any trends you&apos;ve noticed (optional)
        </label>
        <textarea
          id="userContext"
          value={userContext}
          onChange={(e) => setUserContext(e.target.value)}
          placeholder="e.g. I'm seeing lots of Chiron return content on TikTok this week..."
          rows={3}
          className="w-full text-sm px-4 py-3 border border-[#e8e5df] rounded-lg bg-[#fafaf8] text-[#1a1a18] placeholder:text-[#b8b0a4] focus:outline-none focus:ring-2 focus:ring-deep/20 focus:border-deep resize-none"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={fetchTrends}
          disabled={loading}
          className="text-sm font-medium px-5 py-2.5 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Scanning..." : "Refresh trends"}
        </button>

        <select
          value={nicheFilter}
          onChange={(e) => setNicheFilter(e.target.value)}
          className="text-sm px-3 py-2.5 border border-[#e8e5df] rounded-lg bg-[#fafaf8] text-[#1a1a18] focus:outline-none focus:ring-2 focus:ring-deep/20 focus:border-deep"
        >
          {NICHE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        {searchResultCount !== null && (
          <span className="text-xs text-[#6b6560]">
            Analysed {searchResultCount} web sources
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white border border-[#e8e5df] rounded-xl p-8 text-center space-y-3">
          <div className="inline-block w-6 h-6 border-2 border-deep/20 border-t-deep rounded-full animate-spin" />
          <p className="text-sm text-[#6b6560]">
            Searching the web for trends, then analysing... This may take a
            minute.
          </p>
        </div>
      )}

      {/* Error state with retry */}
      {!loading && error && trends.length === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-3">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchTrends}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && trends.length === 0 && (
        <div className="bg-white border border-[#e8e5df] rounded-xl p-8 text-center">
          <p className="text-[#6b6560]">
            Click &quot;Refresh trends&quot; to scan for trending content across
            your niches.
          </p>
        </div>
      )}

      {/* Trend cards */}
      {!loading && filteredTrends.length > 0 && (
        <div className="space-y-4">
          {filteredTrends.map((trend, idx) => {
            const isExpanded = expandedIdx.has(idx);

            return (
              <div
                key={idx}
                className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden"
              >
                {/* Collapsed header — always visible */}
                <button
                  onClick={() => toggleExpand(idx)}
                  className="w-full px-5 py-4 text-left hover:bg-[#f5f3ef] transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                        heatStyles[trend.heat] || heatStyles.Emerging
                      }`}
                    >
                      {trend.heat}
                    </span>
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        platformStyles[trend.platform] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {trend.platform}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {trend.niche}
                    </span>
                    <span className="font-heading text-[#1a1a18] flex-1">
                      {trend.topic}
                    </span>
                    <span className="text-xs text-[#6b6560]">
                      {trend.reach}
                    </span>
                    <span className="text-xs text-[#b8b0a4]">
                      {trend.content_ideas?.length || 0} ideas
                    </span>
                    <span className="text-[#b8b0a4] text-sm">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-0 space-y-5 border-t border-[#e8e5df]">
                    {/* Analysis */}
                    <div className="grid md:grid-cols-3 gap-4 pt-4">
                      <div>
                        <h4 className="text-xs font-medium text-[#6b6560] uppercase tracking-wider mb-2">
                          Why it works
                        </h4>
                        <p className="text-sm text-[#1a1a18] leading-relaxed">
                          {trend.why_working}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-[#6b6560] uppercase tracking-wider mb-2">
                          Top creators
                        </h4>
                        <div className="space-y-1">
                          {trend.top_creators?.map((creator, i) => (
                            <p
                              key={i}
                              className="text-sm text-deep font-medium"
                            >
                              {creator}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-[#6b6560] uppercase tracking-wider mb-2">
                          Gabs&apos; angle
                        </h4>
                        <p className="text-sm text-[#1a1a18] leading-relaxed">
                          {trend.gabs_angle}
                        </p>
                      </div>
                    </div>

                    {/* Content ideas grid */}
                    <div>
                      <h4 className="text-xs font-medium text-[#6b6560] uppercase tracking-wider mb-3">
                        Content ideas
                      </h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {trend.content_ideas?.map((idea, ideaIdx) => {
                          const ideaKey = `${trend.topic}-${idea.title}`;
                          const isSaved = savedIdeas.has(ideaKey);

                          return (
                            <div
                              key={ideaIdx}
                              className="border border-[#e8e5df] rounded-lg p-4 space-y-3"
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#f5f3ef] text-[#1a1a18]">
                                  {idea.type}
                                </span>
                                <span
                                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                                    pillarStyles[idea.pillar] || ""
                                  }`}
                                >
                                  {idea.pillar}
                                </span>
                                <span
                                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                                    effortStyles[idea.effort] || ""
                                  }`}
                                >
                                  {idea.effort}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-[#1a1a18]">
                                {idea.title}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleSaveToQueue(idea, trend.topic)
                                  }
                                  disabled={isSaved}
                                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                                    isSaved
                                      ? "bg-green-50 text-green-700 cursor-default"
                                      : "bg-deep text-white hover:bg-deep/90"
                                  }`}
                                >
                                  {isSaved ? "Saved ✓" : "Save to queue"}
                                </button>
                                <button
                                  onClick={() => handleDraftNow(idea.title)}
                                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#e8e5df] text-[#1a1a18] hover:bg-[#f5f3ef] transition-colors"
                                >
                                  Draft now
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom note */}
      <div className="bg-[#fafaf8] border border-[#e8e5df] rounded-xl px-5 py-4">
        <p className="text-sm text-[#6b6560] leading-relaxed">
          The inspiration generator searches the web for trending content across
          your niches and analyses it with AI to generate ideas tailored to your
          brand. Use it during your Sunday batch session to plan the week&apos;s
          content.
        </p>
        <p className="text-xs text-[#b8b0a4] mt-2">Powered by Brave Search</p>
      </div>
    </div>
  );
}
