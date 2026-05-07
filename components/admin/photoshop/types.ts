export type PsTool =
  | "move"
  | "marquee"
  | "lasso"
  | "wand"
  | "crop"
  | "eyedropper"
  | "heal"
  | "brush"
  | "clone"
  | "eraser"
  | "bucket"
  | "blur"
  | "dodge"
  | "pen"
  | "type"
  | "rectangle"
  | "ellipse"
  | "hand"
  | "zoom";

export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "soft-light"
  | "color-dodge";

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number; // 0-100
  blendMode: BlendMode;
  locked: boolean;
  // Each layer owns an offscreen canvas drawn to the document size
  // The canvas itself is held in a Map<id, HTMLCanvasElement> outside React state
}

export interface PsDoc {
  name: string;
  width: number;
  height: number;
}

export interface HistoryEntry {
  label: string;
  layerId: string;
  snapshot: ImageData | null; // pre-action snapshot of that layer
}
