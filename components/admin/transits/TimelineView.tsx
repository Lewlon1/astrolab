"use client";

import type { Transit } from "@/lib/transits/types";
import { groupByDay, formatLongDate } from "@/lib/transits/utils";
import TransitCard from "./TransitCard";

interface TimelineViewProps {
  transits: Transit[];
  onSelect: (t: Transit) => void;
}

export default function TimelineView({ transits, onSelect }: TimelineViewProps) {
  if (transits.length === 0) {
    return (
      <div className="bg-white border border-[#e8e5df] rounded-xl p-8 text-center">
        <p className="text-[#6b6560]">
          No transits match your current filters. Try widening the month or type filter.
        </p>
      </div>
    );
  }

  const groups = groupByDay(transits);
  const dates = Array.from(groups.keys());

  return (
    <div className="space-y-6">
      {dates.map((date) => {
        const dayTransits = groups.get(date)!;
        return (
          <div key={date}>
            <div className="flex items-baseline gap-3 mb-3">
              <h2 className="font-heading text-lg text-[#1a1a18]">
                {formatLongDate(date)}
              </h2>
              <span className="text-xs text-[#b8b0a4]">
                {dayTransits.length} {dayTransits.length === 1 ? "transit" : "transits"}
              </span>
            </div>
            <div className="space-y-2">
              {dayTransits.map((t) => (
                <TransitCard key={t.id} transit={t} onClick={() => onSelect(t)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
