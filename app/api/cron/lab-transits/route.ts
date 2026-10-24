// GET /api/cron/lab-transits: monthly refresh (vercel.json) of each live Lab
// profile's next transit, synced to MailerLite for the monthly Lab note.
// Never logs emails or birth data: counts and error codes only.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorizedCron } from "@/lib/lab/cronAuth";
import { updateLabFields } from "@/lib/lab/mailerlite";
import { nextTransitFields, seasonsForChart } from "@/lib/lab/nextTransit";
import type { LabProfileRow } from "@/lib/lab/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PAGE_SIZE = 200;
/** MailerLite allows 120 requests a minute; ~600ms apart keeps us under it. */
const MAILERLITE_GAP_MS = 600;
/** Stop cleanly before maxDuration rather than being cut off mid-write. */
const BUDGET_MS = 280_000;

type Row = Pick<LabProfileRow, "id" | "email" | "positions">;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[lab] CRON_SECRET is not set");
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }
  if (!isAuthorizedCron(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  let processed = 0;
  let updated = 0;
  let mailerliteFailures = 0;
  let complete = true;
  let lastMailerlite = 0;

  try {
    const admin = createAdminClient();
    const now = new Date();
    let lastId: string | null = null;

    pages: for (;;) {
      // Keyset paging by id: stable while we update the rows we've read.
      let q = admin
        .from("lab_profiles")
        .select("id, email, positions")
        .is("deleted_at", null)
        .order("id", { ascending: true })
        .limit(PAGE_SIZE);
      if (lastId) q = q.gt("id", lastId);
      const page = await q;
      if (page.error) throw new Error(`profile page failed (code ${page.error.code})`);
      const rows = (page.data ?? []) as Row[];
      if (rows.length === 0) break;

      for (const row of rows) {
        if (Date.now() - startedAt > BUDGET_MS) {
          complete = false;
          break pages;
        }
        lastId = row.id;
        const chart = row.positions;
        if (!chart || typeof chart !== "object" || !("version" in chart) || !chart.version) continue;
        processed++;

        let fields;
        try {
          fields = nextTransitFields(seasonsForChart(chart, now));
        } catch (err) {
          console.error("[lab] cron transit computation failed:", err instanceof Error ? err.name : "error");
          continue;
        }

        const upd = await admin
          .from("lab_profiles")
          .update(fields)
          .eq("id", row.id)
          .is("deleted_at", null);
        if (upd.error) {
          console.error("[lab] cron profile update failed, code", upd.error.code);
          continue;
        }
        updated++;

        // MailerLite drops null fields, so there is nothing to send without a season.
        if (!fields.next_transit) continue;
        const wait = lastMailerlite + MAILERLITE_GAP_MS - Date.now();
        if (wait > 0) await sleep(wait);
        lastMailerlite = Date.now();
        const id = await updateLabFields(row.email, fields);
        if (!id) mailerliteFailures++;
      }

      if (rows.length < PAGE_SIZE) break;
    }
  } catch (err) {
    console.error("[lab] cron failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Cron run failed", processed, updated, mailerliteFailures }, { status: 500 });
  }

  if (!complete) console.warn("[lab] cron stopped at the time budget after", processed, "profiles");
  return NextResponse.json({ processed, updated, mailerliteFailures, complete });
}
