import { createClient } from "@/lib/supabase/server";
import type { EngagementAccount } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import EngagementClient from "@/components/admin/EngagementClient";
import { getOrCreateTodayBatch } from "@/lib/dailyActions";
import { engagementTasks } from "@/lib/admin/today";

export const dynamic = "force-dynamic";

export default async function EngagementPage() {
  const supabase = await createClient();

  // Today's list is the Daily Actions Tier 3 batch — the same items the admin
  // home screen shows, so "Done" in either place is the same record.
  const [batch, { data: accounts }] = await Promise.all([
    getOrCreateTodayBatch(supabase).catch(() => null),
    supabase
      .from("engagement_accounts")
      .select("*")
      .order("created_at", { ascending: true })
      .returns<EngagementAccount[]>(),
  ]);

  const activeCount = (accounts ?? []).filter((a) => a.is_active).length;

  return (
    <>
      <AdminPageHeader
        title="Engagement"
        description="Daily engagement list and comment reply assistant"
        action={{ label: "Manage accounts", href: "/admin/engagement/accounts" }}
      />
      <EngagementClient
        tasks={batch ? engagementTasks(batch.items, accounts ?? []) : null}
        activeCount={activeCount}
      />
    </>
  );
}
