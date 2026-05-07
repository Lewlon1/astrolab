"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaItem } from "./types";
import TransportControls from "./TransportControls";
import { framesToTimecode } from "./utils";

export default function SourceMonitor({ media }: { media: MediaItem | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentFrame(0);
    if (videoRef.current && media?.src) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  }, [media?.id, media?.src]);

  // Track time as the video plays
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setCurrentFrame(Math.floor((v.currentTime || 0) * 30));
    };
    const onEnded = () => setIsPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
    };
  }, [media?.id]);

  const handlePlayPause = () => {
    const v = videoRef.current;
    if (!v || !media?.src) return;
    if (isPlaying) {
      v.pause();
    } else {
      v.play().catch(() => {});
    }
    setIsPlaying((p) => !p);
  };

  const handleStep = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, v.currentTime + delta / 30);
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "var(--pp-panel)",
        borderRight: "1px solid var(--pp-border)",
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
        <span className="pp-panel-tab is-active">Source: {media?.name ?? "(none)"}</span>
        <span className="pp-panel-tab">Effect Controls</span>
        <span className="pp-panel-tab">Audio Clip Mixer</span>
        <span className="pp-panel-tab">Metadata</span>
      </div>

      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        style={{ background: "#000" }}
      >
        {media?.src ? (
          <video
            ref={videoRef}
            src={media.src}
            className="max-h-full max-w-full"
            controls={false}
            playsInline
          />
        ) : media ? (
          <div
            className="w-full h-full flex items-center justify-center relative"
            style={{ background: media.thumb }}
          >
            <div
              className="text-center px-4"
              style={{ color: "rgba(255,255,255,0.85)", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
            >
              <div style={{ fontSize: 14, fontWeight: 600 }}>{media.name}</div>
              <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>
                Preview unavailable — Import a file to see real playback
              </div>
            </div>
            {/* Letterbox mask for 9:16 aspect */}
            {media.aspect === "9:16" && (
              <>
                <div className="absolute top-0 bottom-0 left-0 w-1/4 bg-black/60" />
                <div className="absolute top-0 bottom-0 right-0 w-1/4 bg-black/60" />
              </>
            )}
          </div>
        ) : (
          <div style={{ color: "var(--pp-text-dim)", fontSize: 11 }}>
            Double-click a clip in the Project panel to load it here
          </div>
        )}

        {/* Safe-area markers */}
        {media && (
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
        )}
      </div>

      <TransportControls
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onStep={handleStep}
        timecode={framesToTimecode(currentFrame)}
        variant="source"
      />
    </div>
  );
}
