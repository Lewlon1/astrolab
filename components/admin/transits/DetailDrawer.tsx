"use client";

import { useEffect } from "react";
import type { Transit } from "@/lib/transits/types";
import { transitTypeColors } from "@/lib/transits/colors";
import { formatLongDate } from "@/lib/transits/utils";

interface DetailDrawerProps {
  transit: Transit | null;
  onClose: () => void;
  onDraft: () => void;
  onHoroscope: () => void;
}

export default function DetailDrawer({
  transit,
  onClose,
  onDraft,
  onHoroscope,
}: DetailDrawerProps) {
  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!transit) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [transit, onClose]);

  if (!transit) return null;

  const colors = transitTypeColors[transit.type];

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label={transit.title}
        className="absolute top-0 right-0 h-full w-full sm:w-[28rem] bg-white shadow-xl border-l border-[#e8e5df] overflow-y-auto"
      >
        <div className="px-6 py-5 border-b border-[#e8e5df] flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${colors.badge}`}
              >
                {transit.subtype}
              </span>
              {transit.intensity === "major" && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-deep/10 text-deep">
                  Major
                </span>
              )}
            </div>
            <h2 className="font-heading text-xl text-[#1a1a18] flex items-center gap-2">
              <span>{transit.glyph}</span>
              <span>{transit.title}</span>
            </h2>
            <p className="text-xs text-[#6b6560] mt-1">
              {formatLongDate(transit.date)} · {transit.time} Barcelona · {transit.position}
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

        <div className="px-6 py-5 space-y-6">
          <section>
            <h3 className="text-xs font-medium text-[#6b6560] uppercase tracking-wider mb-2">
              Sky reading
            </h3>
            <p className="text-sm text-[#1a1a18] leading-relaxed">
              {transit.description}
            </p>
          </section>

          {transit.personalHits.length > 0 && (
            <section>
              <h3 className="text-xs font-medium text-[#6b6560] uppercase tracking-wider mb-2">
                Personal hits
              </h3>
              <div className="space-y-3">
                {transit.personalHits.map((hit, idx) => (
                  <div
                    key={idx}
                    className="border border-[#e8e5df] rounded-lg p-3 bg-[#fafaf8]"
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        ✦ {hit.aspect}
                      </span>
                      <span className="text-xs text-[#6b6560]">
                        natal {hit.natalPoint} · {hit.natalDegree}° {hit.natalSign} · orb {hit.orb}°
                      </span>
                    </div>
                    <p className="text-sm text-[#1a1a18] leading-relaxed">
                      {hit.reading}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-2 pt-2">
            <button
              onClick={onDraft}
              className="w-full text-sm font-medium px-4 py-2.5 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors"
            >
              Draft content for this transit
            </button>
            {transit.horoscopeable && (
              <button
                onClick={onHoroscope}
                className="w-full text-sm font-medium px-4 py-2.5 rounded-lg border border-deep text-deep hover:bg-deep/5 transition-colors"
              >
                Generate sign-by-sign read (24)
              </button>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
