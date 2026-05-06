"use client";

import { useEffect, useState } from "react";
import type {
  Transit,
  Pillar,
  Format,
  Language,
  TransitDraftResponse,
} from "@/lib/transits/types";
import { buildDraftPrompt } from "@/lib/transits/buildDraftPrompt";
import AdminSelect from "@/components/admin/ui/AdminSelect";
import AdminTextarea from "@/components/admin/ui/AdminTextarea";

interface DraftModalProps {
  transit: Transit | null;
  onClose: () => void;
  onSaved: (saved: { content: string; pillar: Pillar; format: Format; language: Language; angle: string; transit: Transit }) => Promise<void> | void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

const PILLAR_OPTIONS = [
  { value: "decode", label: "Decode" },
  { value: "reframe", label: "Reframe" },
  { value: "relate", label: "Relate" },
  { value: "convert", label: "Convert" },
];
const FORMAT_OPTIONS = [
  { value: "reel", label: "Reel" },
  { value: "carousel", label: "Carousel" },
  { value: "caption", label: "Caption" },
  { value: "story", label: "Story" },
];
const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "both", label: "Both" },
];

const RATE_LIMIT_MS = 30_000;

export default function DraftModal({
  transit,
  onClose,
  onSaved,
  onError,
  onSuccess,
}: DraftModalProps) {
  const [pillar, setPillar] = useState<Pillar>("decode");
  const [format, setFormat] = useState<Format>("caption");
  const [language, setLanguage] = useState<Language>("en");
  const [angle, setAngle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [coolDownUntil, setCoolDownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (coolDownUntil <= Date.now()) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [coolDownUntil]);

  // Reset state when the transit changes (modal re-used).
  useEffect(() => {
    setContent("");
    setAngle("");
    setPillar("decode");
    setFormat("caption");
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
    setContent("");
    try {
      const res = await fetch("/api/transit-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transit,
          pillar,
          format,
          language,
          angle: angle.trim() || undefined,
        }),
      });
      const json = (await res.json()) as TransitDraftResponse | { error: string };
      if (!res.ok || "error" in json) {
        const msg = "error" in json ? json.error : "Bedrock generation failed";
        onError(msg);
        return;
      }
      setContent(json.content);
      setCoolDownUntil(Date.now() + RATE_LIMIT_MS);
    } catch {
      onError("Network error — try Copy Prompt instead.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyPrompt = async () => {
    const { system, user } = buildDraftPrompt({
      transit,
      pillar,
      format,
      language,
      angle: angle.trim() || undefined,
    });
    const full = `SYSTEM:\n${system}\n\nUSER:\n${user}`;
    try {
      await navigator.clipboard.writeText(full);
      onSuccess("Prompt copied to clipboard");
    } catch {
      onError("Couldn't copy — your browser blocked clipboard access");
    }
  };

  const handleCopyContent = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      onSuccess("Content copied");
    } catch {
      onError("Couldn't copy");
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await onSaved({
        content,
        pillar,
        format,
        language,
        angle: angle.trim(),
        transit,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-label={`Draft for ${transit.title}`}
        className="relative bg-white border border-[#e8e5df] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-[#e8e5df] flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg text-[#1a1a18]">
              Draft content
            </h2>
            <p className="text-xs text-[#6b6560] mt-0.5">
              {transit.glyph} {transit.title} · {transit.date}
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

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <AdminSelect
              id="draft-pillar"
              label="Pillar"
              value={pillar}
              onChange={(e) => setPillar(e.target.value as Pillar)}
              options={PILLAR_OPTIONS}
            />
            <AdminSelect
              id="draft-format"
              label="Format"
              value={format}
              onChange={(e) => setFormat(e.target.value as Format)}
              options={FORMAT_OPTIONS}
            />
            <AdminSelect
              id="draft-language"
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              options={LANGUAGE_OPTIONS}
            />
          </div>

          <AdminTextarea
            id="draft-angle"
            label="Angle (optional)"
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            placeholder="e.g. Frame this around attachment patterns rather than fate. Hook with a question."
            rows={2}
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleGenerate}
              disabled={generateDisabled}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating
                ? "Generating..."
                : remainingMs > 0
                  ? `Wait ${Math.ceil(remainingMs / 1000)}s`
                  : "Generate with AI"}
            </button>
            <button
              onClick={handleCopyPrompt}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-[#e8e5df] text-[#1a1a18] hover:bg-[#f5f3ef] transition-colors"
            >
              Copy prompt
            </button>
          </div>

          {content && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#1a1a18]">
                Draft
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full px-3 py-2.5 border border-[#e8e5df] rounded-lg text-[#1a1a18] bg-[#fafaf8] focus:outline-none focus:ring-2 focus:ring-deep/20 focus:border-deep transition-colors resize-vertical"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !content.trim()}
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save draft"}
                </button>
                <button
                  onClick={handleCopyContent}
                  className="text-sm font-medium px-4 py-2 rounded-lg border border-[#e8e5df] text-[#1a1a18] hover:bg-[#f5f3ef] transition-colors"
                >
                  Copy content
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
