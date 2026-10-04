"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/admin/ui/Toast";
import { paymentLinkFor } from "@/lib/booking";
import { isUpcoming, needsAttention, paymentSummary } from "@/lib/payments/bookingView";
import type { Booking, CalStatus } from "@/lib/payments/types";

type ServiceRef = { slug: string; name: string; payment_url: string | null };
type Tab = "attention" | "upcoming" | "all";

const TABS: { key: Tab; label: string }[] = [
  { key: "attention", label: "Needs attention" },
  { key: "upcoming", label: "Upcoming" },
  { key: "all", label: "All" },
];

const CAL_BADGE: Record<CalStatus, string> = {
  pending: "bg-amber-50 text-amber-800",
  accepted: "bg-green-50 text-green-800",
  rejected: "bg-red-50 text-red-800",
  cancelled: "bg-[#f5f3ef] text-[#6b6560]",
};

const btn =
  "text-xs font-medium px-3 py-1.5 rounded-lg border border-[#e8e5df] hover:bg-[#f5f3ef] transition-colors disabled:opacity-50";

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BookingsListClient({
  bookings,
  services,
}: {
  bookings: Booking[];
  services: ServiceRef[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("attention");
  const [busy, setBusy] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [linkTarget, setLinkTarget] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

  const serviceBySlug = useMemo(
    () => new Map(services.map((s) => [s.slug, s])),
    [services]
  );

  const visible = bookings.filter((b) =>
    tab === "attention" ? needsAttention(b) : tab === "upcoming" ? isUpcoming(b) : true
  );

  // Unpaid Cal bookings an unmatched payment can be linked to.
  const linkable = bookings.filter(
    (b) => b.cal_uid && b.payment_status === "unpaid" && b.cal_status === "pending"
  );

  async function act(id: string, body: Record<string, unknown>, success: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ message: json.error ?? "Action failed", type: "error" });
        return;
      }
      const updated = json.booking as Booking | undefined;
      setToast(
        updated?.confirm_error
          ? { message: `Saved, but Cal confirm failed: ${updated.confirm_error}`, type: "error" }
          : { message: success, type: "success" }
      );
      setNoteFor(null);
      setNote("");
      router.refresh();
    } catch {
      setToast({ message: "Network error — please try again", type: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function copyPaymentLink(b: Booking) {
    const url = b.service_slug ? serviceBySlug.get(b.service_slug)?.payment_url : null;
    if (!url || !b.cal_uid) {
      setToast({ message: "This service has no payment link set", type: "error" });
      return;
    }
    try {
      await navigator.clipboard.writeText(paymentLinkFor(url, b.cal_uid));
      setToast({ message: "Payment link copied", type: "success" });
    } catch {
      setToast({ message: "Could not copy the payment link — check the service's payment URL", type: "error" });
    }
  }

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <div className="flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              tab === t.key
                ? "bg-[#1a1a18] text-white"
                : "text-[#6b6560] hover:bg-[#f5f3ef]"
            }`}
          >
            {t.label}
            {t.key === "attention" && ` (${bookings.filter(needsAttention).length})`}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="bg-white border border-[#e8e5df] rounded-xl p-8 text-center text-[#6b6560]">
          Nothing here.
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((b) => {
            const unmatched = b.cal_uid === null;
            const service = b.service_slug ? serviceBySlug.get(b.service_slug) : undefined;
            const isBusy = busy === b.id;

            return (
              <li key={b.id} className="bg-white border border-[#e8e5df] rounded-xl p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#1a1a18]">
                      {b.attendee_name ?? "Unknown client"}
                      <span className="text-[#6b6560] font-normal"> · {b.attendee_email ?? "no email"}</span>
                    </p>
                    <p className="text-sm text-[#6b6560]">
                      {unmatched
                        ? "Stripe payment not linked to a booking"
                        : `${service?.name ?? b.service_slug ?? "Unknown service"} · ${formatWhen(b.start_time)}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {!unmatched && (
                      <span className={`px-2 py-0.5 rounded-full ${CAL_BADGE[b.cal_status]}`}>
                        Cal: {b.cal_status}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        b.payment_status === "unpaid" ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-800"
                      }`}
                    >
                      {paymentSummary(b)}
                    </span>
                  </div>
                </div>

                {b.payment_status !== "unpaid" &&
                  (b.cal_status === "rejected" || b.cal_status === "cancelled") && (
                    <p className="text-xs text-red-700">
                      Paid but booking is {b.cal_status} — refund in Stripe if needed.
                    </p>
                  )}

                {b.confirm_error && (
                  <p className="text-xs text-red-700">Cal confirm failed: {b.confirm_error}</p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {!unmatched && b.payment_status === "unpaid" && b.cal_status === "pending" && (
                    <>
                      <button className={btn} disabled={isBusy} onClick={() => setNoteFor(noteFor === b.id ? null : b.id)}>
                        Mark paid manually
                      </button>
                      <button className={btn} disabled={isBusy} onClick={() => copyPaymentLink(b)}>
                        Copy payment link
                      </button>
                    </>
                  )}
                  {!unmatched && b.payment_status !== "unpaid" && b.cal_status === "pending" && (
                    <button className={btn} disabled={isBusy} onClick={() => act(b.id, { action: "confirm" }, "Booking confirmed")}>
                      Confirm in Cal
                    </button>
                  )}
                  {!unmatched && b.cal_status === "pending" && (
                    <button
                      className={`${btn} text-red-700`}
                      disabled={isBusy}
                      onClick={() => {
                        if (!window.confirm("Decline this booking in Cal.com? The client is notified and the slot is freed.")) return;
                        act(b.id, { action: "decline", reason: "Payment not received" }, "Booking declined");
                      }}
                    >
                      Decline
                    </button>
                  )}
                  {unmatched && (
                    <>
                      <select
                        className="text-xs border border-[#e8e5df] rounded-lg px-2 py-1.5 bg-white"
                        value={linkTarget[b.id] ?? ""}
                        onChange={(e) => setLinkTarget((m) => ({ ...m, [b.id]: e.target.value }))}
                      >
                        <option value="">Link to booking…</option>
                        {linkable.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.attendee_name ?? t.attendee_email ?? "Unknown"} · {formatWhen(t.start_time)}
                          </option>
                        ))}
                      </select>
                      <button
                        className={btn}
                        disabled={isBusy || !linkTarget[b.id]}
                        onClick={() => act(b.id, { action: "link", bookingId: linkTarget[b.id] }, "Payment linked")}
                      >
                        Link
                      </button>
                    </>
                  )}
                </div>

                {noteFor === b.id && (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      autoFocus
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="How was it paid? e.g. bank transfer"
                      className="text-sm border border-[#e8e5df] rounded-lg px-3 py-1.5 flex-1 min-w-[200px]"
                    />
                    <button
                      className={btn}
                      disabled={isBusy || !note.trim()}
                      onClick={() => act(b.id, { action: "mark_paid", note }, "Marked paid and confirmed")}
                    >
                      Save
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
