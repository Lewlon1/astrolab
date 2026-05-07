"use client";

import type { Tool } from "./types";
import {
  SelectIcon,
  TrackSelectIcon,
  RippleIcon,
  RollingIcon,
  RateIcon,
  RazorIcon,
  SlipIcon,
  SlideIcon,
  HandIcon,
  ZoomIcon,
  PenIcon,
  TypeIcon,
} from "./Icons";

const TOOLS: { id: Tool; label: string; key?: string; icon: () => JSX.Element }[] = [
  { id: "select", label: "Selection Tool", key: "V", icon: SelectIcon },
  { id: "trackSelect", label: "Track Select Forward", key: "A", icon: TrackSelectIcon },
  { id: "ripple", label: "Ripple Edit", key: "B", icon: RippleIcon },
  { id: "rolling", label: "Rolling Edit", key: "N", icon: RollingIcon },
  { id: "rate", label: "Rate Stretch", key: "R", icon: RateIcon },
  { id: "razor", label: "Razor", key: "C", icon: RazorIcon },
  { id: "slip", label: "Slip", key: "Y", icon: SlipIcon },
  { id: "slide", label: "Slide", key: "U", icon: SlideIcon },
  { id: "pen", label: "Pen", key: "P", icon: PenIcon },
  { id: "hand", label: "Hand", key: "H", icon: HandIcon },
  { id: "zoom", label: "Zoom", key: "Z", icon: ZoomIcon },
  { id: "type", label: "Type", key: "T", icon: TypeIcon },
];

export default function Toolbar({
  selectedTool,
  onSelectTool,
}: {
  selectedTool: Tool;
  onSelectTool: (t: Tool) => void;
}) {
  return (
    <div
      className="flex flex-col items-center py-1 gap-0.5"
      style={{
        width: 32,
        background: "var(--pp-toolbar)",
        borderRight: "1px solid var(--pp-border)",
      }}
    >
      {TOOLS.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            title={`${t.label}${t.key ? ` (${t.key})` : ""}`}
            className={`pp-tool-btn ${selectedTool === t.id ? "is-active" : ""}`}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
