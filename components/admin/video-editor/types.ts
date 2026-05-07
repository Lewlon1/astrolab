export type MediaType = "video" | "audio";

export type Tool =
  | "select"
  | "trackSelect"
  | "ripple"
  | "rolling"
  | "rate"
  | "razor"
  | "slip"
  | "slide"
  | "hand"
  | "zoom"
  | "pen"
  | "type";

export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  durationFrames: number;
  fps: number;
  aspect: "16:9" | "9:16" | "1:1" | "audio";
  thumb: string; // CSS background (linear-gradient) for the bin row swatch
  clipColor: string; // base color for timeline clip
  src?: string; // populated when imported via file picker
}

export interface Clip {
  id: string;
  mediaId: string;
  trackId: string;
  startFrames: number; // playhead position where the clip begins
  inFrames: number;    // in-point inside the source media
  outFrames: number;   // out-point inside the source media (exclusive)
  selected?: boolean;
}

export interface Track {
  id: string;
  label: string;
  type: MediaType;
  muted: boolean;
  solo: boolean;
  locked: boolean;
}

export interface EditorState {
  mediaBin: MediaItem[];
  tracks: Track[];
  clips: Clip[];
  playheadFrames: number;
  isPlaying: boolean;
  fps: number;
  selectedTool: Tool;
  selectedClipId: string | null;
  zoom: number; // pxPerFrame multiplier
  sourceMonitorMediaId: string | null;
  toast: string | null;
}

export const DEFAULT_FPS = 30;
export const BASE_PX_PER_FRAME = 0.25; // at zoom=1, 1 second (30 frames) = 7.5px? we scale below
