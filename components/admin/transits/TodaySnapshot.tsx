"use client";

import type { Transit } from "@/lib/transits/types";
import { transitTypeColors } from "@/lib/transits/colors";

interface TodaySnapshotProps {
  transits: Transit[];
  onSelect: (t: Transit) => void;
}

export default function TodaySnapshot({ transits, onSelect }: TodaySnapshotProps) {
  if (transits.length === 0) {
    return (
      <div className="bg-white border border-[#e8e5df] rounded-xl px-5 py-4">
        <div className="text-xs font-medium text-[#6b6560] uppercase tracking-wider mb-1">
          Today
        </div>
        <p className="text-sm text-[#1a1a18]">
          No exact transits today — the sky is moving quietly.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e8e5df] rounded-xl px-5 py-4">
      <div className="text-xs font-medium text-[#6b6560] uppercase tracking-wider mb-2">
        Today
      </div>
      <div className="flex flex-wrap gap-2">
        {transits.map((t) => {
          const colors = transitTypeColors[t.type];
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors hover:bg-[#f5f3ef] ${colors.badge}`}
            >
              <span className="text-sm">{t.glyph}</span>
              <span>{t.title}</span>
              <span className="opacity-60">· {t.time}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
