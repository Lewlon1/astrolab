/**
 * Manual MailerLite sync: subscribers + activity → `leads` / `lead_events`.
 * Upserts keyed on lower-cased email. Never deletes.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  MailerLiteError,
  fetchActivityForMany,
  fetchAllSubscribers,
  languageFromSubscriber,
  nameFromFields,
  type MailerLiteSubscriber,
} from "@/lib/mailerlite";
import type { Lead, SyncReport } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** MailerLite activity type → lead_events type. Unmapped types are dropped. */
const ACTIVITY_TYPE_MAP: Record<string, string> = {
  opened: "opened",
  open: "opened",
  clicked: "clicked",
  click: "clicked",
  unsubscribed: "unsubscribed",
  unsubscribe: "unsubscribed",
};

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const report: SyncReport = {
    subscribersSeen: 0,
    created: 0,
    updated: 0,
    eventsInserted: 0,
    errors: [],
  };

  let subscribers: MailerLiteSubscriber[];
  try {
    subscribers = await fetchAllSubscribers();
  } catch (err) {
    const message =
      err instanceof MailerLiteError
        ? err.message
        : `Unexpected error: ${err instanceof Error ? err.message : String(err)}`;
    return NextResponse.json({ error: message }, { status: 502 });
  }

  report.subscribersSeen = subscribers.length;
  if (subscribers.length === 0) {
    return NextResponse.json({ report });
  }

  // Existing leads, so we can tell a create from an update and preserve the
  // stage Gabs has already set by hand.
  const { data: existingRows } = await supabase
    .from("leads")
    .select("id, email, status, source")
    .returns<Pick<Lead, "id" | "email" | "status" | "source">[]>();

  const existing = new Map(
    (existingRows ?? []).map((l) => [l.email.toLowerCase(), l])
  );

  const now = new Date().toISOString();

  for (const sub of subscribers) {
    const prior = existing.get(sub.email);
    const unsubscribed = sub.status === "unsubscribed" || sub.status === "junk";

    const patch: Record<string, unknown> = {
      email: sub.email,
      mailerlite_id: sub.id,
      unsubscribed,
      subscribed_at: sub.subscribed_at ?? sub.created_at,
      last_activity_at: sub.updated_at ?? sub.created_at,
      last_synced_at: now,
      tags: sub.groups.map((g) => g.name),
    };

    const name = nameFromFields(sub.fields);
    if (name) patch.name = name;

    const language = languageFromSubscriber(sub);
    if (language) patch.language = language;

    if (prior) {
      // Never overwrite a manually-set stage or the original source.
      const { error } = await supabase
        .from("leads")
        .update(patch)
        .eq("id", prior.id);
      if (error) report.errors.push(`${sub.email}: ${error.message}`);
      else report.updated++;
    } else {
      const { error } = await supabase
        .from("leads")
        .insert({ ...patch, source: "mailerlite", status: "new" });
      if (error) report.errors.push(`${sub.email}: ${error.message}`);
      else report.created++;
    }
  }

  // Re-read to resolve ids for every synced subscriber.
  const { data: refreshed } = await supabase
    .from("leads")
    .select("id, email, mailerlite_id")
    .not("mailerlite_id", "is", null)
    .returns<{ id: string; email: string; mailerlite_id: string }[]>();

  const idByMailerLiteId = new Map(
    (refreshed ?? []).map((l) => [l.mailerlite_id, l.id])
  );

  // A `subscribed` event per lead, deduped so re-syncing cannot double-count.
  const subscribedRows = subscribers
    .map((sub) => {
      const leadId = idByMailerLiteId.get(sub.id);
      if (!leadId) return null;
      return {
        lead_id: leadId,
        type: "subscribed",
        source: "mailerlite",
        detail: { groups: sub.groups.map((g) => g.name), status: sub.status },
        occurred_at: sub.subscribed_at ?? sub.created_at ?? now,
        dedupe_key: `ml:subscribed:${sub.id}`,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (subscribedRows.length > 0) {
    const { error, count } = await supabase
      .from("lead_events")
      .upsert(subscribedRows, { onConflict: "dedupe_key", ignoreDuplicates: true, count: "exact" });
    if (error) report.errors.push(`events: ${error.message}`);
    else report.eventsInserted += count ?? 0;
  }

  // Per-subscriber activity is one request each, so it is capped to the most
  // engaged subscribers rather than the whole list — see lib/mailerlite.ts.
  const priorityIds = [...subscribers]
    .sort(
      (a, b) => b.clicks_count - a.clicks_count || b.opens_count - a.opens_count
    )
    .filter((s) => s.clicks_count > 0 || s.opens_count > 0)
    .map((s) => s.id);

  try {
    const activity = await fetchActivityForMany(priorityIds);
    const activityRows: Record<string, unknown>[] = [];

    for (const [mlId, items] of Array.from(activity.entries())) {
      const leadId = idByMailerLiteId.get(mlId);
      if (!leadId) continue;

      for (const item of items) {
        const type = ACTIVITY_TYPE_MAP[item.type];
        if (!type) continue;
        activityRows.push({
          lead_id: leadId,
          type,
          source: "mailerlite",
          detail: { campaign: item.campaignName, url: item.url },
          occurred_at: item.created_at ?? now,
          dedupe_key: `ml:activity:${item.id}`,
        });
      }
    }

    if (activityRows.length > 0) {
      const { error, count } = await supabase
        .from("lead_events")
        .upsert(activityRows, { onConflict: "dedupe_key", ignoreDuplicates: true, count: "exact" });
      if (error) report.errors.push(`activity: ${error.message}`);
      else report.eventsInserted += count ?? 0;
    }
  } catch (err) {
    // Subscribers are already saved at this point; activity is a bonus pass.
    report.errors.push(
      err instanceof MailerLiteError
        ? err.message
        : `Activity fetch failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return NextResponse.json({ report });
}
