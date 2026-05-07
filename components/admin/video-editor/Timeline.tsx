"use client";

import { useMemo, useRef } from "react";
import type { Clip, MediaItem, Track, Tool } from "./types";
import { framesToTimecode } from "./utils";
import TimelineClip from "./TimelineClip";
import { SpeakerIcon, LockIcon } from "./Icons";

const RULER_HEIGHT = 24;
const TRACK_HEADER_WIDTH = 110;
const VIDEO_TRACK_HEIGHT = 40;
const AUDIO_TRACK_HEIGHT = 36;
const FPS = 30;

function trackHeight(t: Track) {
  return t.type === "video" ? VIDEO_TRACK_HEIGHT : AUDIO_TRACK_HEIGHT;
}

export default function Timeline({
  tracks,
  clips,
  mediaById,
  playheadFrames,
  pxPerFrame,
  zoom,
  selectedClipId,
  selectedTool,
  onSeek,
  onSelectClip,
  onMoveClip,
  onTrimClip,
  onSplitClip,
  onDropMedia,
  onToggleTrackProp,
  onZoomChange,
}: {
  tracks: Track[];
  clips: Clip[];
  mediaById: Map<string, MediaItem>;
  playheadFrames: number;
  pxPerFrame: number;
  zoom: number;
  selectedClipId: string | null;
  selectedTool: Tool;
  onSeek: (frame: number) => void;
  onSelectClip: (id: string | null) => void;
  onMoveClip: (id: string, newStart: number) => void;
  onTrimClip: (id: string, side: "L" | "R", deltaFrames: number) => void;
  onSplitClip: (id: string, atFrame: number) => void;
  onDropMedia: (mediaId: string, trackId: string, atFrame: number) => void;
  onToggleTrackProp: (
    trackId: string,
    prop: "muted" | "solo" | "locked"
  ) => void;
  onZoomChange: (z: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Total content width from longest needed extent
  const lastEnd = useMemo(() => {
    let max = 60 * FPS; // at least 60s of timeline
    for (const c of clips) {
      const end = c.startFrames + (c.outFrames - c.inFrames);
      if (end > max) max = end;
    }
    return max + 30 * FPS; // 30s of padding at the end
  }, [clips]);

  const contentWidth = lastEnd * pxPerFrame;

  // Tick spacing — adapt label cadence to zoom
  const ticks = useMemo(() => {
    // Show major label every N seconds (chosen so labels never collide)
    const minLabelSpacingPx = 70;
    const pxPerSecond = pxPerFrame * FPS;
    const secondsPerLabel = Math.max(
      1,
      Math.ceil(minLabelSpacingPx / Math.max(1, pxPerSecond))
    );
    // Round to a "nice" number
    const niceSteps = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
    const step = niceSteps.find((s) => s >= secondsPerLabel) ?? secondsPerLabel;

    const labels: { atFrame: number; text: string }[] = [];
    const minor: number[] = [];
    const totalSeconds = Math.ceil(lastEnd / FPS);
    for (let s = 0; s <= totalSeconds; s++) {
      if (s % step === 0) {
        labels.push({
          atFrame: s * FPS,
          text: framesToTimecode(s * FPS).slice(3, 8), // mm:ss
        });
      } else if (pxPerSecond > 12) {
        minor.push(s * FPS);
      }
    }
    return { labels, minor };
  }, [pxPerFrame, lastEnd]);

  const handleLaneDrop = (
    e: React.DragEvent<HTMLDivElement>,
    trackId: string
  ) => {
    e.preventDefault();
    const mediaId = e.dataTransfer.getData("text/x-mediabin-id");
    if (!mediaId) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const atFrame = Math.max(0, Math.round(x / pxPerFrame));
    onDropMedia(mediaId, trackId, atFrame);
  };

  const playheadX = playheadFrames * pxPerFrame;

  // Tracks total height for the playhead line
  const tracksHeight = tracks.reduce((acc, t) => acc + trackHeight(t), 0);

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--pp-panel)" }}
    >
      {/* Tab strip */}
      <div
        className="flex items-center justify-between"
        style={{
          height: 22,
          background: "var(--pp-toolbar)",
          borderBottom: "1px solid var(--pp-border)",
        }}
      >
        <div className="flex">
          <span className="pp-panel-tab is-active">Sequence 01</span>
          <span className="pp-panel-tab">Sequence 02</span>
        </div>
        <div
          className="flex items-center gap-2 pr-2"
          style={{ color: "var(--pp-text-dim)", fontSize: 10 }}
        >
          <span>00:00:00:00 — {framesToTimecode(lastEnd)}</span>
        </div>
      </div>

      {/* Scrollable timeline body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto relative"
        style={{ background: "var(--pp-bg)" }}
      >
        <div
          style={{
            width: TRACK_HEADER_WIDTH + contentWidth,
            position: "relative",
          }}
        >
          {/* Ruler */}
          <div
            className="flex"
            style={{
              height: RULER_HEIGHT,
              position: "sticky",
              top: 0,
              zIndex: 6,
              background: "var(--pp-toolbar)",
              borderBottom: "1px solid var(--pp-border)",
            }}
          >
            {/* corner */}
            <div
              style={{
                width: TRACK_HEADER_WIDTH,
                position: "sticky",
                left: 0,
                zIndex: 7,
                background: "var(--pp-toolbar)",
                borderRight: "1px solid var(--pp-border)",
              }}
            />
            {/* ticks */}
            <div
              data-seek-surface="ruler"
              onMouseDown={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const f = Math.max(
                  0,
                  Math.round((e.clientX - r.left) / pxPerFrame)
                );
                onSeek(f);
              }}
              className="relative cursor-text"
              style={{ width: contentWidth, height: RULER_HEIGHT }}
            >
              {ticks.minor.map((f) => (
                <div
                  key={`m-${f}`}
                  className="absolute top-0"
                  style={{
                    left: f * pxPerFrame,
                    height: 6,
                    width: 1,
                    background: "rgba(255,255,255,0.15)",
                  }}
                />
              ))}
              {ticks.labels.map((t) => (
                <div
                  key={`l-${t.atFrame}`}
                  className="absolute top-0"
                  style={{
                    left: t.atFrame * pxPerFrame,
                    height: RULER_HEIGHT,
                  }}
                >
                  <div
                    style={{
                      height: 10,
                      width: 1,
                      background: "rgba(255,255,255,0.4)",
                    }}
                  />
                  <div
                    className="font-mono"
                    style={{
                      color: "var(--pp-text)",
                      fontSize: 9,
                      paddingLeft: 3,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Track rows */}
          {tracks.map((track) => {
            const h = trackHeight(track);
            const isVideo = track.type === "video";
            return (
              <div
                key={track.id}
                className="flex"
                style={{
                  height: h,
                  borderBottom: "1px solid #1a1a1a",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    width: TRACK_HEADER_WIDTH,
                    position: "sticky",
                    left: 0,
                    zIndex: 5,
                    background: "var(--pp-panel)",
                    borderRight: "1px solid var(--pp-border)",
                  }}
                  className="flex items-center px-1.5 gap-1"
                >
                  <span
                    className="font-mono"
                    style={{
                      color: "var(--pp-text-bright)",
                      fontWeight: 600,
                      width: 22,
                    }}
                  >
                    {track.label}
                  </span>
                  <button
                    onClick={() => onToggleTrackProp(track.id, "muted")}
                    className="pp-tool-btn"
                    style={{ width: 18, height: 18 }}
                    title={track.muted ? "Unmute" : "Mute"}
                  >
                    {isVideo ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: track.muted
                            ? "var(--pp-accent-orange)"
                            : "var(--pp-text)",
                        }}
                      >
                        {track.muted ? "👁" : "👁"}
                      </span>
                    ) : (
                      <span
                        style={{
                          color: track.muted ? "var(--pp-accent-orange)" : "var(--pp-text)",
                        }}
                      >
                        <SpeakerIcon muted={track.muted} />
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => onToggleTrackProp(track.id, "solo")}
                    className="pp-tool-btn"
                    style={{
                      width: 18,
                      height: 18,
                      color: track.solo ? "var(--pp-accent-orange)" : "var(--pp-text-dim)",
                      fontWeight: 700,
                      fontSize: 10,
                    }}
                    title="Solo"
                  >
                    S
                  </button>
                  <button
                    onClick={() => onToggleTrackProp(track.id, "locked")}
                    className="pp-tool-btn"
                    style={{
                      width: 18,
                      height: 18,
                      color: track.locked ? "var(--pp-accent-orange)" : "var(--pp-text-dim)",
                    }}
                    title={track.locked ? "Unlock" : "Lock"}
                  >
                    <LockIcon locked={track.locked} />
                  </button>
                </div>

                {/* Lane */}
                <div
                  data-seek-surface="lane"
                  onMouseDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    const r = e.currentTarget.getBoundingClientRect();
                    const f = Math.max(
                      0,
                      Math.round((e.clientX - r.left) / pxPerFrame)
                    );
                    onSeek(f);
                    onSelectClip(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => handleLaneDrop(e, track.id)}
                  className="relative"
                  style={{
                    width: contentWidth,
                    background: isVideo
                      ? "repeating-linear-gradient(0deg, #232323 0px, #232323 1px, #1f1f1f 1px, #1f1f1f 100%)"
                      : "repeating-linear-gradient(0deg, #1f2922 0px, #1f2922 1px, #1a221d 1px, #1a221d 100%)",
                  }}
                >
                  {clips
                    .filter((c) => c.trackId === track.id)
                    .map((c) => {
                      const m = mediaById.get(c.mediaId);
                      if (!m) return null;
                      return (
                        <TimelineClip
                          key={c.id}
                          clip={c}
                          media={m}
                          pxPerFrame={pxPerFrame}
                          selected={c.id === selectedClipId}
                          selectedTool={selectedTool}
                          onSelect={onSelectClip}
                          onMove={onMoveClip}
                          onTrim={onTrimClip}
                          onSplit={onSplitClip}
                        />
                      );
                    })}
                </div>
              </div>
            );
          })}

          {/* Playhead — spans the entire track stack */}
          <div
            className="pointer-events-none absolute"
            style={{
              left: TRACK_HEADER_WIDTH + playheadX,
              top: 0,
              height: RULER_HEIGHT + tracksHeight,
              width: 1,
              background: "var(--pp-accent-red)",
              zIndex: 8,
              boxShadow: "0 0 6px rgba(229,72,72,0.5)",
            }}
          >
            {/* Playhead head */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: -5,
                width: 11,
                height: 14,
                background: "var(--pp-accent-red)",
                clipPath:
                  "polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer: zoom slider */}
      <div
        className="flex items-center px-3 gap-3 border-t"
        style={{
          height: 26,
          background: "var(--pp-toolbar)",
          borderColor: "var(--pp-border)",
        }}
      >
        <span style={{ color: "var(--pp-text-dim)", fontSize: 10 }}>
          {clips.length} clips · {tracks.length} tracks
        </span>
        <div className="flex-1" />
        <span style={{ color: "var(--pp-text-dim)", fontSize: 10 }}>Zoom</span>
        <input
          type="range"
          min={0.25}
          max={8}
          step={0.05}
          value={zoom}
          onChange={(e) => onZoomChange(parseFloat(e.target.value))}
          style={{ width: 160, accentColor: "var(--pp-accent-blue)" }}
        />
        <span
          className="font-mono"
          style={{ color: "var(--pp-text)", fontSize: 10, width: 40 }}
        >
          {zoom.toFixed(2)}x
        </span>
      </div>
    </div>
  );
}
