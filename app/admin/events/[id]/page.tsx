import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Event } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import EventForm from "@/components/admin/EventForm";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single<Event>();

  if (!event) notFound();

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Edit Event" />
      <EventForm initialData={event} />
    </div>
  );
}
