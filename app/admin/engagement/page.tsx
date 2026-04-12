import { createClient } from "@/lib/supabase/server";
import type { EngagementAccount } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import EngagementClient from "@/components/admin/EngagementClient";

export default async function EngagementPage() {
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from("engagement_accounts")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .returns<EngagementAccount[]>();

  return (
    <>
      <AdminPageHeader
        title="Engagement"
        description="Daily engagement list and comment reply assistant"
        action={{ label: "Manage accounts", href: "/admin/engagement/accounts" }}
      />
      <EngagementClient accounts={accounts || []} />
    </>
  );
}
