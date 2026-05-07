"use client";

import { useEffect, useRef, useState } from "react";
import type { Clip, MediaItem, Tool } from "./types";

const VIDEO_HEIGHT = 40;
const AUDIO_HEIGHT = 36;

interface DragState {
  mode: "move" | "trimL" | "trimR";
  startX: number;
  origStart: number;
  origIn: number;
  origOut: number;
}

export default function TimelineClip({
  clip,
  media,
  pxPerFrame,
  selected,
  selectedTool,
  onSelect,
  onMove,
  onTrim,
  onSplit,
}: {
  clip: Clip;
  media: MediaItem;
  pxPerFrame: number;
  selected: boolean;
  selectedTool: Tool;
  onSelect: (id: string) => void;
  onMove: (id: string, newStart: number) => void;
  onTrim: (id: string, side: "L" | "R", deltaFrames: number) => void;
  onSplit: (id: string, atFrame: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const lengthFrames = clip.outFrames - clip.inFrames;
  const widthPx = Math.max(2, lengthFrames * pxPerFrame);
  const leftPx = clip.startFrames * pxPerFrame;
  const isVideo = media.type === "video";
  const height = isVideo ? VIDEO_HEIGHT : AUDIO_HEIGHT;

  // Mouse drag for move + trim
  useEffect(() => {
    if (!drag) return;
    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - drag.startX;
      const dFrames = Math.round(dx / pxPerFrame);
      if (drag.mode === "move") {
        onMove(clip.id, Math.max(0, drag.origStart + dFrames));
      } else if (drag.mode === "trimL") {
        onTrim(clip.id, "L", dFrames);
      } else if (drag.mode === "trimR") {
        onTrim(clip.id, "R", dFrames);
      }
    };
    const onMouseUp = () => setDrag(null);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [drag, pxPerFrame, clip.id, onMove, onTrim]);

  const handleMouseDown = (e: React.MouseEvent, mode: "move" | "trimL" | "trimR") => {
    if (selectedTool === "razor") {
      // Razor: split at click position
      e.preventDefault();
      e.stopPropagation();
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const splitAtFrame = Math.round(clip.startFrames + x / pxPerFrame);
      onSplit(clip.id, splitAtFrame);
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    onSelect(clip.id);
    setDrag({
      mode,
      startX: e.clientX,
      origStart: clip.startFrames,
      origIn: clip.inFrames,
      origOut: clip.outFrames,
    });
  };

  // Build a fake waveform / thumbnail strip
  const decoEls = (() => {
    if (isVideo) {
      // Pseudo-thumbnail strip via repeating gradient
      return (
        <div
          className="absolute inset-x-1 top-3 bottom-1 rounded-sm overflow-hidden"
          style={{
            background: media.thumb,
            opacity: 0.85,
            backgroundSize: "60px 100%",
            backgroundRepeat: "repeat-x",
          }}
        />
      );
    }
    // Audio waveform — values rounded to 1 decimal to avoid SSR hydration drift
    const bars = Math.max(8, Math.floor(widthPx / 3));
    const round1 = (n: number) => Math.round(n * 10) / 10;
    const waveform: number[] = [];
    for (let i = 0; i < bars; i++) {
      const t = i / bars;
      const env = Math.sin(t * Math.PI) * 0.6 + 0.3;
      const noise = Math.abs(
        Math.sin(i * 12.9898 + clip.id.length * 78.233) * 43758.5453
      );
      const v = Math.min(1, env * (0.5 + (noise % 1) * 0.6));
      waveform.push(round1(v));
    }
    return (
      <svg
        className="absolute inset-x-1 top-3 bottom-1 w-[calc(100%-8px)]"
        preserveAspectRatio="none"
        viewBox={`0 0 ${bars} 20`}
        style={{ height: height - 16 }}
      >
        {waveform.map((v, i) => (
          <line
            key={i}
            x1={i + 0.5}
            y1={round1(10 - v * 9)}
            x2={i + 0.5}
            y2={round1(10 + v * 9)}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={0.6}
          />
        ))}
      </svg>
    );
  })();

  return (
    <div
      ref={ref}
      onMouseDown={(e) => handleMouseDown(e, "move")}
      className="absolute select-none"
      style={{
        left: leftPx,
        top: 2,
        width: widthPx,
        height: height - 4,
        background: media.clipColor,
        border: selected
          ? "1.5px solid var(--pp-accent-orange)"
          : "1px solid rgba(0,0,0,0.45)",
        boxShadow: selected ? "0 0 0 1px rgba(241,126,44,0.4)" : undefined,
        cursor: selectedTool === "razor" ? "crosshair" : "grab",
        overflow: "hidden",
        borderRadius: 2,
      }}
    >
      {/* Clip name */}
      <div
        className="absolute top-0 left-0 right-0 px-1 truncate"
        style={{
          color: "white",
          fontSize: 9,
          lineHeight: "12px",
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)",
          textShadow: "0 1px 2px rgba(0,0,0,0.6)",
          fontWeight: 500,
        }}
      >
        {media.name}
      </div>

      {decoEls}

      {/* Trim handles (only when selection tool active) */}
      {selectedTool === "select" && (
        <>
          <div
            onMouseDown={(e) => handleMouseDown(e, "trimL")}
            className="absolute top-0 bottom-0 left-0"
            style={{
              width: 4,
              cursor: "ew-resize",
              background: selected ? "rgba(255,255,255,0.4)" : "transparent",
            }}
          />
          <div
            onMouseDown={(e) => handleMouseDown(e, "trimR")}
            className="absolute top-0 bottom-0 right-0"
            style={{
              width: 4,
              cursor: "ew-resize",
              background: selected ? "rgba(255,255,255,0.4)" : "transparent",
            }}
          />
        </>
      )}
    </div>
  );
}
