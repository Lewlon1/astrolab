import { DEFAULT_FPS } from "./types";

export function framesToTimecode(frames: number, fps = DEFAULT_FPS) {
  const totalSeconds = Math.floor(frames / fps);
  const f = Math.floor(frames % fps);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);
  const pad = (n: number, w = 2) => n.toString().padStart(w, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
}

export function framesToShort(frames: number, fps = DEFAULT_FPS) {
  const totalSeconds = Math.floor(frames / fps);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export const PX_PER_FRAME_BASE = 4; // 1 frame = 4px at zoom=1 (so 30 frames/s = 120px/s — readable)
