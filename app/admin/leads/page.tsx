import { createClient } from "@/lib/supabase/server";
import { Lead } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import LeadsListClient from "@/components/admin/LeadsListClient";

export default async function LeadsPage() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Lead[]>();

  const allLeads = leads ?? [];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Leads"
        description={`${allLeads.length} total lead${allLeads.length !== 1 ? "s" : ""}`}
      />
      <LeadsListClient leads={allLeads} />
    </div>
  );
}
