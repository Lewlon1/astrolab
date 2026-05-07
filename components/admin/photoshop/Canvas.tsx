"use client";

import { useEffect, useRef, useState } from "react";
import type { Layer, PsTool } from "./types";

interface BrushOpts {
  size: number;
  hardness: number;
  opacity: number;
  flow: number;
}

export default function Canvas({
  docW,
  docH,
  zoom,
  layers,
  activeLayerId,
  layerCanvases,
  fg,
  tool,
  brush,
  fontSize,
  onSeedThumbnails,
  onCursorChange,
  onPickColor,
  onAddHistory,
}: {
  docW: number;
  docH: number;
  zoom: number;
  layers: Layer[];
  activeLayerId: string;
  layerCanvases: Map<string, HTMLCanvasElement>;
  fg: string;
  tool: PsTool;
  brush: BrushOpts;
  fontSize: number;
  onSeedThumbnails: () => void;
  onCursorChange: (pt: { x: number; y: number } | null) => void;
  onPickColor: (hex: string) => void;
  onAddHistory: (label: string) => void;
}) {
  const viewRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [seeded, setSeeded] = useState(false);
  const drawingRef = useRef<{
    last: { x: number; y: number };
    start: { x: number; y: number };
    overlay?: HTMLCanvasElement;
  } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; sl: number; st: number } | null>(null);

  // Composite all visible layers onto the view canvas
  const compose = () => {
    const view = viewRef.current;
    if (!view) return;
    const ctx = view.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, docW, docH);
    ctx.restore();
    // Render layers from bottom (first) to top (last)
    for (const l of layers) {
      if (!l.visible) continue;
      const lc = layerCanvases.get(l.id);
      if (!lc) continue;
      ctx.save();
      ctx.globalAlpha = l.opacity / 100;
      ctx.globalCompositeOperation = blendModeToComposite(l.blendMode);
      ctx.drawImage(lc, 0, 0);
      ctx.restore();
    }
    // If a temporary overlay exists (rectangle/ellipse drag preview), draw it on top
    if (drawingRef.current?.overlay) {
      ctx.drawImage(drawingRef.current.overlay, 0, 0);
    }
  };

  // Initialize layer pixel content on first mount — Astropsyche-themed
  useEffect(() => {
    if (seeded) return;
    if (layerCanvases.size < layers.length) return; // wait until canvases registered

    const draw = (id: string, fn: (ctx: CanvasRenderingContext2D) => void) => {
      const c = layerCanvases.get(id);
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, docW, docH);
      fn(ctx);
    };

    // Background: cosmic gradient
    draw("l-bg", (ctx) => {
      const grad = ctx.createLinearGradient(0, 0, docW, docH);
      grad.addColorStop(0, "#0a0a1f");
      grad.addColorStop(0.5, "#1d1442");
      grad.addColorStop(1, "#3d1f5e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, docW, docH);
      // Stars
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for (let i = 0; i < 90; i++) {
        const x = Math.round((Math.sin(i * 12.9898) * 43758.5453 % 1) * docW + docW) % docW;
        const y = Math.round((Math.sin(i * 78.233) * 43758.5453 % 1) * docH + docH) % docH;
        const r = Math.abs(Math.sin(i * 17.7) * 1.4) + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Saturn glow
    draw("l-glow", (ctx) => {
      const cx = docW * 0.5;
      const cy = docH * 0.55;
      const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, docW * 0.55);
      grad.addColorStop(0, "rgba(241, 126, 44, 0.65)");
      grad.addColorStop(0.4, "rgba(241, 126, 44, 0.2)");
      grad.addColorStop(1, "rgba(241, 126, 44, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, docW, docH);
    });

    // Saturn body + ring
    draw("l-saturn", (ctx) => {
      const cx = docW * 0.5;
      const cy = docH * 0.55;
      const r = docW * 0.18;
      // Ring shadow behind planet
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.25);
      ctx.strokeStyle = "rgba(212, 168, 67, 0.85)";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.85, r * 0.55, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      // Planet body
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.2, 0, 0, r);
      grad.addColorStop(0, "#f4d77a");
      grad.addColorStop(0.6, "#d4a843");
      grad.addColorStop(1, "#7a4f1a");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      // Front of ring
      ctx.strokeStyle = "rgba(212, 168, 67, 0.95)";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.85, r * 0.55, 0, 0, Math.PI);
      ctx.stroke();
      ctx.restore();
    });

    // Title text
    draw("l-title", (ctx) => {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#f6f4f1";
      ctx.font = "300 92px 'Playfair Display', serif";
      ctx.fillText("SATURN RETURN", docW / 2, docH * 0.18);
      ctx.font = "500 28px 'DM Sans', sans-serif";
      ctx.fillStyle = "rgba(246, 244, 241, 0.7)";
      ctx.fillText("ASTROLOGY × PSYCHOLOGY", docW / 2, docH * 0.18 + 70);
    });

    // Particles overlay
    draw("l-particles", (ctx) => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      for (let i = 0; i < 40; i++) {
        const x = ((Math.sin(i * 31.7) * 9999) % 1) * docW;
        const y = ((Math.cos(i * 47.3) * 9999) % 1) * docH;
        const size = (Math.abs(Math.sin(i * 5.5)) * 2 + 0.5);
        ctx.beginPath();
        ctx.arc(Math.abs(x), Math.abs(y), size, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    setSeeded(true);
    onSeedThumbnails();
    compose();
  }, [seeded, layers.length, layerCanvases]);

  // Recompose whenever layers, opacity, blend mode, visibility change
  useEffect(() => {
    compose();
  });

  // Drawing handlers
  const getLocalXY = (e: React.PointerEvent) => {
    const view = viewRef.current!;
    const rect = view.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * docW;
    const y = ((e.clientY - rect.top) / rect.height) * docH;
    return { x, y };
  };

  const activeLayer = layers.find((l) => l.id === activeLayerId);
  const activeCanvas = layerCanvases.get(activeLayerId);
  const activeCtx = activeCanvas?.getContext("2d");

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!activeCtx || !activeLayer || activeLayer.locked) return;
    const pt = getLocalXY(e);

    if (tool === "hand") {
      const c = containerRef.current!;
      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        sl: c.scrollLeft,
        st: c.scrollTop,
      };
      (e.target as Element).setPointerCapture(e.pointerId);
      return;
    }

    if (tool === "eyedropper") {
      const ctx = viewRef.current!.getContext("2d")!;
      const data = ctx.getImageData(Math.floor(pt.x), Math.floor(pt.y), 1, 1).data;
      const hex =
        "#" +
        [data[0], data[1], data[2]]
          .map((n) => n.toString(16).padStart(2, "0"))
          .join("");
      onPickColor(hex);
      onAddHistory("Eyedropper");
      return;
    }

    if (tool === "bucket") {
      activeCtx.save();
      activeCtx.fillStyle = fg;
      activeCtx.fillRect(0, 0, docW, docH);
      activeCtx.restore();
      compose();
      onSeedThumbnails();
      onAddHistory("Paint Bucket");
      return;
    }

    if (tool === "type") {
      const text = window.prompt("Type text", "Mercury Retrograde");
      if (!text) return;
      activeCtx.save();
      activeCtx.fillStyle = fg;
      activeCtx.font = `500 ${fontSize}px 'DM Sans', sans-serif`;
      activeCtx.fillText(text, pt.x, pt.y);
      activeCtx.restore();
      compose();
      onSeedThumbnails();
      onAddHistory(`Type: "${text.slice(0, 18)}"`);
      return;
    }

    if (tool === "brush" || tool === "eraser" || tool === "clone" || tool === "heal") {
      drawingRef.current = { last: pt, start: pt };
      drawDot(activeCtx, pt.x, pt.y);
      compose();
      (e.target as Element).setPointerCapture(e.pointerId);
      return;
    }

    if (tool === "rectangle" || tool === "ellipse" || tool === "marquee") {
      // Use an overlay canvas for live preview
      const ov = document.createElement("canvas");
      ov.width = docW;
      ov.height = docH;
      drawingRef.current = { last: pt, start: pt, overlay: ov };
      (e.target as Element).setPointerCapture(e.pointerId);
      return;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const pt = getLocalXY(e);
    onCursorChange(pt);

    if (tool === "hand" && panRef.current && containerRef.current) {
      containerRef.current.scrollLeft =
        panRef.current.sl - (e.clientX - panRef.current.startX);
      containerRef.current.scrollTop =
        panRef.current.st - (e.clientY - panRef.current.startY);
      return;
    }

    if (!drawingRef.current || !activeCtx) return;

    if (tool === "brush" || tool === "eraser" || tool === "clone" || tool === "heal") {
      drawLine(activeCtx, drawingRef.current.last.x, drawingRef.current.last.y, pt.x, pt.y);
      drawingRef.current.last = pt;
      compose();
      return;
    }

    if (tool === "rectangle" || tool === "ellipse" || tool === "marquee") {
      const ov = drawingRef.current.overlay;
      if (!ov) return;
      const ctx = ov.getContext("2d")!;
      ctx.clearRect(0, 0, docW, docH);
      const { start } = drawingRef.current;
      const x = Math.min(start.x, pt.x);
      const y = Math.min(start.y, pt.y);
      const w = Math.abs(pt.x - start.x);
      const h = Math.abs(pt.y - start.y);
      if (tool === "marquee") {
        ctx.save();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x, y, w, h);
        ctx.strokeStyle = "#fff";
        ctx.lineDashOffset = 4;
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
      } else if (tool === "rectangle") {
        ctx.fillStyle = fg;
        ctx.fillRect(x, y, w, h);
      } else if (tool === "ellipse") {
        ctx.save();
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      compose();
    }
  };

  const handlePointerUp = () => {
    if (tool === "hand") {
      panRef.current = null;
      return;
    }
    if (!drawingRef.current || !activeCtx) {
      drawingRef.current = null;
      return;
    }

    const { overlay } = drawingRef.current;

    if (tool === "rectangle" || tool === "ellipse") {
      if (overlay) {
        activeCtx.drawImage(overlay, 0, 0);
        onSeedThumbnails();
        onAddHistory(tool === "rectangle" ? "Rectangle" : "Ellipse");
      }
    } else if (tool === "brush") {
      onSeedThumbnails();
      onAddHistory("Brush stroke");
    } else if (tool === "eraser") {
      onSeedThumbnails();
      onAddHistory("Erase");
    } else if (tool === "clone" || tool === "heal") {
      onSeedThumbnails();
      onAddHistory(tool === "clone" ? "Clone Stamp" : "Spot Heal");
    } else if (tool === "marquee") {
      // Marquee leaves no pixel data; just drop the overlay
    }

    drawingRef.current = null;
    compose();
  };

  // Brush primitives
  function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.fillStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = fg;
      ctx.fillStyle = fg;
    }
    ctx.globalAlpha = (brush.opacity / 100) * (brush.flow / 100);
    ctx.beginPath();
    ctx.arc(x, y, brush.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawLine(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ) {
    ctx.save();
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = fg;
    }
    ctx.globalAlpha = (brush.opacity / 100) * (brush.flow / 100);
    ctx.lineWidth = brush.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // Soft edge approximation via shadow
    if (brush.hardness < 100 && tool !== "eraser") {
      ctx.shadowColor = fg;
      ctx.shadowBlur = (brush.size * (100 - brush.hardness)) / 100;
    }
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  }

  const dispW = docW * zoom;
  const dispH = docH * zoom;

  // Cursor style based on tool
  const cursor = (() => {
    if (tool === "hand") return "grab";
    if (tool === "brush" || tool === "eraser") return "crosshair";
    if (tool === "type") return "text";
    if (tool === "zoom") return "zoom-in";
    if (tool === "eyedropper") return "crosshair";
    if (tool === "rectangle" || tool === "ellipse" || tool === "marquee") return "crosshair";
    return "default";
  })();

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto relative"
      style={{ background: "var(--ps-canvas-bg)" }}
      onPointerLeave={() => onCursorChange(null)}
    >
      <div
        className="flex items-center justify-center"
        style={{
          minWidth: "100%",
          minHeight: "100%",
          padding: 40,
        }}
      >
        <div
          style={{
            width: dispW,
            height: dispH,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.5)",
            position: "relative",
          }}
        >
          {/* Checker bg behind transparent layers */}
          <div className="absolute inset-0 ps-checker" />
          <canvas
            ref={viewRef}
            width={docW}
            height={docH}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              cursor,
              imageRendering: "auto",
            }}
          />
          {/* Tab label badge */}
          <div
            className="absolute"
            style={{
              top: -22,
              left: 0,
              background: "var(--ps-panel)",
              color: "var(--ps-text-bright)",
              padding: "2px 10px",
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
              border: "1px solid var(--ps-border)",
              borderBottom: "none",
              fontSize: 10,
            }}
          >
            astropsyche-saturn-return.psd @ {Math.round(zoom * 100)}% (RGB/8) ✱
          </div>
        </div>
      </div>
    </div>
  );
}

function blendModeToComposite(mode: string): GlobalCompositeOperation {
  switch (mode) {
    case "multiply":
      return "multiply";
    case "screen":
      return "screen";
    case "overlay":
      return "overlay";
    case "soft-light":
      return "soft-light";
    case "color-dodge":
      return "color-dodge";
    default:
      return "source-over";
  }
}
