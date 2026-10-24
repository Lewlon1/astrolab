"use client";

import Link from "next/link";
import type { ActionItem } from "@/types";

const TIER_META: Record<
  number,
  { label: string; bg: string; text: string; bar: string }
> = {
  1: { label: "Conversion", bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
  2: { label: "Ritual", bg: "bg-indigo-50", text: "text-indigo-700", bar: "bg-indigo-500" },
  3: { label: "Engagement", bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500" },
  4: { label: "Maintenance", bg: "bg-slate-100", text: "text-slate-600", bar: "bg-slate-400" },
};

/** One Daily Actions item with Open / Skip / Done. Used by Lead Queue and the admin home screen. */
export default function ActionCard({
  item,
  busy,
  onResolve,
}: {
  item: ActionItem;
  busy: boolean;
  onResolve: (id: string, status: "done" | "skipped") => void;
}) {
  const tier = TIER_META[item.tier] ?? TIER_META[4];
  const isInternal = item.link?.startsWith("/");

  return (
    <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden flex">
      <div className={`w-1 shrink-0 ${tier.bar}`} />

      <div className="flex-1 p-5 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${tier.bg} ${tier.text}`}
              >
                {tier.label}
              </span>
              <span className="text-[11px] text-[#b8b0a4]">
                {item.est_minutes} min
              </span>
            </div>

            <p className="text-sm font-medium text-[#1a1a18]">{item.title}</p>

            {item.reason && (
              <p className="text-sm text-[#6b6560] mt-1 leading-relaxed">
                {item.reason}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-end">
            {item.link &&
              (isInternal ? (
                <Link
                  href={item.link}
                  className="text-sm text-[#6b6560] hover:text-[#1a1a18] hover:bg-[#f5f3ef] px-3 py-2 rounded-lg transition-colors"
                >
                  Open &rarr;
                </Link>
              ) : (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#6b6560] hover:text-[#1a1a18] hover:bg-[#f5f3ef] px-3 py-2 rounded-lg transition-colors"
                >
                  Open &rarr;
                </a>
              ))}

            <button
              onClick={() => onResolve(item.id, "skipped")}
              disabled={busy}
              className="text-sm text-[#6b6560] hover:text-[#1a1a18] px-3 py-2 rounded-lg hover:bg-[#f5f3ef] transition-colors disabled:opacity-40"
            >
              Skip
            </button>
            <button
              onClick={() => onResolve(item.id, "done")}
              disabled={busy}
              className="text-sm font-medium bg-deep text-white px-4 py-2 rounded-lg hover:bg-deep/90 transition-colors disabled:opacity-40"
            >
              {busy ? "…" : "Done"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
