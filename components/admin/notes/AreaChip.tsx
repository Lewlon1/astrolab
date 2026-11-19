"use client";

import { AREA_LABELS, NOTE_AREAS, type NoteArea } from "@/types/notes";

export const AREA_COLORS: Record<NoteArea, string> = {
  clients: "bg-emerald-50 text-emerald-800 border-emerald-200",
  content: "bg-violet-50 text-violet-800 border-violet-200",
  todo: "bg-amber-50 text-amber-800 border-amber-200",
  money: "bg-sky-50 text-sky-800 border-sky-200",
  business: "bg-stone-100 text-stone-700 border-stone-200",
  personal: "bg-rose-50 text-rose-800 border-rose-200",
  unsorted: "bg-[#f5f3ef] text-[#6b6560] border-[#e8e5df]",
};

/**
 * A note's area as a chip. With `onChange` it is tappable: a native picker
 * (an invisible <select> over the chip) so the phone shows its own wheel/list.
 */
export default function AreaChip({
  area,
  onChange,
  disabled,
}: {
  area: NoteArea;
  onChange?: (area: NoteArea) => void;
  disabled?: boolean;
}) {
  const chip = `inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${AREA_COLORS[area]}`;

  if (!onChange) return <span className={chip}>{AREA_LABELS[area]}</span>;

  return (
    <label className={`relative ${chip} ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <span>{AREA_LABELS[area]}</span>
      <span aria-hidden className="text-[10px] opacity-60">&#9662;</span>
      <select
        aria-label="Change area"
        value={area}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value as NoteArea;
          if (next !== area) onChange(next);
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {NOTE_AREAS.map((a) => (
          <option key={a} value={a}>
            {AREA_LABELS[a]}
          </option>
        ))}
      </select>
    </label>
  );
}
