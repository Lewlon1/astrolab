"use client";

import { useRef } from "react";
import type { MediaItem } from "./types";
import { framesToShort } from "./utils";
import { ImportIcon, SearchIcon, VideoIcon, AudioIcon } from "./Icons";

export default function MediaBin({
  items,
  selectedId,
  onSelect,
  onDoubleClick,
  onDragStart,
  onImport,
}: {
  items: MediaItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDoubleClick: (id: string) => void;
  onDragStart: (id: string, e: React.DragEvent) => void;
  onImport: (files: FileList) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "var(--pp-panel)",
        borderRight: "1px solid var(--pp-border)",
      }}
    >
      {/* Tab strip */}
      <div
        className="flex items-center"
        style={{
          height: 22,
          background: "var(--pp-toolbar)",
          borderBottom: "1px solid var(--pp-border)",
        }}
      >
        <span className="pp-panel-tab is-active">Project: Astropsyche</span>
        <span className="pp-panel-tab">Media Browser</span>
        <span className="pp-panel-tab">Libraries</span>
        <span className="pp-panel-tab">Info</span>
      </div>

      {/* Search + actions */}
      <div
        className="flex items-center gap-2 px-2 py-1.5 border-b"
        style={{ borderColor: "var(--pp-border)" }}
      >
        <div
          className="flex items-center gap-1 flex-1 px-1.5 py-0.5 rounded-sm"
          style={{
            background: "var(--pp-bg)",
            border: "1px solid var(--pp-border-soft)",
          }}
        >
          <span style={{ color: "var(--pp-text-dim)" }}>
            <SearchIcon />
          </span>
          <input
            placeholder="Search project..."
            className="bg-transparent flex-1 outline-none"
            style={{ color: "var(--pp-text)", fontSize: 11 }}
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="video/*,audio/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onImport(e.target.files);
              e.target.value = "";
            }
          }}
        />
        <button
          className="pp-btn"
          onClick={() => fileRef.current?.click()}
          title="Import media"
        >
          <ImportIcon />
          Import
        </button>
      </div>

      {/* Column headers */}
      <div
        className="flex items-center px-2 py-1 border-b"
        style={{
          color: "var(--pp-text-dim)",
          background: "var(--pp-bg)",
          borderColor: "var(--pp-border)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        <div style={{ width: 22 }} />
        <div style={{ flex: 1 }}>Name</div>
        <div style={{ width: 60 }}>Type</div>
        <div style={{ width: 50 }}>FPS</div>
        <div style={{ width: 70, textAlign: "right" }}>Duration</div>
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto">
        {items.map((item) => {
          const selected = item.id === selectedId;
          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => onDragStart(item.id, e)}
              onClick={() => onSelect(item.id)}
              onDoubleClick={() => onDoubleClick(item.id)}
              className="flex items-center px-2 py-1 cursor-grab active:cursor-grabbing"
              style={{
                background: selected ? "var(--pp-accent-blue)" : undefined,
                color: selected ? "white" : "var(--pp-text)",
                borderBottom: "1px solid #232323",
              }}
            >
              {/* Thumbnail / type icon */}
              <div
                className="rounded-sm flex items-center justify-center"
                style={{
                  width: 18,
                  height: 14,
                  background: item.thumb,
                  marginRight: 6,
                  flexShrink: 0,
                }}
              />
              <div
                className="truncate flex items-center gap-1.5"
                style={{ flex: 1 }}
              >
                <span style={{ color: selected ? "white" : "var(--pp-text-dim)" }}>
                  {item.type === "video" ? <VideoIcon /> : <AudioIcon />}
                </span>
                <span className="truncate">{item.name}</span>
              </div>
              <div style={{ width: 60, color: selected ? "rgba(255,255,255,0.85)" : "var(--pp-text-dim)" }}>
                {item.type === "video" ? item.aspect : "Audio"}
              </div>
              <div style={{ width: 50, color: selected ? "rgba(255,255,255,0.85)" : "var(--pp-text-dim)" }}>
                {item.fps}
              </div>
              <div
                className="font-mono"
                style={{
                  width: 70,
                  textAlign: "right",
                  color: selected ? "white" : "var(--pp-text)",
                }}
              >
                {framesToShort(item.durationFrames)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="px-2 py-1 border-t flex items-center justify-between"
        style={{
          borderColor: "var(--pp-border)",
          color: "var(--pp-text-dim)",
          background: "var(--pp-toolbar)",
          fontSize: 10,
        }}
      >
        <span>{items.length} items</span>
        <span>List View</span>
      </div>
    </div>
  );
}
