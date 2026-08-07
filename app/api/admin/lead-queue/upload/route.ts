/**
 * ManyChat CSV upload — merges by email, else by IG handle, and reports every
 * decision it made. Parsing and column detection live in lib/manychatCsv.ts.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  EMAIL_RE,
  cleanHandle,
  detectColumns,
  parseCsv,
} from "@/lib/manychatCsv";
import type { Lead, MergeReport } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const overrideRaw = form?.get("mapping");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No CSV file uploaded" }, { status: 400 });
  }

  const rows = parseCsv(await file.text());
  if (rows.length < 2) {
    return NextResponse.json(
      { error: "CSV has no data rows" },
      { status: 400 }
    );
  }

  const headers = rows[0].map((h) => h.trim());
  const detected = detectColumns(headers);

  // The UI may override detection once a human has seen the real headers.
  let mapping = detected.mapping;
  let unmapped = detected.unmapped;
  if (typeof overrideRaw === "string" && overrideRaw.trim()) {
    try {
      const override = JSON.parse(overrideRaw) as Record<string, string>;
      mapping = { ...mapping, ...override };
      unmapped = headers.filter((h) => !mapping[h]);
    } catch {
      return NextResponse.json({ error: "mapping is not valid JSON" }, { status: 400 });
    }
  }

  if (!Object.values(mapping).includes("email") && !Object.values(mapping).includes("ig_handle")) {
    return NextResponse.json(
      {
        error:
          "Could not find an email or Instagram handle column — there is nothing to merge on. Map one explicitly and retry.",
        headers,
        detectedMapping: mapping,
      },
      { status: 422 }
    );
  }

  const report: MergeReport = {
    totalRows: rows.length - 1,
    created: 0,
    mergedByEmail: 0,
    mergedByHandle: 0,
    skipped: [],
    unmappedColumns: unmapped,
    mappedColumns: mapping,
  };

  const { data: existingRows } = await supabase
    .from("leads")
    .select("id, email, ig_handle")
    .returns<Pick<Lead, "id" | "email" | "ig_handle">[]>();

  const byEmail = new Map<string, string>();
  const byHandle = new Map<string, string>();
  for (const l of existingRows ?? []) {
    if (l.email) byEmail.set(l.email.toLowerCase(), l.id);
    if (l.ig_handle) byHandle.set(l.ig_handle.toLowerCase(), l.id);
  }

  const now = new Date().toISOString();

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    const record: Record<string, string> = {};

    headers.forEach((header, idx) => {
      const field = mapping[header];
      if (field) record[field] = (cells[idx] ?? "").trim();
    });

    const email = record.email?.toLowerCase() ?? "";
    const handle = record.ig_handle ? cleanHandle(record.ig_handle) : null;
    const validEmail = email && EMAIL_RE.test(email) ? email : null;

    if (!validEmail && !handle) {
      report.skipped.push({
        row: i + 1,
        reason: email ? `Invalid email "${email}" and no IG handle` : "No email or IG handle",
      });
      continue;
    }

    // Merge by email first, then by handle — never create a duplicate.
    const existingId =
      (validEmail ? byEmail.get(validEmail) : undefined) ??
      (handle ? byHandle.get(handle.toLowerCase()) : undefined);

    const fullName = [record.name, record.last_name].filter(Boolean).join(" ").trim();

    const patch: Record<string, unknown> = { last_synced_at: now };
    if (validEmail) patch.email = validEmail;
    if (handle) patch.ig_handle = handle;
    if (fullName) patch.name = fullName;
    if (record.language) {
      patch.language = record.language.toLowerCase().startsWith("es") ? "es" : "en";
    }
    if (record.subscribed_at) patch.subscribed_at = record.subscribed_at;
    if (record.last_activity_at) patch.last_activity_at = record.last_activity_at;
    if (record.tags) {
      patch.tags = record.tags.split(/[,;|]/).map((t) => t.trim()).filter(Boolean);
    }

    if (existingId) {
      const { error } = await supabase.from("leads").update(patch).eq("id", existingId);
      if (error) {
        report.skipped.push({ row: i + 1, reason: error.message });
        continue;
      }
      if (validEmail && byEmail.has(validEmail)) report.mergedByEmail++;
      else report.mergedByHandle++;

      await supabase.from("lead_events").insert({
        lead_id: existingId,
        type: "csv_import",
        source: "manychat",
        detail: { merged: true, file: file.name },
        occurred_at: now,
        dedupe_key: `csv:${file.name}:${existingId}:${i}`,
      });
    } else {
      if (!validEmail) {
        // `leads.email` is NOT NULL, so a handle-only row cannot create one.
        report.skipped.push({
          row: i + 1,
          reason: `IG handle "${handle}" matched no existing lead and the row has no email to create one`,
        });
        continue;
      }

      const { data: inserted, error } = await supabase
        .from("leads")
        .insert({ ...patch, source: "manychat", status: "new" })
        .select("id")
        .single();

      if (error) {
        report.skipped.push({ row: i + 1, reason: error.message });
        continue;
      }

      report.created++;
      byEmail.set(validEmail, inserted.id);
      if (handle) byHandle.set(handle.toLowerCase(), inserted.id);

      await supabase.from("lead_events").insert({
        lead_id: inserted.id,
        type: "csv_import",
        source: "manychat",
        detail: { merged: false, file: file.name },
        occurred_at: now,
        dedupe_key: `csv:${file.name}:${inserted.id}:${i}`,
      });
    }
  }

  return NextResponse.json({ report });
}
