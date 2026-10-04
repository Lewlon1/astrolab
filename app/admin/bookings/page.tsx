import { createClient } from "@/lib/supabase/server";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import BookingsListClient from "@/components/admin/bookings/BookingsListClient";
import type { Booking } from "@/lib/payments/types";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const supabase = await createClient();

  const [{ data: bookings }, { data: services }] = await Promise.all([
    supabase
      .from("bookings")
      .select("*")
      .order("start_time", { ascending: true, nullsFirst: true })
      .returns<Booking[]>(),
    supabase
      .from("services")
      .select("slug, name, booking_url, payment_url")
      .returns<
        {
          slug: string;
          name: string;
          booking_url: string | null;
          payment_url: string | null;
        }[]
      >(),
  ]);

  const all = bookings ?? [];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Bookings"
        description="Pay-after-booking sessions: payment status and Cal.com confirmation."
      />
      <BookingsListClient bookings={all} services={services ?? []} />
    </div>
  );
}
