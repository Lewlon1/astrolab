import { createClient } from "@/lib/supabase/server";
import { Event } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import EventsListClient from "@/components/admin/EventsListClient";

export default async function EventsPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: false })
    .returns<Event[]>();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Events"
        action={{ label: "Create event", href: "/admin/events/new" }}
      />
      <EventsListClient events={events ?? []} />
    </div>
  );
}
