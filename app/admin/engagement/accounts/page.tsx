import { createClient } from "@/lib/supabase/server";
import type { EngagementAccount } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import EngagementAccountsClient from "@/components/admin/EngagementAccountsClient";

export default async function EngagementAccountsPage() {
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from("engagement_accounts")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<EngagementAccount[]>();

  return (
    <>
      <AdminPageHeader
        title="Manage Accounts"
        description="Add, edit, and remove engagement accounts"
        action={{ label: "← Back to Engagement", href: "/admin/engagement" }}
      />
      <EngagementAccountsClient accounts={accounts || []} />
    </>
  );
}
