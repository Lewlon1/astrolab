"use client";

import { useRef } from "react";

const SWATCHES = [
  // Astropsyche-themed palette
  "#0a1628", "#1d3a6a", "#2c5d8a", "#5a7fa8",
  "#d4a843", "#f4d77a", "#f17e2c", "#e54848",
  "#1a0a2e", "#4d2660", "#7a3da8", "#c285e3",
  "#06334d", "#2a8aa8", "#b8e2ec", "#ffffff",
  // Plus standard PS row
  "#000000", "#444444", "#808080", "#bdbdbd",
  "#ff0000", "#ffff00", "#00ff00", "#00ffff",
  "#0000ff", "#ff00ff", "#ff8800", "#88ff00",
];

export default function ColorPanel({
  fg,
  onSwatch,
}: {
  fg: string;
  onSwatch: (hex: string) => void;
}) {
  const fgInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col" style={{ background: "var(--ps-panel)" }}>
      {/* Tabs */}
      <div className="flex" style={{ borderBottom: "1px solid var(--ps-border)" }}>
        <span className="ps-tab is-active">Color</span>
        <span className="ps-tab">Swatches</span>
        <span className="ps-tab">Gradients</span>
        <span className="ps-tab">Patterns</span>
        <div className="flex-1" style={{ borderBottom: "1px solid var(--ps-border)" }} />
      </div>

      {/* Active color preview */}
      <div className="flex items-center gap-2 px-2 py-2">
        <button
          onClick={() => fgInputRef.current?.click()}
          className="rounded-sm"
          style={{
            width: 36,
            height: 36,
            background: fg,
            border: "1.5px solid var(--ps-text-dim)",
          }}
          title="Foreground"
        />
        <input
          ref={fgInputRef}
          type="color"
          value={normalizeHex(fg)}
          onChange={(e) => onSwatch(e.target.value)}
          className="absolute opacity-0 pointer-events-none"
        />
        <div className="flex-1">
          {/* Sliders */}
          {(["R", "G", "B"] as const).map((label, i) => {
            const rgb = hexToRgb(fg);
            const v = rgb[i];
            return (
              <div key={label} className="flex items-center gap-1.5">
                <span style={{ color: "var(--ps-text-dim)", width: 10 }}>{label}</span>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    background: `linear-gradient(to right, ${rgbAtChannel(rgb, i, 0)}, ${rgbAtChannel(rgb, i, 255)})`,
                    border: "1px solid var(--ps-border-soft)",
                    borderRadius: 1,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: `calc(${(v / 255) * 100}% - 3px)`,
                      top: -2,
                      width: 6,
                      height: 12,
                      background: "white",
                      border: "1px solid #333",
                      borderRadius: 1,
                    }}
                  />
                </div>
                <span
                  className="font-mono"
                  style={{
                    color: "var(--ps-text)",
                    width: 32,
                    textAlign: "right",
                  }}
                >
                  {v}
                </span>
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 mt-1">
            <span style={{ color: "var(--ps-text-dim)", width: 10 }}>#</span>
            <input
              className="ps-input font-mono uppercase"
              value={fg.replace("#", "")}
              onChange={(e) => {
                const v = "#" + e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
                if (v.length === 7) onSwatch(v);
              }}
              style={{ flex: 1, fontSize: 11 }}
            />
          </div>
        </div>
      </div>

      {/* Swatches */}
      <div
        className="px-2 pb-2 grid"
        style={{
          gridTemplateColumns: "repeat(8, 1fr)",
          gap: 2,
          borderTop: "1px solid var(--ps-border-soft)",
          paddingTop: 6,
        }}
      >
        {SWATCHES.map((c) => (
          <button
            key={c}
            onClick={() => onSwatch(c)}
            className="aspect-square rounded-sm"
            style={{
              background: c,
              border: "1px solid rgba(0,0,0,0.4)",
            }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f0-9]{6})$/i.exec(hex);
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rgbAtChannel(
  rgb: [number, number, number],
  channel: number,
  value: number
): string {
  const c = [...rgb] as [number, number, number];
  c[channel] = value;
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function normalizeHex(hex: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#000000";
}
