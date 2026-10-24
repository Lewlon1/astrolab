import Link from "next/link";
import type { Booking } from "@/lib/payments/types";

function when(iso: string | null): string {
  if (!iso) return "No date";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function service(slug: string | null): string {
  if (!slug) return "Session";
  return slug.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Why a booking is in the list — mirrors needsAttention() in lib/payments/bookingView.ts. */
function reason(b: Booking): string {
  if (b.cal_uid === null) return "Unmatched payment";
  if (b.cal_status === "rejected" || b.cal_status === "cancelled") return "Refund?";
  return b.payment_status === "unpaid" ? "Unpaid" : "Confirm";
}

/** Bookings that need Gabs (same rule as the Bookings "Needs attention" tab). Renders nothing when empty. */
export default function GetPaidCard({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) return null;

  return (
    <section className="bg-white border border-amber-200 rounded-xl p-5">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="font-heading text-lg text-[#1a1a18]">
          Get paid · {bookings.length} {bookings.length === 1 ? "booking needs" : "bookings need"} you
        </h2>
        <Link href="/admin/bookings" className="text-sm text-deep underline shrink-0">
          Open
        </Link>
      </div>
      <ul className="divide-y divide-[#f0ede8]">
        {bookings.slice(0, 5).map((b) => (
          <li key={b.id}>
            <Link href="/admin/bookings" className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1a1a18] truncate">
                  {b.attendee_name || b.attendee_email || "Unknown client"}
                </p>
                <p className="text-xs text-[#6b6560] truncate">
                  {service(b.service_slug)} · {when(b.start_time)}
                </p>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 shrink-0">
                {reason(b)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {bookings.length > 5 && (
        <p className="text-xs text-[#b8b0a4] mt-2">+ {bookings.length - 5} more in Bookings</p>
      )}
    </section>
  );
}
