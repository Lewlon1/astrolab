"use client";

import type { Transit } from "@/lib/transits/types";
import { transitTypeColors } from "@/lib/transits/colors";
import { formatShortDate } from "@/lib/transits/utils";

interface TransitCardProps {
  transit: Transit;
  onClick: () => void;
  compact?: boolean;
}

export default function TransitCard({
  transit,
  onClick,
  compact = false,
}: TransitCardProps) {
  const colors = transitTypeColors[transit.type];
  const hasPersonalHits = transit.personalHits.length > 0;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left bg-white border border-[#e8e5df] rounded-lg px-3 py-2 hover:bg-[#f5f3ef] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base shrink-0">{transit.glyph}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-[#1a1a18] truncate">
                {transit.title}
              </span>
              {hasPersonalHits && (
                <span className="text-[10px] font-medium text-deep">✦</span>
              )}
            </div>
            <div className="text-[11px] text-[#6b6560]">
              {transit.time} · {transit.position}
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-[#e8e5df] rounded-xl p-4 hover:bg-[#f5f3ef] transition-colors"
    >
      <div className="flex items-start gap-4">
        <span className="text-2xl shrink-0">{transit.glyph}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
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
            {hasPersonalHits && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                ✦ Personal hit
              </span>
            )}
          </div>
          <h3 className="font-heading text-base text-[#1a1a18]">
            {transit.title}
          </h3>
          <div className="text-xs text-[#6b6560] mt-0.5">
            {formatShortDate(transit.date)} · {transit.time} · {transit.position}
          </div>
        </div>
      </div>
    </button>
  );
}
