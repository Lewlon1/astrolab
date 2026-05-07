"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, SearchIcon } from "./Icons";

interface Category {
  name: string;
  effects: string[];
}

const TREE: { group: string; categories: Category[] }[] = [
  {
    group: "Video Effects",
    categories: [
      {
        name: "Color Correction",
        effects: ["Lumetri Color", "Color Balance (HLS)", "Brightness & Contrast", "Tint"],
      },
      { name: "Blur & Sharpen", effects: ["Gaussian Blur", "Camera Blur", "Sharpen"] },
      { name: "Distort", effects: ["Lens Distortion", "Mirror", "Wave Warp"] },
      { name: "Stylize", effects: ["Glow", "Mosaic", "Posterize", "Strobe Light"] },
    ],
  },
  {
    group: "Video Transitions",
    categories: [
      { name: "Dissolve", effects: ["Cross Dissolve", "Dip to Black", "Film Dissolve"] },
      { name: "Slide", effects: ["Push", "Slide", "Split"] },
      { name: "Wipe", effects: ["Band Wipe", "Barn Doors", "Iris Box"] },
    ],
  },
  {
    group: "Audio Effects",
    categories: [
      { name: "Amplitude", effects: ["Channel Volume", "Dynamics", "Hard Limiter"] },
      { name: "Reverb", effects: ["Studio Reverb", "Convolution Reverb"] },
      { name: "EQ", effects: ["Parametric EQ", "Graphic EQ"] },
    ],
  },
  {
    group: "Audio Transitions",
    categories: [
      { name: "Crossfade", effects: ["Constant Gain", "Constant Power", "Exponential Fade"] },
    ],
  },
];

export default function EffectsPanel({ onApply }: { onApply: (name: string) => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    "Video Effects": true,
    "Color Correction": true,
  });
  const [query, setQuery] = useState("");

  const toggle = (key: string) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "var(--pp-panel)",
        borderLeft: "1px solid var(--pp-border)",
      }}
    >
      <div
        className="flex items-center"
        style={{
          height: 22,
          background: "var(--pp-toolbar)",
          borderBottom: "1px solid var(--pp-border)",
        }}
      >
        <span className="pp-panel-tab is-active">Effects</span>
        <span className="pp-panel-tab">Markers</span>
        <span className="pp-panel-tab">History</span>
      </div>

      <div
        className="px-2 py-1.5 border-b"
        style={{ borderColor: "var(--pp-border)" }}
      >
        <div
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm"
          style={{
            background: "var(--pp-bg)",
            border: "1px solid var(--pp-border-soft)",
          }}
        >
          <span style={{ color: "var(--pp-text-dim)" }}>
            <SearchIcon />
          </span>
          <input
            placeholder="Search effects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent flex-1 outline-none"
            style={{ color: "var(--pp-text)", fontSize: 11 }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ fontSize: 11 }}>
        {TREE.map((g) => {
          const groupOpen = open[g.group] ?? false;
          return (
            <div key={g.group}>
              <button
                onClick={() => toggle(g.group)}
                className="w-full flex items-center gap-1 px-1.5 py-1 hover:bg-[var(--pp-panel-hover)]"
                style={{ color: "var(--pp-text-bright)", fontWeight: 500 }}
              >
                <span style={{ width: 14 }}>
                  {groupOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{
                    background:
                      g.group.startsWith("Video")
                        ? "var(--pp-clip-video)"
                        : "var(--pp-clip-audio)",
                  }}
                />
                {g.group}
              </button>
              {groupOpen &&
                g.categories.map((cat) => {
                  const catKey = `${g.group}>${cat.name}`;
                  const catOpen = open[catKey] ?? false;
                  return (
                    <div key={catKey}>
                      <button
                        onClick={() => toggle(catKey)}
                        className="w-full flex items-center gap-1 pl-5 pr-1.5 py-0.5 hover:bg-[var(--pp-panel-hover)]"
                        style={{ color: "var(--pp-text)" }}
                      >
                        <span style={{ width: 14 }}>
                          {catOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
                        </span>
                        {cat.name}
                      </button>
                      {catOpen &&
                        cat.effects
                          .filter((e) =>
                            query
                              ? e.toLowerCase().includes(query.toLowerCase())
                              : true
                          )
                          .map((e) => (
                            <button
                              key={e}
                              onClick={() => onApply(e)}
                              className="w-full text-left flex items-center gap-1 pl-12 pr-1.5 py-0.5 hover:bg-[var(--pp-panel-hover)]"
                              style={{ color: "var(--pp-text-dim)" }}
                            >
                              <span
                                className="w-1 h-1 rounded-full"
                                style={{ background: "var(--pp-accent-blue)" }}
                              />
                              {e}
                            </button>
                          ))}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Audio meter section at bottom */}
      <div
        className="px-2 py-2 border-t"
        style={{
          background: "var(--pp-bg)",
          borderColor: "var(--pp-border)",
        }}
      >
        <div
          className="mb-1 flex items-center justify-between"
          style={{ color: "var(--pp-text-dim)", fontSize: 10 }}
        >
          <span>Audio Meters</span>
          <span>dB</span>
        </div>
        <div className="flex gap-1 items-end h-16">
          {Array.from({ length: 2 }).map((_, ch) => (
            <div
              key={ch}
              className="flex-1 relative"
              style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}
            >
              <div
                className="pp-meter-bar absolute bottom-0 left-0 right-0"
                style={{
                  height: "100%",
                  background:
                    "linear-gradient(to top, #4ade80 0%, #4ade80 60%, #facc15 80%, #ef4444 100%)",
                  animationDelay: `${ch * 80}ms`,
                }}
              />
            </div>
          ))}
        </div>
        <div
          className="flex items-center justify-between mt-1"
          style={{ color: "var(--pp-text-dim)", fontSize: 9 }}
        >
          <span>L</span>
          <span>R</span>
        </div>
      </div>
    </div>
  );
}
