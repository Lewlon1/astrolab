import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import EventForm from "@/components/admin/EventForm";

export default function NewEventPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader title="Create Event" />
      <EventForm />
    </div>
  );
}
