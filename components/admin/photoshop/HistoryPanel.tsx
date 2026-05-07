"use client";

interface HistoryItem {
  label: string;
  active: boolean;
}

export default function HistoryPanel({ history }: { history: HistoryItem[] }) {
  return (
    <div className="flex flex-col h-full" style={{ background: "var(--ps-panel)" }}>
      <div className="flex" style={{ borderBottom: "1px solid var(--ps-border)" }}>
        <span className="ps-tab is-active">History</span>
        <span className="ps-tab">Actions</span>
        <div className="flex-1" style={{ borderBottom: "1px solid var(--ps-border)" }} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div
            className="px-2 py-3"
            style={{ color: "var(--ps-text-dim)", fontSize: 11 }}
          >
            No history yet — start drawing, applying filters, or making selections.
          </div>
        ) : (
          history.map((h, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-2 py-1"
              style={{
                background: h.active ? "var(--ps-active)" : undefined,
                color: h.active ? "var(--ps-text-bright)" : "var(--ps-text)",
                borderBottom: "1px solid #1a1a1a",
              }}
            >
              <div
                className="w-3 h-3 flex items-center justify-center rounded-sm"
                style={{
                  background: h.active ? "var(--ps-accent-blue)" : "transparent",
                  border: h.active ? "none" : "1px solid var(--ps-border-soft)",
                  fontSize: 9,
                }}
              >
                {h.active ? "▶" : ""}
              </div>
              <span className="truncate flex-1">{h.label}</span>
            </div>
          ))
        )}
      </div>
      <div
        className="flex items-center justify-end gap-1 px-1 py-1 border-t"
        style={{ borderColor: "var(--ps-border)", background: "var(--ps-toolbar)" }}
      >
        <button className="ps-tool-btn" style={{ width: 22, height: 22 }} title="Step backward">
          ↶
        </button>
        <button className="ps-tool-btn" style={{ width: 22, height: 22 }} title="Step forward">
          ↷
        </button>
        <button className="ps-tool-btn" style={{ width: 22, height: 22 }} title="Create snapshot">
          ◉
        </button>
      </div>
    </div>
  );
}
