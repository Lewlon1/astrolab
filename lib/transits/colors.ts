// Visual mapping for transit type → colour. Used by:
//   - TransitCard (border/badge accents)
//   - CalendarView day cells (dots)
//   - DetailDrawer (header accent)
//
// Kept consistent with admin's neutral palette: dots use saturated tones,
// borders/backgrounds stay muted so cards remain readable on white.

import type { TransitType } from "./types";

export const transitTypeColors: Record<
  TransitType,
  { dot: string; badge: string; label: string }
> = {
  lunation: {
    dot: "bg-slate-500",
    badge: "bg-slate-50 text-slate-700 border-slate-200",
    label: "Lunation",
  },
  ingress: {
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Ingress",
  },
  retrograde: {
    dot: "bg-orange-500",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    label: "Retrograde",
  },
  aspect: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Aspect",
  },
};

export const intensityRing: Record<string, string> = {
  major: "ring-2 ring-deep/30",
  mid: "ring-1 ring-[#e8e5df]",
  minor: "",
};
