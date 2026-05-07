"use client";

import { PlayIcon, PauseIcon, StepBackIcon, StepForwardIcon, MarkInIcon, MarkOutIcon } from "./Icons";

export default function TransportControls({
  isPlaying,
  onPlayPause,
  onStep,
  timecode,
  variant = "program",
}: {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStep: (delta: number) => void;
  timecode: string;
  variant?: "source" | "program";
}) {
  return (
    <div
      className="flex items-center justify-between px-2 border-t"
      style={{
        height: 30,
        background: "var(--pp-panel)",
        borderColor: "var(--pp-border)",
      }}
    >
      <div
        className="font-mono px-1.5 py-0.5 rounded-sm"
        style={{
          background: "#000",
          color: variant === "program" ? "var(--pp-accent-orange)" : "var(--pp-accent-blue-bright)",
          fontSize: 11,
          letterSpacing: "0.05em",
        }}
      >
        {timecode}
      </div>

      <div className="flex items-center gap-0.5">
        <button className="pp-tool-btn" title="Mark In (I)">
          <MarkInIcon />
        </button>
        <button className="pp-tool-btn" title="Mark Out (O)">
          <MarkOutIcon />
        </button>
        <div
          className="w-px h-4 mx-1"
          style={{ background: "var(--pp-border-soft)" }}
        />
        <button
          className="pp-tool-btn"
          title="Step Back (Left)"
          onClick={() => onStep(-1)}
        >
          <StepBackIcon />
        </button>
        <button
          className="pp-tool-btn"
          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          onClick={onPlayPause}
          style={{
            background: isPlaying ? "var(--pp-active)" : undefined,
            color: isPlaying ? "var(--pp-accent-orange)" : undefined,
          }}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          className="pp-tool-btn"
          title="Step Forward (Right)"
          onClick={() => onStep(1)}
        >
          <StepForwardIcon />
        </button>
      </div>

      <div
        className="font-mono"
        style={{ color: "var(--pp-text-dim)", fontSize: 10 }}
      >
        {variant === "program" ? "Sequence 01" : "Source"}
      </div>
    </div>
  );
}
