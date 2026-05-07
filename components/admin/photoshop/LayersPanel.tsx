"use client";

import type { Layer, BlendMode } from "./types";
import { EyeIcon, PlusIcon, TrashIcon, FolderIcon, LockIcon, ChevronDownIcon } from "./PsIcons";

const BLEND_MODES: BlendMode[] = ["normal", "multiply", "screen", "overlay", "soft-light", "color-dodge"];

export default function LayersPanel({
  layers,
  activeLayerId,
  thumbnailGetter,
  onSelect,
  onToggleVisibility,
  onAddLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onAddGroup,
  onSetOpacity,
  onSetBlendMode,
}: {
  layers: Layer[];
  activeLayerId: string;
  thumbnailGetter: (layerId: string) => string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onAddGroup: () => void;
  onSetOpacity: (id: string, opacity: number) => void;
  onSetBlendMode: (id: string, mode: BlendMode) => void;
}) {
  const active = layers.find((l) => l.id === activeLayerId);

  // Layers display top-to-bottom = topmost first (reverse render order)
  const ordered = [...layers].reverse();

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--ps-panel)" }}
    >
      {/* Tabs */}
      <div className="flex" style={{ borderBottom: "1px solid var(--ps-border)" }}>
        <span className="ps-tab is-active">Layers</span>
        <span className="ps-tab">Channels</span>
        <span className="ps-tab">Paths</span>
        <div className="flex-1" style={{ borderBottom: "1px solid var(--ps-border)" }} />
      </div>

      {/* Filters */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 border-b"
        style={{ borderColor: "var(--ps-border)" }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            background: "var(--ps-bg)",
            border: "1px solid var(--ps-border-soft)",
            borderRadius: 2,
            height: 22,
            padding: "0 6px",
            width: 90,
          }}
        >
          <span>Kind</span>
          <ChevronDownIcon />
        </div>
        <button className="ps-tool-btn" style={{ width: 22, height: 22 }} title="Pixel layers">
          <span style={{ fontSize: 9 }}>◼</span>
        </button>
        <button className="ps-tool-btn" style={{ width: 22, height: 22 }} title="Adjustment">
          <span style={{ fontSize: 9 }}>◐</span>
        </button>
        <button className="ps-tool-btn" style={{ width: 22, height: 22 }} title="Type">
          <span style={{ fontSize: 9, fontWeight: 600 }}>T</span>
        </button>
        <button className="ps-tool-btn" style={{ width: 22, height: 22 }} title="Shape">
          <span style={{ fontSize: 9 }}>▢</span>
        </button>
        <button className="ps-tool-btn" style={{ width: 22, height: 22 }} title="Smart Object">
          <span style={{ fontSize: 9 }}>⬡</span>
        </button>
      </div>

      {/* Blend + opacity */}
      <div
        className="flex items-center gap-2 px-2 py-1.5 border-b"
        style={{ borderColor: "var(--ps-border)" }}
      >
        <div
          className="flex items-center justify-between flex-1"
          style={{
            background: "var(--ps-bg)",
            border: "1px solid var(--ps-border-soft)",
            borderRadius: 2,
            height: 22,
            padding: "0 6px",
          }}
        >
          <select
            value={active?.blendMode ?? "normal"}
            onChange={(e) =>
              active && onSetBlendMode(active.id, e.target.value as BlendMode)
            }
            className="bg-transparent outline-none flex-1 capitalize"
            style={{ color: "var(--ps-text)", appearance: "none" }}
          >
            {BLEND_MODES.map((m) => (
              <option key={m} value={m} style={{ background: "var(--ps-bg)" }}>
                {m.replace("-", " ")}
              </option>
            ))}
          </select>
          <ChevronDownIcon />
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: "var(--ps-text-dim)" }}>Opacity:</span>
          <input
            type="number"
            min={0}
            max={100}
            value={active?.opacity ?? 100}
            onChange={(e) =>
              active && onSetOpacity(active.id, parseInt(e.target.value) || 0)
            }
            className="ps-input font-mono"
            style={{ width: 42, fontSize: 11 }}
          />
          <span style={{ color: "var(--ps-text-dim)" }}>%</span>
        </div>
      </div>

      {/* Lock row */}
      <div
        className="flex items-center gap-2 px-2 py-1 border-b"
        style={{ borderColor: "var(--ps-border)", color: "var(--ps-text-dim)" }}
      >
        <span>Lock:</span>
        <button className="ps-tool-btn" style={{ width: 18, height: 18 }} title="Lock transparent pixels">
          <span style={{ fontSize: 9 }}>▦</span>
        </button>
        <button className="ps-tool-btn" style={{ width: 18, height: 18 }} title="Lock image pixels">
          <span style={{ fontSize: 9 }}>✏</span>
        </button>
        <button className="ps-tool-btn" style={{ width: 18, height: 18 }} title="Lock position">
          <span style={{ fontSize: 9 }}>⤧</span>
        </button>
        <button className="ps-tool-btn" style={{ width: 18, height: 18 }} title="Lock all">
          <LockIcon />
        </button>
        <div className="flex-1" />
        <span>Fill:</span>
        <span style={{ color: "var(--ps-text)" }}>100%</span>
      </div>

      {/* Layers list */}
      <div className="flex-1 overflow-y-auto">
        {ordered.map((layer) => {
          const isActive = layer.id === activeLayerId;
          const thumb = thumbnailGetter(layer.id);
          return (
            <div
              key={layer.id}
              onClick={() => onSelect(layer.id)}
              className="flex items-center gap-1.5 px-1.5 py-1"
              style={{
                background: isActive ? "var(--ps-active)" : undefined,
                borderBottom: "1px solid #1a1a1a",
                cursor: "pointer",
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
                className="ps-tool-btn"
                style={{ width: 18, height: 18 }}
                title={layer.visible ? "Hide layer" : "Show layer"}
              >
                <EyeIcon open={layer.visible} />
              </button>
              {/* Thumbnail */}
              <div
                className="ps-checker"
                style={{
                  width: 28,
                  height: 28,
                  border: "1px solid var(--ps-border-soft)",
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                {thumb && (
                  <img
                    src={thumb}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      imageRendering: "pixelated",
                    }}
                  />
                )}
              </div>
              <span
                className="truncate"
                style={{
                  flex: 1,
                  color: isActive ? "var(--ps-text-bright)" : "var(--ps-text)",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {layer.name}
              </span>
              {layer.locked && (
                <span style={{ color: "var(--ps-text-dim)" }}>
                  <LockIcon locked />
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer toolbar */}
      <div
        className="flex items-center gap-0.5 px-1 py-1 border-t"
        style={{ borderColor: "var(--ps-border)", background: "var(--ps-toolbar)" }}
      >
        <button className="ps-tool-btn" style={{ width: 22, height: 22 }} title="Link layers">
          <span style={{ fontSize: 11 }}>⛓</span>
        </button>
        <button className="ps-tool-btn" style={{ width: 22, height: 22 }} title="Add layer style">
          <span style={{ fontSize: 9, fontWeight: 700 }}>fx</span>
        </button>
        <button className="ps-tool-btn" style={{ width: 22, height: 22 }} title="Add layer mask">
          <span
            style={{
              fontSize: 8,
              border: "1px solid currentColor",
              padding: "1px 3px",
              background: "rgba(255,255,255,0.1)",
            }}
          >
            ◔
          </span>
        </button>
        <button className="ps-tool-btn" style={{ width: 22, height: 22 }} title="Adjustment layer">
          <span style={{ fontSize: 11 }}>◐</span>
        </button>
        <button
          onClick={onAddGroup}
          className="ps-tool-btn"
          style={{ width: 22, height: 22 }}
          title="New group"
        >
          <FolderIcon />
        </button>
        <button
          onClick={onAddLayer}
          className="ps-tool-btn"
          style={{ width: 22, height: 22 }}
          title="New layer"
        >
          <PlusIcon />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => active && onDuplicateLayer(active.id)}
          className="ps-tool-btn"
          style={{ width: 22, height: 22 }}
          title="Duplicate"
        >
          <span style={{ fontSize: 9 }}>⎘</span>
        </button>
        <button
          onClick={() => active && onDeleteLayer(active.id)}
          className="ps-tool-btn"
          style={{ width: 22, height: 22 }}
          title="Delete layer"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
