"use client";

import type { PsTool } from "./types";
import {
  MoveIcon,
  MarqueeIcon,
  LassoIcon,
  WandIcon,
  CropIcon,
  EyedropperIcon,
  HealIcon,
  BrushIcon,
  CloneIcon,
  EraserIcon,
  BucketIcon,
  BlurIcon,
  DodgeIcon,
  PenIcon,
  TypeIcon,
  RectangleIcon,
  EllipseIcon,
  HandIcon,
  ZoomIcon,
  SwapIcon,
} from "./PsIcons";

const TOOLS: { id: PsTool; label: string; key: string; icon: () => JSX.Element }[] = [
  { id: "move", label: "Move Tool", key: "V", icon: MoveIcon },
  { id: "marquee", label: "Rectangular Marquee", key: "M", icon: MarqueeIcon },
  { id: "lasso", label: "Lasso Tool", key: "L", icon: LassoIcon },
  { id: "wand", label: "Magic Wand Tool", key: "W", icon: WandIcon },
  { id: "crop", label: "Crop Tool", key: "C", icon: CropIcon },
  { id: "eyedropper", label: "Eyedropper", key: "I", icon: EyedropperIcon },
  { id: "heal", label: "Spot Healing Brush", key: "J", icon: HealIcon },
  { id: "brush", label: "Brush Tool", key: "B", icon: BrushIcon },
  { id: "clone", label: "Clone Stamp", key: "S", icon: CloneIcon },
  { id: "eraser", label: "Eraser Tool", key: "E", icon: EraserIcon },
  { id: "bucket", label: "Paint Bucket", key: "G", icon: BucketIcon },
  { id: "blur", label: "Blur Tool", key: "R", icon: BlurIcon },
  { id: "dodge", label: "Dodge Tool", key: "O", icon: DodgeIcon },
  { id: "pen", label: "Pen Tool", key: "P", icon: PenIcon },
  { id: "type", label: "Horizontal Type", key: "T", icon: TypeIcon },
  { id: "rectangle", label: "Rectangle Tool", key: "U", icon: RectangleIcon },
  { id: "ellipse", label: "Ellipse Tool", key: "U", icon: EllipseIcon },
  { id: "hand", label: "Hand Tool", key: "H", icon: HandIcon },
  { id: "zoom", label: "Zoom Tool", key: "Z", icon: ZoomIcon },
];

export default function Toolbox({
  selectedTool,
  onSelectTool,
  fg,
  bg,
  onSwap,
  onPickFg,
  onPickBg,
  onResetColors,
}: {
  selectedTool: PsTool;
  onSelectTool: (t: PsTool) => void;
  fg: string;
  bg: string;
  onSwap: () => void;
  onPickFg: () => void;
  onPickBg: () => void;
  onResetColors: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center py-1 gap-0"
      style={{
        width: 36,
        background: "var(--ps-toolbar)",
        borderRight: "1px solid var(--ps-border)",
      }}
    >
      {/* Adobe logo block */}
      <div
        className="w-7 h-7 rounded-sm flex items-center justify-center mb-1"
        style={{
          background: "linear-gradient(135deg, #001e36 0%, #31a8ff 100%)",
          color: "#001e36",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "-1px",
        }}
        title="Photoshop"
      >
        Ps
      </div>

      {TOOLS.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            title={`${t.label} (${t.key})`}
            className={`ps-tool-btn ${selectedTool === t.id ? "is-active" : ""}`}
          >
            <Icon />
          </button>
        );
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Color squares */}
      <div className="relative" style={{ width: 28, height: 28 }}>
        <button
          onClick={onPickBg}
          title="Background color"
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 17,
            height: 17,
            background: bg,
            border: "1.5px solid #d0d0d0",
            borderRadius: 1,
          }}
        />
        <button
          onClick={onPickFg}
          title="Foreground color"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 17,
            height: 17,
            background: fg,
            border: "1.5px solid #d0d0d0",
            borderRadius: 1,
            zIndex: 2,
          }}
        />
        <button
          onClick={onSwap}
          title="Swap colors (X)"
          style={{
            position: "absolute",
            right: -2,
            top: -2,
            color: "var(--ps-text-bright)",
            background: "transparent",
            padding: 0,
          }}
        >
          <SwapIcon />
        </button>
        <button
          onClick={onResetColors}
          title="Default colors (D)"
          style={{
            position: "absolute",
            left: -2,
            bottom: -2,
            color: "var(--ps-text-bright)",
            background: "transparent",
            padding: 0,
            display: "flex",
            gap: 1,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              background: "white",
              border: "1px solid #888",
            }}
          />
          <span
            style={{
              width: 6,
              height: 6,
              background: "black",
              border: "1px solid #888",
              marginLeft: -3,
              marginTop: 3,
            }}
          />
        </button>
      </div>

      {/* Quick mask */}
      <button
        className="ps-tool-btn mt-1"
        title="Edit in Quick Mask Mode (Q)"
        style={{ width: 28, height: 22 }}
      >
        <div
          style={{
            width: 16,
            height: 12,
            background: "var(--ps-bg)",
            border: "1px solid var(--ps-text-dim)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 2,
              background: "var(--ps-text-dim)",
            }}
          />
        </div>
      </button>
    </div>
  );
}
