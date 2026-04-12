"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Event } from "@/types";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import Toast from "@/components/admin/ui/Toast";

const EVENT_TYPE_BADGES: Record<string, string> = {
  workshop: "bg-blue-50 text-blue-700",
  cosmic_tasters: "bg-purple-50 text-purple-700",
  collab: "bg-cyan-50 text-cyan-700",
  popup: "bg-orange-50 text-orange-700",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  workshop: "Workshop",
  cosmic_tasters: "Cosmic Tasters",
  collab: "Collab",
  popup: "Pop-up",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function EventsListClient({ events }: { events: Event[] }) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", deleteTarget.id);

    setDeleteLoading(false);
    setDeleteTarget(null);

    if (error) {
      setToast({ message: "Failed to delete event", type: "error" });
    } else {
      setToast({ message: "Event deleted", type: "success" });
      router.refresh();
    }
  }

  if (events.length === 0) {
    return (
      <div className="bg-white border border-[#e8e5df] rounded-xl p-12 text-center">
        <p className="text-[#6b6560]">No events yet.</p>
        <Link
          href="/admin/events/new"
          className="inline-block mt-4 text-sm font-medium text-deep hover:underline"
        >
          Create your first event
        </Link>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8e5df] text-left text-[#6b6560]">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Published</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr
                key={event.id}
                className="border-b border-[#e8e5df] last:border-0 hover:bg-[#fafaf8] transition-colors"
              >
                <td className="px-4 py-3 font-medium text-[#1a1a18]">
                  {event.title}
                </td>
                <td className="px-4 py-3">
                  {event.event_type ? (
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${EVENT_TYPE_BADGES[event.event_type] ?? ""}`}
                    >
                      {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
                    </span>
                  ) : (
                    <span className="text-[#b8b0a4]">--</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[#6b6560]">
                  {event.date ? formatDate(event.date) : "--"}
                </td>
                <td className="px-4 py-3 text-[#6b6560]">
                  {event.location ?? "--"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      event.is_published ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="text-sm text-deep hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(event)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete event"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
