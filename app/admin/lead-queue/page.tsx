import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import LeadQueueClient from "@/components/admin/lead-queue/LeadQueueClient";

export const dynamic = "force-dynamic";

export default function LeadQueuePage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Lead Queue"
        description="Ten prepared actions a day, ranked by what actually converts"
      />
      <LeadQueueClient />
    </div>
  );
}
