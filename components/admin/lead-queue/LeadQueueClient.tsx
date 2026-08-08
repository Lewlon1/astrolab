"use client";

import { useCallback, useState } from "react";
import Toast from "@/components/admin/ui/Toast";
import DailyActionsPanel from "./DailyActionsPanel";
import QueuePanel from "./QueuePanel";

type Tab = "actions" | "queue";

export interface ToastState {
  message: string;
  type: "success" | "error";
}

export default function LeadQueueClient() {
  const [tab, setTab] = useState<Tab>("actions");
  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "actions", label: "Daily actions" },
    { id: "queue", label: "Queue" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 border-b border-[#e8e5df]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-deep text-[#1a1a18]"
                : "border-transparent text-[#6b6560] hover:text-[#1a1a18]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "actions" ? (
        <DailyActionsPanel notify={notify} />
      ) : (
        <QueuePanel notify={notify} />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
