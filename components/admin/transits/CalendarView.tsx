"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Transit } from "@/lib/transits/types";
import { transitTypeColors } from "@/lib/transits/colors";
import {
  MONTH_NAMES,
  WEEKDAY_LABELS_MON_FIRST,
  buildMonthGrid,
  dateToIso,
  groupByDay,
  isSameDay,
} from "@/lib/transits/utils";
import TransitCard from "./TransitCard";

interface CalendarViewProps {
  transits: Transit[];
  // Calendar's own month nav (independent of MonthBar's filter chips):
  // these control which month the grid renders.
  year: number;
  month: number; // 0-11
  onMonthChange: (year: number, month: number) => void;
  onSelect: (t: Transit) => void;
}

const MOBILE_BREAKPOINT_PX = 640;

export default function CalendarView({
  transits,
  year,
  month,
  onMonthChange,
  onSelect,
}: CalendarViewProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [activeIso, setActiveIso] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT_PX);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close popover on outside click.
  useEffect(() => {
    if (!activeIso) return;
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActiveIso(null);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [activeIso]);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const groups = useMemo(() => groupByDay(transits), [transits]);
  const today = new Date();

  if (isMobile) {
    return (
      <div className="bg-white border border-[#e8e5df] rounded-xl p-6 text-center">
        <p className="text-sm text-[#1a1a18] mb-2 font-medium">
          Calendar grid is desktop-only
        </p>
        <p className="text-xs text-[#6b6560] leading-relaxed">
          The month grid needs more horizontal room than your screen has.
          Switch to <span className="font-medium">Timeline</span> for the agenda view.
        </p>
      </div>
    );
  }

  const prevMonth = () => {
    if (month === 0) onMonthChange(year - 1, 11);
    else onMonthChange(year, month - 1);
  };
  const nextMonth = () => {
    if (month === 11) onMonthChange(year + 1, 0);
    else onMonthChange(year, month + 1);
  };

  return (
    <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e5df]">
        <h2 className="font-heading text-lg text-[#1a1a18]">
          {MONTH_NAMES[month]} {year}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="text-[#6b6560] hover:text-[#1a1a18] hover:bg-[#f5f3ef] p-1.5 rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="10 12 6 8 10 4" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="text-[#6b6560] hover:text-[#1a1a18] hover:bg-[#f5f3ef] p-1.5 rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 4 10 8 6 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 border-b border-[#e8e5df]">
        {WEEKDAY_LABELS_MON_FIRST.map((label) => (
          <div
            key={label}
            className="text-xs font-medium text-[#6b6560] uppercase tracking-wider px-3 py-2 text-center"
          >
            {label}
          </div>
        ))}
      </div>

      {/* 6×7 grid */}
      <div className="grid grid-cols-7 grid-rows-6 relative">
        {grid.map((cell, idx) => {
          const iso = dateToIso(cell.date);
          const cellTransits = groups.get(iso) ?? [];
          const isToday = isSameDay(cell.date, today);
          const isActive = activeIso === iso;
          const hasTransits = cellTransits.length > 0;

          return (
            <div
              key={idx}
              className={`relative min-h-[5.25rem] border-b border-r border-[#e8e5df] last:border-r-0 ${
                cell.inMonth ? "bg-white" : "bg-[#fafaf8]"
              }`}
            >
              <button
                onClick={() => hasTransits && setActiveIso(isActive ? null : iso)}
                disabled={!hasTransits}
                className={`w-full h-full text-left px-2 py-1.5 transition-colors ${
                  hasTransits ? "hover:bg-[#f5f3ef] cursor-pointer" : "cursor-default"
                } ${isToday ? "ring-1 ring-deep ring-inset" : ""}`}
              >
                <div
                  className={`text-xs font-medium mb-1 ${
                    cell.inMonth ? "text-[#1a1a18]" : "text-[#b8b0a4]"
                  } ${isToday ? "text-deep" : ""}`}
                >
                  {cell.date.getDate()}
                </div>
                {hasTransits && (
                  <div className="flex flex-wrap gap-1">
                    {cellTransits.slice(0, 3).map((t) => {
                      const colors = transitTypeColors[t.type];
                      return (
                        <span
                          key={t.id}
                          className={`block rounded-full ${colors.dot} ${
                            t.intensity === "major" ? "h-2.5 w-2.5" : "h-1.5 w-1.5"
                          }`}
                          title={t.title}
                        />
                      );
                    })}
                    {cellTransits.length > 3 && (
                      <span className="text-[10px] text-[#6b6560] font-medium leading-none">
                        +{cellTransits.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>

              {isActive && (
                <div
                  ref={popoverRef}
                  className="absolute z-20 top-full left-0 right-0 mt-1 max-w-[18rem] bg-white border border-[#e8e5df] rounded-xl shadow-lg p-2 space-y-1.5"
                >
                  {cellTransits.map((t) => (
                    <TransitCard
                      key={t.id}
                      transit={t}
                      compact
                      onClick={() => {
                        setActiveIso(null);
                        onSelect(t);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-t border-[#e8e5df] bg-[#fafaf8]">
        {(["lunation", "ingress", "retrograde", "aspect"] as const).map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <span className={`block h-1.5 w-1.5 rounded-full ${transitTypeColors[t].dot}`} />
            <span className="text-xs text-[#6b6560]">{transitTypeColors[t].label}</span>
          </div>
        ))}
        <span className="text-[10px] text-[#b8b0a4] ml-auto">
          Larger dot = major intensity
        </span>
      </div>
    </div>
  );
}
