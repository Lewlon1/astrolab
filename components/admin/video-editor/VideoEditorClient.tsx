"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { Clip, EditorState, MediaItem, Tool, Track } from "./types";
import { DEFAULT_FPS } from "./types";
import { MOCK_MEDIA, DEFAULT_TRACKS, SEED_CLIPS } from "./mockMedia";
import { PX_PER_FRAME_BASE, clamp } from "./utils";
import MenuBar from "./MenuBar";
import Toolbar from "./Toolbar";
import MediaBin from "./MediaBin";
import SourceMonitor from "./SourceMonitor";
import ProgramMonitor from "./ProgramMonitor";
import EffectsPanel from "./EffectsPanel";
import Timeline from "./Timeline";

type Action =
  | { type: "SET_TOOL"; tool: Tool }
  | { type: "SET_PLAYHEAD"; frame: number }
  | { type: "SET_PLAYING"; playing: boolean }
  | { type: "SELECT_CLIP"; id: string | null }
  | { type: "ADD_CLIP"; clip: Clip }
  | { type: "MOVE_CLIP"; id: string; newStart: number }
  | { type: "TRIM_CLIP"; id: string; side: "L" | "R"; deltaFrames: number }
  | { type: "SPLIT_CLIP"; id: string; atFrame: number }
  | { type: "DELETE_CLIP"; id: string }
  | {
      type: "TOGGLE_TRACK_PROP";
      trackId: string;
      prop: "muted" | "solo" | "locked";
    }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "SET_SOURCE_MEDIA"; id: string | null }
  | { type: "ADD_MEDIA"; item: MediaItem }
  | { type: "TOAST"; message: string | null };

const initialState: EditorState = {
  mediaBin: MOCK_MEDIA,
  tracks: DEFAULT_TRACKS,
  clips: SEED_CLIPS,
  playheadFrames: 0,
  isPlaying: false,
  fps: DEFAULT_FPS,
  selectedTool: "select",
  selectedClipId: null,
  zoom: 1,
  sourceMonitorMediaId: null,
  toast: null,
};

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case "SET_TOOL":
      return { ...state, selectedTool: action.tool };
    case "SET_PLAYHEAD":
      return { ...state, playheadFrames: Math.max(0, action.frame) };
    case "SET_PLAYING":
      return { ...state, isPlaying: action.playing };
    case "SELECT_CLIP":
      return { ...state, selectedClipId: action.id };
    case "ADD_CLIP":
      return { ...state, clips: [...state.clips, action.clip] };
    case "MOVE_CLIP": {
      return {
        ...state,
        clips: state.clips.map((c) =>
          c.id === action.id
            ? { ...c, startFrames: Math.max(0, action.newStart) }
            : c
        ),
      };
    }
    case "TRIM_CLIP": {
      return {
        ...state,
        clips: state.clips.map((c) => {
          if (c.id !== action.id) return c;
          if (action.side === "L") {
            const newIn = Math.max(
              0,
              Math.min(c.outFrames - 1, c.inFrames + action.deltaFrames)
            );
            const delta = newIn - c.inFrames;
            return {
              ...c,
              inFrames: newIn,
              startFrames: c.startFrames + delta,
            };
          } else {
            const newOut = Math.max(
              c.inFrames + 1,
              c.outFrames + action.deltaFrames
            );
            return { ...c, outFrames: newOut };
          }
        }),
      };
    }
    case "SPLIT_CLIP": {
      const target = state.clips.find((c) => c.id === action.id);
      if (!target) return state;
      const localFrame = action.atFrame - target.startFrames;
      const length = target.outFrames - target.inFrames;
      if (localFrame <= 0 || localFrame >= length) return state;
      const splitInSource = target.inFrames + localFrame;
      const left: Clip = {
        ...target,
        outFrames: splitInSource,
      };
      const right: Clip = {
        ...target,
        id: `${target.id}-r${Date.now().toString(36)}`,
        startFrames: target.startFrames + localFrame,
        inFrames: splitInSource,
      };
      return {
        ...state,
        clips: [
          ...state.clips.filter((c) => c.id !== action.id),
          left,
          right,
        ],
      };
    }
    case "DELETE_CLIP":
      return {
        ...state,
        clips: state.clips.filter((c) => c.id !== action.id),
        selectedClipId:
          state.selectedClipId === action.id ? null : state.selectedClipId,
      };
    case "TOGGLE_TRACK_PROP":
      return {
        ...state,
        tracks: state.tracks.map((t) =>
          t.id === action.trackId ? { ...t, [action.prop]: !t[action.prop] } : t
        ),
      };
    case "SET_ZOOM":
      return { ...state, zoom: clamp(action.zoom, 0.25, 8) };
    case "SET_SOURCE_MEDIA":
      return { ...state, sourceMonitorMediaId: action.id };
    case "ADD_MEDIA": {
      const idx = state.mediaBin.findIndex((m) => m.id === action.item.id);
      if (idx >= 0) {
        const next = [...state.mediaBin];
        next[idx] = action.item;
        return { ...state, mediaBin: next };
      }
      return { ...state, mediaBin: [action.item, ...state.mediaBin] };
    }
    case "TOAST":
      return { ...state, toast: action.message };
    default:
      return state;
  }
}

