"use client";

import { useEffect, useState } from "react";
import type {
  Transit,
  Language,
  HoroscopeRead,
  TransitHoroscopeResponse,
  Sign,
} from "@/lib/transits/types";
import { SIGNS } from "@/lib/transits/types";
import { buildHoroscopePrompt } from "@/lib/transits/buildHoroscopePrompt";
import AdminSelect from "@/components/admin/ui/AdminSelect";

interface HoroscopeModalProps {
  transit: Transit | null;
  onClose: () => void;
  onSaved: (saved: { reads: HoroscopeRead[]; language: Language; transit: Transit }) => Promise<void> | void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "both", label: "Both" },
];

const RATE_LIMIT_MS = 60_000;

export default function HoroscopeModal({
  transit,
  onClose,
  onSaved,
  onError,
  onSuccess,
}: HoroscopeModalProps) {
  const [language, setLanguage] = useState<Language>("en");
  const [generating, setGenerating] = useState(false);
  const [reads, setReads] = useState<HoroscopeRead[]>([]);
  const [saving, setSaving] = useState(false);
  const [coolDownUntil, setCoolDownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (coolDownUntil <= Date.now()) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [coolDownUntil]);

  // Reset when the transit changes.
  useEffect(() => {
    setReads([]);
    setLanguage("en");
  }, [transit?.id]);

  // Close on Escape.
  useEffect(() => {
    if (!transit) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [transit, onClose]);

  if (!transit) return null;

  const remainingMs = Math.max(0, coolDownUntil - now);
  const generateDisabled = generating || remainingMs > 0;

  const handleGenerate = async () => {
    setGenerating(true);
    setReads([]);
    try {
      const res = await fetch("/api/transit-horoscope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transit, language }),
      });
      const json = (await res.json()) as TransitHoroscopeResponse | { error: string };
      if (!res.ok || "error" in json) {
        const msg = "error" in json ? json.error : "Bedrock generation failed";
        onError(msg);
        return;
      }
      setReads(json.reads);
      setCoolDownUntil(Date.now() + RATE_LIMIT_MS);
    } catch {
      onError("Network error — try Copy Prompt instead.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyPrompt = async () => {
    const { system, user } = buildHoroscopePrompt({ transit, language });
    const full = `SYSTEM:\n${system}\n\nUSER:\n${user}`;
    try {
      await navigator.clipboard.writeText(full);
      onSuccess("Prompt copied to clipboard");
    } catch {
      onError("Couldn't copy — your browser blocked clipboard access");
    }
  };

  const handleCopyRead = async (read: HoroscopeRead) => {
    try {
      await navigator.clipboard.writeText(
        `${read.sign} ${read.placement === "sun" ? "Sun" : "Rising"}\n\n${read.content}`
      );
      onSuccess(`${read.sign} ${read.placement} copied`);
    } catch {
      onError("Couldn't copy");
    }
  };

  const handleSave = async () => {
    if (reads.length === 0) return;
    setSaving(true);
    try {
      await onSaved({ reads, language, transit });
    } finally {
      setSaving(false);
    }
  };

  // Build a (sign, placement) → read lookup so the grid renders predictably
  // even if the API returned the array out of order.
  const lookup = new Map<string, HoroscopeRead>();
  for (const r of reads) lookup.set(`${r.sign}-${r.placement}`, r);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-label={`Horoscope bundle for ${transit.title}`}
        className="relative bg-white border border-[#e8e5df] rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-[#e8e5df] flex items-start justify-between gap-3 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-heading text-lg text-[#1a1a18]">
              Sign-by-sign read
            </h2>
            <p className="text-xs text-[#6b6560] mt-0.5">
              {transit.glyph} {transit.title} · 12 signs × Sun/Rising = 24 reads
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#6b6560] hover:text-[#1a1a18] p-1 rounded-lg hover:bg-[#f5f3ef] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <line x1="3" y1="3" x2="15" y2="15" />
              <line x1="15" y1="3" x2="3" y2="15" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <AdminSelect
              id="horoscope-language"
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              options={LANGUAGE_OPTIONS}
              className="w-40"
            />
            <button
              onClick={handleGenerate}
              disabled={generateDisabled}
              className="text-sm font-medium px-4 py-2.5 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating
                ? "Generating 24 reads (~20s)..."
                : remainingMs > 0
                  ? `Wait ${Math.ceil(remainingMs / 1000)}s`
                  : "Generate bundle"}
            </button>
            <button
              onClick={handleCopyPrompt}
              className="text-sm font-medium px-4 py-2.5 rounded-lg border border-[#e8e5df] text-[#1a1a18] hover:bg-[#f5f3ef] transition-colors"
            >
              Copy prompt
            </button>
            {reads.length > 0 && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="ml-auto text-sm font-medium px-4 py-2.5 rounded-lg border border-deep text-deep hover:bg-deep/5 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save bundle"}
              </button>
            )}
          </div>

          {reads.length > 0 && (
            <div className="space-y-4">
              {(["sun", "rising"] as const).map((placement) => (
                <div key={placement}>
                  <h3 className="text-xs font-medium text-[#6b6560] uppercase tracking-wider mb-2">
                    {placement === "sun" ? "Sun signs" : "Rising signs"}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SIGNS.map((sign: Sign) => {
                      const read = lookup.get(`${sign}-${placement}`);
                      if (!read) {
                        return (
                          <div
                            key={`${sign}-${placement}`}
                            className="border border-dashed border-[#e8e5df] rounded-lg p-3 bg-[#fafaf8]"
                          >
                            <div className="text-sm font-medium text-[#b8b0a4]">
                              {sign}
                            </div>
                            <p className="text-xs text-[#b8b0a4] mt-1">
                              Missing from response
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={`${sign}-${placement}`}
                          className="border border-[#e8e5df] rounded-lg p-3 bg-white"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="text-sm font-medium text-[#1a1a18]">
                              {sign}
                            </div>
                            <button
                              onClick={() => handleCopyRead(read)}
                              className="text-[11px] font-medium text-deep hover:underline"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-xs text-[#1a1a18] leading-relaxed whitespace-pre-line">
                            {read.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!generating && reads.length === 0 && (
            <div className="bg-[#fafaf8] border border-[#e8e5df] rounded-lg p-5 text-center">
              <p className="text-sm text-[#6b6560]">
                Pick a language and click <span className="font-medium text-[#1a1a18]">Generate bundle</span>.
                One Bedrock call returns all 24 reads in ~20 seconds.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
