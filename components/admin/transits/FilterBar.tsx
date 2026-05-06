"use client";

import type { FilterType } from "@/lib/transits/types";

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "lunations", label: "Lunations" },
  { value: "ingresses", label: "Ingresses" },
  { value: "retrogrades", label: "Retrogrades" },
  { value: "aspects", label: "Aspects" },
];

interface FilterBarProps {
  selected: FilterType;
  onChange: (f: FilterType) => void;
}

export default function FilterBar({ selected, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
            selected === f.value
              ? "bg-[#1a1a18] text-white border-[#1a1a18]"
              : "bg-white text-[#1a1a18] border-[#e8e5df] hover:bg-[#f5f3ef]"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
