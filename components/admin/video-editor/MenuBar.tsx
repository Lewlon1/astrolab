"use client";

import { ExportIcon } from "./Icons";

const MENUS = [
  "File",
  "Edit",
  "Clip",
  "Sequence",
  "Markers",
  "Graphics",
  "View",
  "Window",
  "Help",
];

export default function MenuBar({ onExport }: { onExport: () => void }) {
  return (
    <div
      className="flex items-center justify-between border-b"
      style={{
        height: 28,
        background: "var(--pp-toolbar)",
        borderColor: "var(--pp-border)",
      }}
    >
      <div className="flex items-center h-full">
        {/* Workspace label */}
        <div
          className="flex items-center gap-1.5 px-3 h-full border-r"
          style={{ borderColor: "var(--pp-border)" }}
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              background:
                "linear-gradient(135deg, #5a7fa8 0%, #7aa3d4 100%)",
            }}
          />
          <span style={{ color: "var(--pp-text-bright)", fontWeight: 600 }}>
            Astropsyche.prproj
          </span>
        </div>
        {MENUS.map((m) => (
          <button
            key={m}
            className="h-full px-2.5 hover:bg-[var(--pp-panel-hover)] transition-colors"
            style={{ color: "var(--pp-text)" }}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 pr-3">
        <span
          className="px-2 py-0.5 rounded-sm"
          style={{
            background: "var(--pp-panel)",
            color: "var(--pp-text-dim)",
            fontSize: 10,
          }}
        >
          Editing
        </span>
        <span
          className="px-2 py-0.5"
          style={{ color: "var(--pp-text-dim)", fontSize: 10 }}
        >
          Color
        </span>
        <span
          className="px-2 py-0.5"
          style={{ color: "var(--pp-text-dim)", fontSize: 10 }}
        >
          Audio
        </span>
        <span
          className="px-2 py-0.5"
          style={{ color: "var(--pp-text-dim)", fontSize: 10 }}
        >
          Effects
        </span>
        <button
          onClick={onExport}
          className="ml-3 flex items-center gap-1.5 px-3 py-1 rounded-sm transition-colors"
          style={{
            background: "var(--pp-accent-blue)",
            color: "white",
            fontWeight: 500,
          }}
        >
          <ExportIcon />
          Export
        </button>
      </div>
    </div>
  );
}
