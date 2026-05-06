"use client";

import { MONTH_NAMES_SHORT } from "@/lib/transits/utils";
import AdminToggle from "@/components/admin/ui/AdminToggle";

interface MonthBarProps {
  availableMonths: number[];
  selectedMonth: number | null; // null = "All"
  onSelectMonth: (m: number | null) => void;
  hidePast: boolean;
  onHidePastChange: (b: boolean) => void;
}

export default function MonthBar({
  availableMonths,
  selectedMonth,
  onSelectMonth,
  hidePast,
  onHidePastChange,
}: MonthBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onSelectMonth(null)}
        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
          selectedMonth === null
            ? "bg-deep text-white border-deep"
            : "bg-white text-[#1a1a18] border-[#e8e5df] hover:bg-[#f5f3ef]"
        }`}
      >
        All
      </button>
      {availableMonths.map((m) => (
        <button
          key={m}
          onClick={() => onSelectMonth(m)}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
            selectedMonth === m
              ? "bg-deep text-white border-deep"
              : "bg-white text-[#1a1a18] border-[#e8e5df] hover:bg-[#f5f3ef]"
          }`}
        >
          {MONTH_NAMES_SHORT[m]}
        </button>
      ))}
      <div className="ml-auto">
        <AdminToggle
          label="Hide past"
          checked={hidePast}
          onChange={onHidePastChange}
          size="small"
        />
      </div>
    </div>
  );
}
