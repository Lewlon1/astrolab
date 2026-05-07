"use client";

import type { PsTool } from "./types";

const TOOL_HINTS: Record<PsTool, string> = {
  move: "Click and drag to move. Hold Alt to duplicate.",
  marquee: "Click and drag to make a rectangular selection.",
  lasso: "Click and drag to make a freehand selection.",
  wand: "Click on a colour to select pixels of similar tone.",
  crop: "Drag handles to crop. Press Enter to commit.",
  eyedropper: "Click anywhere on the canvas to sample a colour.",
  heal: "Paint over imperfections to blend them away.",
  brush: "Click and drag to paint with the foreground colour.",
  clone: "Alt-click to set source, then paint to clone.",
  eraser: "Click and drag to erase pixels on the active layer.",
  bucket: "Click to flood-fill matching pixels with the foreground colour.",
  blur: "Drag over an area to blur it.",
  dodge: "Drag over an area to lighten it.",
  pen: "Click to add anchor points and create a path.",
  type: "Click to set a text insertion point and start typing.",
  rectangle: "Drag to draw a rectangle in the foreground colour.",
  ellipse: "Drag to draw an ellipse in the foreground colour.",
  hand: "Click and drag to pan the canvas.",
  zoom: "Click to zoom in. Alt-click to zoom out.",
};

export default function StatusBar({
  zoom,
  docW,
  docH,
  tool,
  cursor,
  layerCount,
}: {
  zoom: number;
  docW: number;
  docH: number;
  tool: PsTool;
  cursor: { x: number; y: number } | null;
  layerCount: number;
}) {
  return (
    <div
      className="flex items-center px-2 gap-3"
      style={{
        height: 24,
        background: "var(--ps-toolbar)",
        borderTop: "1px solid var(--ps-border)",
        color: "var(--ps-text-dim)",
        fontSize: 10,
      }}
    >
      <span
        className="font-mono"
        style={{ color: "var(--ps-text)", minWidth: 60 }}
      >
        {Math.round(zoom * 100)}%
      </span>
      <span style={{ minWidth: 120 }}>
        Doc: {docW} × {docH} px · {layerCount} layers
      </span>
      <span style={{ minWidth: 120 }}>
        {cursor ? (
          <span className="font-mono">
            X: {cursor.x.toFixed(0)} px &nbsp; Y: {cursor.y.toFixed(0)} px
          </span>
        ) : (
          <span style={{ opacity: 0.5 }}>X: — Y: —</span>
        )}
      </span>
      <span className="flex-1 truncate" style={{ color: "var(--ps-text)" }}>
        {TOOL_HINTS[tool]}
      </span>
      <span>RGB / 8 · sRGB IEC61966-2.1</span>
    </div>
  );
}
