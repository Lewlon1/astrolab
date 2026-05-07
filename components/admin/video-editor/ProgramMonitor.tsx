"use client";

import { useEffect, useRef } from "react";
import type { Clip, MediaItem } from "./types";
import TransportControls from "./TransportControls";
import { framesToTimecode } from "./utils";

export default function ProgramMonitor({
  playheadFrames,
  isPlaying,
  onPlayPause,
  onStep,
  activeClip,
  activeMedia,
  totalDurationFrames,
}: {
  playheadFrames: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStep: (delta: number) => void;
  activeClip: Clip | null;
  activeMedia: MediaItem | null;
  totalDurationFrames: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync video <-> playhead when we have a real source
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !activeMedia?.src || !activeClip) return;
    const targetSeconds =
      (activeClip.inFrames + (playheadFrames - activeClip.startFrames)) / 30;
    if (Math.abs(v.currentTime - targetSeconds) > 0.1) {
      v.currentTime = Math.max(0, targetSeconds);
    }
  }, [playheadFrames, activeClip?.id, activeMedia?.src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !activeMedia?.src) return;
    if (isPlaying) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [isPlaying, activeMedia?.src]);

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "var(--pp-panel)",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          height: 22,
          background: "var(--pp-toolbar)",
          borderBottom: "1px solid var(--pp-border)",
        }}
      >
        <div className="flex items-center">
          <span className="pp-panel-tab is-active">Program: Sequence 01</span>
          <span className="pp-panel-tab">Reference Monitor</span>
        </div>
        <div
          className="px-2"
          style={{ color: "var(--pp-text-dim)", fontSize: 10 }}
        >
          1920×1080 · 30fps
        </div>
      </div>

      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        style={{ background: "#000" }}
      >
        {activeMedia?.src ? (
          <video
            ref={videoRef}
            src={activeMedia.src}
            className="max-h-full max-w-full"
            playsInline
            muted
          />
        ) : activeMedia ? (
          <div
            className="w-full h-full flex items-center justify-center relative"
            style={{ background: activeMedia.thumb }}
          >
            <div
              className="text-center"
              style={{
                color: "rgba(255,255,255,0.85)",
                textShadow: "0 1px 6px rgba(0,0,0,0.7)",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {activeMedia.name}
              </div>
              <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>
                Sequence playback · {framesToTimecode(playheadFrames)}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="text-center"
            style={{ color: "var(--pp-text-dim)", fontSize: 11 }}
          >
            <div className="mb-1">No clip under playhead</div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>
              Drag a clip from the Project panel to the Timeline
            </div>
          </div>
        )}

        {/* Safe-area markers */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: 12,
            left: 12,
            right: 12,
            bottom: 12,
            border: "1px dashed rgba(255,255,255,0.15)",
          }}
        />

        {/* Playing indicator */}
        {isPlaying && (
          <div
            className="absolute top-2 left-2 px-1.5 py-0.5 rounded-sm flex items-center gap-1"
            style={{ background: "rgba(0,0,0,0.65)" }}
          >
            <span
              className="block w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--pp-accent-red)" }}
            />
            <span style={{ color: "white", fontSize: 9, letterSpacing: "0.1em" }}>
              REC
            </span>
          </div>
        )}
      </div>

      <TransportControls
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        onStep={onStep}
        timecode={framesToTimecode(playheadFrames)}
        variant="program"
      />
    </div>
  );
}
