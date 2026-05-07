"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Layer, PsTool, BlendMode } from "./types";
import MenuBar from "./MenuBar";
import OptionsBar from "./OptionsBar";
import Toolbox from "./Toolbox";
import Canvas from "./Canvas";
import LayersPanel from "./LayersPanel";
import ColorPanel from "./ColorPanel";
import HistoryPanel from "./HistoryPanel";
import StatusBar from "./StatusBar";

const DOC_W = 1080;
const DOC_H = 1080;
const DOC_NAME = "astropsyche-saturn-return.psd";

const INITIAL_LAYERS: Layer[] = [
  { id: "l-bg", name: "Background", visible: true, opacity: 100, blendMode: "normal", locked: false },
  { id: "l-glow", name: "Saturn glow", visible: true, opacity: 80, blendMode: "screen", locked: false },
  { id: "l-saturn", name: "Saturn body", visible: true, opacity: 100, blendMode: "normal", locked: false },
  { id: "l-particles", name: "Stars overlay", visible: true, opacity: 70, blendMode: "screen", locked: false },
  { id: "l-title", name: "Title text", visible: true, opacity: 100, blendMode: "normal", locked: false },
];

export default function PhotoshopClient() {
  const [layers, setLayers] = useState<Layer[]>(INITIAL_LAYERS);
  const [activeLayerId, setActiveLayerId] = useState<string>("l-title");
  const [tool, setTool] = useState<PsTool>("brush");
  const [zoom, setZoom] = useState(0.5);
  const [fg, setFg] = useState("#f17e2c");
  const [bg, setBg] = useState("#ffffff");
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<{ label: string; active: boolean }[]>([
    { label: "Open", active: true },
  ]);
  const [thumbBust, setThumbBust] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [colorPickerTarget, setColorPickerTarget] = useState<"fg" | "bg" | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Brush options
  const [brushSize, setBrushSize] = useState(40);
  const [brushHardness, setBrushHardness] = useState(80);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [brushFlow, setBrushFlow] = useState(100);
  const [fontSize, setFontSize] = useState(64);

  // Layer canvases — kept outside React state because they're imperative
  const layerCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Make sure every layer has a canvas
  useEffect(() => {
    const map = layerCanvasesRef.current;
    layers.forEach((l) => {
      if (!map.has(l.id)) {
        const c = document.createElement("canvas");
        c.width = DOC_W;
        c.height = DOC_H;
        map.set(l.id, c);
      }
    });
    // Optional: prune deleted layers (not strictly required for memory in vibe v1)
    Array.from(map.keys()).forEach((id) => {
      if (!layers.find((l) => l.id === id)) map.delete(id);
    });
  }, [layers]);

  // Toast auto-hide
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  // Keybindings
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      const map: Record<string, PsTool> = {
        v: "move",
        m: "marquee",
        l: "lasso",
        w: "wand",
        c: "crop",
        i: "eyedropper",
        j: "heal",
        b: "brush",
        s: "clone",
        e: "eraser",
        g: "bucket",
        r: "blur",
        o: "dodge",
        p: "pen",
        t: "type",
        u: "rectangle",
        h: "hand",
        z: "zoom",
      };
      if (map[k]) {
        setTool(map[k]);
        return;
      }
      if (k === "x") {
        setFg(bg);
        setBg(fg);
        return;
      }
      if (k === "d") {
        setFg("#000000");
        setBg("#ffffff");
        return;
      }
      if (k === "[") {
        setBrushSize((s) => Math.max(1, s - 4));
      } else if (k === "]") {
        setBrushSize((s) => Math.min(500, s + 4));
      }
      if ((e.metaKey || e.ctrlKey) && k === "=") {
        e.preventDefault();
        setZoom((z) => Math.min(8, z * 1.25));
      } else if ((e.metaKey || e.ctrlKey) && k === "-") {
        e.preventDefault();
        setZoom((z) => Math.max(0.05, z / 1.25));
      } else if ((e.metaKey || e.ctrlKey) && k === "0") {
        e.preventDefault();
        setZoom(0.5);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fg, bg]);

  // Layer thumbnail data URLs (regen on bust)
  const thumbnailGetter = useMemo(() => {
    return (layerId: string): string | null => {
      const c = layerCanvasesRef.current.get(layerId);
      if (!c) return null;
      try {
        return c.toDataURL();
      } catch {
        return null;
      }
    };
  }, [thumbBust, layers]);

  const addHistory = (label: string) => {
    setHistory((h) => [
      ...h.map((it) => ({ ...it, active: false })),
      { label, active: true },
    ]);
  };

  const handleAddLayer = () => {
    const id = `l-${Date.now().toString(36)}`;
    const newLayer: Layer = {
      id,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      opacity: 100,
      blendMode: "normal",
      locked: false,
    };
    setLayers((ls) => [...ls, newLayer]);
    setActiveLayerId(id);
    addHistory("New Layer");
  };

  const handleAddGroup = () => {
    setToast("Groups are stubbed in this demo");
  };

  const handleDeleteLayer = (id: string) => {
    if (layers.length <= 1) {
      setToast("Cannot delete the last remaining layer");
      return;
    }
    const idx = layers.findIndex((l) => l.id === id);
    setLayers((ls) => ls.filter((l) => l.id !== id));
    if (activeLayerId === id) {
      setActiveLayerId(layers[Math.max(0, idx - 1)].id);
    }
    addHistory("Delete Layer");
  };

  const handleDuplicateLayer = (id: string) => {
    const orig = layers.find((l) => l.id === id);
    if (!orig) return;
    const newId = `${id}-copy-${Date.now().toString(36)}`;
    setLayers((ls) => {
      const idx = ls.findIndex((l) => l.id === id);
      const copy: Layer = { ...orig, id: newId, name: `${orig.name} copy` };
      return [...ls.slice(0, idx + 1), copy, ...ls.slice(idx + 1)];
    });
    // Clone canvas pixels
    requestAnimationFrame(() => {
      const src = layerCanvasesRef.current.get(id);
      const c = document.createElement("canvas");
      c.width = DOC_W;
      c.height = DOC_H;
      if (src) c.getContext("2d")!.drawImage(src, 0, 0);
      layerCanvasesRef.current.set(newId, c);
      setThumbBust((n) => n + 1);
    });
    setActiveLayerId(newId);
    addHistory("Duplicate Layer");
  };

  const handleToggleVisibility = (id: string) => {
    setLayers((ls) =>
      ls.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };

  const handleSetOpacity = (id: string, opacity: number) => {
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, opacity } : l)));
  };

  const handleSetBlendMode = (id: string, blendMode: BlendMode) => {
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, blendMode } : l)));
  };

  const handlePickFg = () => {
    setColorPickerTarget("fg");
    requestAnimationFrame(() => colorInputRef.current?.click());
  };
  const handlePickBg = () => {
    setColorPickerTarget("bg");
    requestAnimationFrame(() => colorInputRef.current?.click());
  };

  const handleColorChange = (hex: string) => {
    if (colorPickerTarget === "bg") setBg(hex);
    else setFg(hex);
    setColorPickerTarget(null);
  };

  return (
    <div
      className="h-full w-full flex flex-col"
      style={{ background: "var(--ps-bg)" }}
    >
      <MenuBar docName={DOC_NAME} onExport={() => setToast("Demo only — export not wired up.")} />
      <OptionsBar
        tool={tool}
        brushSize={brushSize}
        brushHardness={brushHardness}
        brushOpacity={brushOpacity}
        brushFlow={brushFlow}
        shapeFill={fg}
        fontSize={fontSize}
        onChange={(p) => {
          if (p.brushSize !== undefined) setBrushSize(p.brushSize);
          if (p.brushHardness !== undefined) setBrushHardness(p.brushHardness);
          if (p.brushOpacity !== undefined) setBrushOpacity(p.brushOpacity);
          if (p.brushFlow !== undefined) setBrushFlow(p.brushFlow);
          if (p.fontSize !== undefined) setFontSize(p.fontSize);
        }}
      />

      <div className="flex-1 min-h-0 flex">
        <Toolbox
          selectedTool={tool}
          onSelectTool={setTool}
          fg={fg}
          bg={bg}
          onSwap={() => {
            setFg(bg);
            setBg(fg);
          }}
          onPickFg={handlePickFg}
          onPickBg={handlePickBg}
          onResetColors={() => {
            setFg("#000000");
            setBg("#ffffff");
          }}
        />

        <Canvas
          docW={DOC_W}
          docH={DOC_H}
          zoom={zoom}
          layers={layers}
          activeLayerId={activeLayerId}
          layerCanvases={layerCanvasesRef.current}
          fg={fg}
          tool={tool}
          brush={{
            size: brushSize,
            hardness: brushHardness,
            opacity: brushOpacity,
            flow: brushFlow,
          }}
          fontSize={fontSize}
          onSeedThumbnails={() => setThumbBust((n) => n + 1)}
          onCursorChange={setCursor}
          onPickColor={(hex) => setFg(hex)}
          onAddHistory={addHistory}
        />

        {/* Right rail */}
        <div
          className="flex flex-col"
          style={{
            width: 280,
            borderLeft: "1px solid var(--ps-border)",
            background: "var(--ps-bg)",
          }}
        >
          <div style={{ flex: "0 0 auto" }}>
            <ColorPanel fg={fg} onSwatch={(hex) => setFg(hex)} />
          </div>
          <div style={{ flex: "1 1 50%", minHeight: 0, borderTop: "1px solid var(--ps-border)" }}>
            <LayersPanel
              layers={layers}
              activeLayerId={activeLayerId}
              thumbnailGetter={thumbnailGetter}
              onSelect={setActiveLayerId}
              onToggleVisibility={handleToggleVisibility}
              onAddLayer={handleAddLayer}
              onDeleteLayer={handleDeleteLayer}
              onDuplicateLayer={handleDuplicateLayer}
              onAddGroup={handleAddGroup}
              onSetOpacity={handleSetOpacity}
              onSetBlendMode={handleSetBlendMode}
            />
          </div>
          <div
            style={{
              flex: "0 0 160px",
              minHeight: 0,
              borderTop: "1px solid var(--ps-border)",
            }}
          >
            <HistoryPanel history={history} />
          </div>
        </div>
      </div>

      <StatusBar
        zoom={zoom}
        docW={DOC_W}
        docH={DOC_H}
        tool={tool}
        cursor={cursor}
        layerCount={layers.length}
      />

      {/* Hidden color input for native picker */}
      <input
        ref={colorInputRef}
        type="color"
        className="absolute opacity-0 pointer-events-none"
        value={colorPickerTarget === "bg" ? normalizeHex(bg) : normalizeHex(fg)}
        onChange={(e) => handleColorChange(e.target.value)}
      />

      {/* Toast */}
      {toast && (
        <div
          className="absolute left-1/2 bottom-10 -translate-x-1/2 px-4 py-2 rounded-md shadow-lg pointer-events-none"
          style={{
            background: "rgba(20,20,20,0.95)",
            color: "var(--ps-text-bright)",
            border: "1px solid var(--ps-accent-blue)",
            fontSize: 12,
            zIndex: 100,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function normalizeHex(hex: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#000000";
}
