"use client";

import { useEffect, useState } from "react";
import type { ScoringWeight } from "@/types";

interface Props {
  config: ScoringWeight[];
  notify: (message: string, type: "success" | "error") => void;
  onSaved: () => void;
}

/**
 * Weights are config, not code. Saving here reorders the queue and every future
 * action batch on the next request — no redeploy, no re-sync.
 */
export default function ScoringConfigPanel({ config, notify, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(
      Object.fromEntries(config.map((c) => [c.key, String(c.value)]))
    );
  }, [config]);

  const dirty = config.some((c) => values[c.key] !== String(c.value));

  async function save() {
    setSaving(true);
    try {
      const weights: Record<string, number> = {};
      for (const c of config) {
        const n = Number(values[c.key]);
        if (!Number.isFinite(n)) throw new Error(`${c.label} must be a number`);
        if (n !== c.value) weights[c.key] = n;
      }

      if (Object.keys(weights).length === 0) {
        notify("Nothing changed", "success");
        return;
      }

      const res = await fetch("/api/admin/lead-queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not save weights");

      notify("Weights saved — queue reordered", "success");
      onSaved();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not save weights", "error");
    } finally {
      setSaving(false);
    }
  }

  if (config.length === 0) {
    return (
      <div className="bg-white border border-[#e8e5df] rounded-xl p-6">
        <h3 className="font-heading text-base text-[#1a1a18]">Scoring weights</h3>
        <p className="text-sm text-[#6b6560] mt-1">
          No config rows found. Run{" "}
          <code className="text-xs bg-[#f5f3ef] px-1.5 py-0.5 rounded">
            supabase/migrations/013_lead_queue_daily_actions.sql
          </code>{" "}
          in the Supabase dashboard — the engine is falling back to built-in
          defaults until then.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#f5f3ef] transition-colors"
      >
        <div className="text-left">
          <h3 className="font-heading text-base text-[#1a1a18]">
            Scoring weights
          </h3>
          <p className="text-xs text-[#6b6560] mt-0.5">
            Unvalidated rubric — expect to retune it against real data
          </p>
        </div>
        <span className="text-[#b8b0a4]">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-[#f0ede8] pt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {config.map((c) => (
              <div key={c.key}>
                <label
                  htmlFor={`w-${c.key}`}
                  className="block text-sm text-[#1a1a18]"
                >
                  {c.label}
                </label>
                {c.description && (
                  <p className="text-xs text-[#b8b0a4] mb-1.5">{c.description}</p>
                )}
                <input
                  id={`w-${c.key}`}
                  type="number"
                  value={values[c.key] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [c.key]: e.target.value }))
                  }
                  className="w-full text-sm border border-[#e8e5df] rounded-lg px-3 py-2 text-[#1a1a18] focus:outline-none focus:ring-1 focus:ring-deep"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="text-sm font-medium bg-deep text-white px-4 py-2.5 rounded-lg hover:bg-deep/90 transition-colors disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save weights"}
            </button>
            {dirty && (
              <span className="text-xs text-[#b8b0a4]">Unsaved changes</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
