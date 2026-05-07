"use client";

const MENUS = [
  "File",
  "Edit",
  "Image",
  "Layer",
  "Type",
  "Select",
  "Filter",
  "3D",
  "View",
  "Plugins",
  "Window",
  "Help",
];

export default function MenuBar({
  onExport,
  docName,
}: {
  onExport: () => void;
  docName: string;
}) {
  return (
    <div
      className="flex items-center justify-between border-b"
      style={{
        height: 26,
        background: "var(--ps-toolbar)",
        borderColor: "var(--ps-border)",
      }}
    >
      <div className="flex items-center h-full">
        <div
          className="flex items-center gap-1.5 px-3 h-full border-r"
          style={{ borderColor: "var(--ps-border)" }}
        >
          <div
            className="w-3.5 h-3.5 flex items-center justify-center rounded-sm"
            style={{
              background: "linear-gradient(135deg, #001e36 0%, #31a8ff 100%)",
              fontSize: 8,
              fontWeight: 800,
              color: "#001e36",
              letterSpacing: "-0.5px",
            }}
          >
            Ps
          </div>
          <span style={{ color: "var(--ps-text-bright)", fontWeight: 600 }}>
            {docName}
          </span>
        </div>
        {MENUS.map((m) => (
          <button
            key={m}
            className="h-full px-2.5 hover:bg-[var(--ps-panel-hover)] transition-colors"
          >
            {m}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 pr-2">
        <span
          className="px-2 py-0.5"
          style={{ color: "var(--ps-text-dim)", fontSize: 10 }}
        >
          Essentials
        </span>
        <span
          className="px-2 py-0.5"
          style={{ color: "var(--ps-text-dim)", fontSize: 10 }}
        >
          Painting
        </span>
        <span
          className="px-2 py-0.5"
          style={{ color: "var(--ps-text-dim)", fontSize: 10 }}
        >
          Photography
        </span>
        <button
          onClick={onExport}
          title="Quick Export as PNG (Cmd/Ctrl+S)"
          className="ml-2 px-3 py-0.5 rounded-sm"
          style={{
            background: "var(--ps-accent-blue)",
            color: "white",
            fontWeight: 500,
          }}
        >
          Save PNG
        </button>
      </div>
    </div>
  );
}