export default function VideoEditorClient() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const playheadRef = useRef(state.playheadFrames);
  const isPlayingRef = useRef(state.isPlaying);
  const [exportProgress, setExportProgress] = useState<number | null>(null);

  useEffect(() => {
    playheadRef.current = state.playheadFrames;
  }, [state.playheadFrames]);
  useEffect(() => {
    isPlayingRef.current = state.isPlaying;
  }, [state.isPlaying]);

  const mediaById = useMemo(() => {
    const m = new Map<string, MediaItem>();
    for (const item of state.mediaBin) m.set(item.id, item);
    return m;
  }, [state.mediaBin]);

  const totalDurationFrames = useMemo(() => {
    let max = 0;
    for (const c of state.clips) {
      const end = c.startFrames + (c.outFrames - c.inFrames);
      if (end > max) max = end;
    }
    return max;
  }, [state.clips]);

  // Active clip under playhead = topmost video track clip overlapping playhead
  const activeClip = useMemo(() => {
    const trackOrder = ["v3", "v2", "v1"];
    for (const tid of trackOrder) {
      const found = state.clips.find(
        (c) =>
          c.trackId === tid &&
          state.playheadFrames >= c.startFrames &&
          state.playheadFrames < c.startFrames + (c.outFrames - c.inFrames)
      );
      if (found) return found;
    }
    return null;
  }, [state.clips, state.playheadFrames]);

  const sourceMonitorMedia = state.sourceMonitorMediaId
    ? mediaById.get(state.sourceMonitorMediaId) ?? null
    : null;
  const programMedia = activeClip ? mediaById.get(activeClip.mediaId) ?? null : null;

  const pxPerFrame = PX_PER_FRAME_BASE * state.zoom;

  // Playback animation
  useEffect(() => {
    if (!state.isPlaying) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const next = playheadRef.current + dt * DEFAULT_FPS;
      const cap =
        totalDurationFrames > 0 ? totalDurationFrames : Number.POSITIVE_INFINITY;
      if (next >= cap) {
        dispatch({ type: "SET_PLAYHEAD", frame: cap });
        dispatch({ type: "SET_PLAYING", playing: false });
        return;
      }
      dispatch({ type: "SET_PLAYHEAD", frame: next });
      if (isPlayingRef.current) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state.isPlaying, totalDurationFrames]);

  // Keybindings
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      switch (e.key) {
        case " ":
          e.preventDefault();
          dispatch({ type: "SET_PLAYING", playing: !isPlayingRef.current });
          break;
        case "v":
        case "V":
          dispatch({ type: "SET_TOOL", tool: "select" });
          break;
        case "c":
        case "C":
          dispatch({ type: "SET_TOOL", tool: "razor" });
          break;
        case "h":
        case "H":
          dispatch({ type: "SET_TOOL", tool: "hand" });
          break;
        case "z":
        case "Z":
          dispatch({ type: "SET_TOOL", tool: "zoom" });
          break;
        case "Delete":
        case "Backspace":
          if (state.selectedClipId) {
            e.preventDefault();
            dispatch({ type: "DELETE_CLIP", id: state.selectedClipId });
          }
          break;
        case "ArrowLeft":
          dispatch({
            type: "SET_PLAYHEAD",
            frame: Math.max(0, playheadRef.current - 1),
          });
          break;
        case "ArrowRight":
          dispatch({ type: "SET_PLAYHEAD", frame: playheadRef.current + 1 });
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.selectedClipId]);

  // Toast auto-hide
  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(() => dispatch({ type: "TOAST", message: null }), 1800);
    return () => clearTimeout(t);
  }, [state.toast]);

  const handleBinDragStart = useCallback(
    (id: string, e: React.DragEvent) => {
      e.dataTransfer.setData("text/x-mediabin-id", id);
      e.dataTransfer.effectAllowed = "copy";
    },
    []
  );

  const handleDropMedia = useCallback(
    (mediaId: string, trackId: string, atFrame: number) => {
      const media = mediaById.get(mediaId);
      const track = state.tracks.find((t) => t.id === trackId);
      if (!media || !track) return;
      // Type-mismatch guard: only audio onto audio, video onto video
      if (media.type !== track.type) {
        dispatch({
          type: "TOAST",
          message:
            media.type === "audio"
              ? "Audio drops onto A1–A3"
              : "Video drops onto V1–V3",
        });
        return;
      }
      const clip: Clip = {
        id: `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        mediaId,
        trackId,
        startFrames: atFrame,
        inFrames: 0,
        outFrames: media.durationFrames,
      };
      dispatch({ type: "ADD_CLIP", clip });
      dispatch({ type: "SELECT_CLIP", id: clip.id });
    },
    [mediaById, state.tracks]
  );

  const handleImport = useCallback((files: FileList) => {
    let added = 0;
    Array.from(files).forEach((file) => {
      const isAudio = file.type.startsWith("audio");
      const url = URL.createObjectURL(file);
      const tempItem: MediaItem = {
        id: `imp-${Date.now()}-${added}`,
        name: file.name,
        type: isAudio ? "audio" : "video",
        durationFrames: 30 * 30, // placeholder until metadata loads
        fps: 30,
        aspect: isAudio ? "audio" : "16:9",
        thumb: isAudio
          ? "linear-gradient(135deg, #4d7a3a, #6ba34d)"
          : "linear-gradient(135deg, #2c5d8a, #5a7fa8)",
        clipColor: isAudio ? "#4d7a3a" : "#3a6b7d",
        src: url,
      };
      dispatch({ type: "ADD_MEDIA", item: tempItem });
      // Async-load metadata to set true duration
      const probe = document.createElement(isAudio ? "audio" : "video");
      probe.preload = "metadata";
      probe.src = url;
      probe.addEventListener("loadedmetadata", () => {
        const frames = Math.max(1, Math.round(probe.duration * 30));
        // We don't have a SET_MEDIA_DURATION action — emulate by replacing the item
        dispatch({
          type: "ADD_MEDIA",
          item: { ...tempItem, durationFrames: frames, id: tempItem.id },
        });
      });
      added += 1;
    });
    dispatch({
      type: "TOAST",
      message: `Imported ${files.length} file${files.length > 1 ? "s" : ""}`,
    });
  }, []);

  const handleExport = () => {
    if (exportProgress !== null) return;
    setExportProgress(0);
    const start = performance.now();
    const dur = 2400;
    const tick = () => {
      const t = (performance.now() - start) / dur;
      if (t >= 1) {
        setExportProgress(100);
        setTimeout(() => {
          setExportProgress(null);
          dispatch({
            type: "TOAST",
            message: "Demo only — export not wired up.",
          });
        }, 600);
        return;
      }
      setExportProgress(Math.round(t * 100));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  return (
    <div
      className="h-full w-full flex flex-col"
      style={{ background: "var(--pp-bg)" }}
    >
      <MenuBar onExport={handleExport} />

      {/* Main editor grid: top monitors row + bottom timeline row, with effects rail on the right */}
      <div className="flex-1 min-h-0 grid" style={{ gridTemplateColumns: "1fr 220px" }}>
        {/* Left + center column */}
        <div className="flex flex-col min-w-0">
          {/* Top: monitors row */}
          <div
            className="grid min-h-0"
            style={{
              gridTemplateColumns: "1fr 1fr",
              flex: "1 1 50%",
              borderBottom: "1px solid var(--pp-border)",
            }}
          >
            <SourceMonitor media={sourceMonitorMedia} />
            <ProgramMonitor
              playheadFrames={state.playheadFrames}
              isPlaying={state.isPlaying}
              onPlayPause={() =>
                dispatch({ type: "SET_PLAYING", playing: !state.isPlaying })
              }
              onStep={(d) =>
                dispatch({
                  type: "SET_PLAYHEAD",
                  frame: state.playheadFrames + d,
                })
              }
              activeClip={activeClip}
              activeMedia={programMedia}
              totalDurationFrames={totalDurationFrames}
            />
          </div>
          {/* Bottom: bin + toolbar + timeline */}
          <div
            className="grid min-h-0"
            style={{
              gridTemplateColumns: "300px 32px 1fr",
              flex: "1 1 50%",
            }}
          >
            <MediaBin
              items={state.mediaBin}
              selectedId={state.sourceMonitorMediaId}
              onSelect={(id) => dispatch({ type: "SET_SOURCE_MEDIA", id })}
              onDoubleClick={(id) =>
                dispatch({ type: "SET_SOURCE_MEDIA", id })
              }
              onDragStart={handleBinDragStart}
              onImport={handleImport}
            />
            <Toolbar
              selectedTool={state.selectedTool}
              onSelectTool={(t) => dispatch({ type: "SET_TOOL", tool: t })}
            />
            <Timeline
              tracks={state.tracks}
              clips={state.clips}
              mediaById={mediaById}
              playheadFrames={state.playheadFrames}
              pxPerFrame={pxPerFrame}
              zoom={state.zoom}
              selectedClipId={state.selectedClipId}
              selectedTool={state.selectedTool}
              onSeek={(f) => dispatch({ type: "SET_PLAYHEAD", frame: f })}
              onSelectClip={(id) => dispatch({ type: "SELECT_CLIP", id })}
              onMoveClip={(id, ns) =>
                dispatch({ type: "MOVE_CLIP", id, newStart: ns })
              }
              onTrimClip={(id, side, dF) =>
                dispatch({
                  type: "TRIM_CLIP",
                  id,
                  side,
                  deltaFrames: dF,
                })
              }
              onSplitClip={(id, at) =>
                dispatch({ type: "SPLIT_CLIP", id, atFrame: at })
              }
              onDropMedia={handleDropMedia}
              onToggleTrackProp={(trackId, prop) =>
                dispatch({ type: "TOGGLE_TRACK_PROP", trackId, prop })
              }
              onZoomChange={(z) => dispatch({ type: "SET_ZOOM", zoom: z })}
            />
          </div>
        </div>

        {/* Right rail */}
        <EffectsPanel
          onApply={(name) =>
            dispatch({
              type: "TOAST",
              message: `${name} applied ✓`,
            })
          }
        />
      </div>

      {/* Toast */}
      {state.toast && (
        <div
          className="absolute left-1/2 bottom-8 -translate-x-1/2 px-4 py-2 rounded-md shadow-lg pointer-events-none"
          style={{
            background: "rgba(20,20,20,0.95)",
            color: "var(--pp-text-bright)",
            border: "1px solid var(--pp-accent-blue)",
            fontSize: 12,
            zIndex: 100,
          }}
        >
          {state.toast}
        </div>
      )}

      {/* Export modal */}
      {exportProgress !== null && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", zIndex: 200 }}
        >
          <div
            className="px-6 py-5 rounded-md shadow-2xl"
            style={{
              background: "var(--pp-panel)",
              border: "1px solid var(--pp-border-soft)",
              minWidth: 360,
            }}
          >
            <div
              className="mb-3 flex items-center justify-between"
              style={{ color: "var(--pp-text-bright)", fontWeight: 600 }}
            >
              <span>Exporting Sequence 01...</span>
              <span className="font-mono">{exportProgress}%</span>
            </div>
            <div
              className="w-full h-2 rounded-sm overflow-hidden"
              style={{ background: "var(--pp-bg)" }}
            >
              <div
                className="h-full transition-all"
                style={{
                  width: `${exportProgress}%`,
                  background:
                    "linear-gradient(to right, var(--pp-accent-blue), var(--pp-accent-blue-bright))",
                }}
              />
            </div>
            <div
              className="mt-3"
              style={{ color: "var(--pp-text-dim)", fontSize: 11 }}
            >
              H.264 · 1920×1080 · 30fps · Match Source bitrate
            </div>
          </div>
        </div>
      )}

      {/* Status footer */}
      <div
        className="flex items-center justify-between px-3"
        style={{
          height: 22,
          background: "var(--pp-toolbar)",
          borderTop: "1px solid var(--pp-border)",
          color: "var(--pp-text-dim)",
          fontSize: 10,
        }}
      >
        <div className="flex items-center gap-3">
          <span style={{ color: "var(--pp-accent-blue-bright)" }}>●</span>
          <span>Astropsyche.prproj</span>
          <span>·</span>
          <span>{state.tracks.length} tracks</span>
          <span>·</span>
          <span>{state.clips.length} clips</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Tool: {state.selectedTool}</span>
          <span>·</span>
          <span>Zoom {state.zoom.toFixed(2)}x</span>
          <span>·</span>
          <span>30 fps</span>
        </div>
      </div>
    </div>
  );
}
