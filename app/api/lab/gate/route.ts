// POST /api/lab/gate: store the profile, send the magic link, sync MailerLite.
// Never logs the body, email or birth data. All lab_profiles writes use the service role.
import { NextResponse } from "next/server";
import { computeChart } from "@/lib/astro";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordLeadEvent } from "@/lib/lab/events";
import { upsertLabSubscriber } from "@/lib/lab/mailerlite";
import { nextTransitFields, seasonsForChart } from "@/lib/lab/nextTransit";
import { clientIp, gateLimiter } from "@/lib/lab/rateLimit";
import { toStoredChart } from "@/lib/lab/storedChart";
import { validateGate } from "@/lib/lab/validate";
import { badRequest, geocodeOrResponse, readJson } from "@/lib/lab/routeHelpers";
import { CONSENT_TEXT_VERSION } from "@/content/lab/privacy";
import { API, ERRORS, VALIDATION } from "@/content/lab/ui";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!gateLimiter.allow(clientIp(request.headers))) {
    return NextResponse.json({ error: VALIDATION.rateLimited }, { status: 429 });
  }
  const body = await readJson(request);
  if (body === undefined) return badRequest();

  const raw = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  if (raw.consent !== true || raw.consentVersion !== CONSENT_TEXT_VERSION) {
    return NextResponse.json({ field: "consent", error: ERRORS.consentMissing }, { status: 400 });
  }

  const v = validateGate(body);
  if (!v.ok) return NextResponse.json({ field: v.field, error: v.message }, { status: 400 });
  const input = v.value;

  const g = await geocodeOrResponse(input.place);
  if (!g.ok) return g.res;
  const { geo } = g;

  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    console.warn("[lab] NEXT_PUBLIC_SITE_URL is not set, using the request origin");
    siteUrl = new URL(request.url).origin;
  }
  siteUrl = siteUrl.replace(/\/+$/, "");

  try {
    const chart = computeChart({
      dateISO: input.date,
      timeHHMM: input.time,
      lat: geo.lat,
      lon: geo.lon,
      zone: geo.tz,
    });
    const stored = toStoredChart(chart);
    // Written only on the insert/update paths below, never to a claimed row.
    const transit = nextTransitFields(seasonsForChart(stored));
    const admin = createAdminClient();
    let justInserted = false;

    const fields = {
      card_drawn: input.card,
      birth_date: input.date,
      birth_time: input.time,
      birth_place_text: geo.displayName,
      lat: geo.lat,
      lon: geo.lon,
      tz: geo.tz,
      birth_utc: chart.birthUtc.toISOString(),
      positions: stored,
      next_transit: transit.next_transit,
      transit_peak_date: transit.transit_peak_date,
      src: input.src,
      consent_at: new Date().toISOString(),
      consent_text_version: CONSENT_TEXT_VERSION,
      updated_at: new Date().toISOString(),
    };

    // Find the live row by email (the unique index is partial, so do it by hand).
    const findLive = () =>
      admin
        .from("lab_profiles")
        .select("id, user_id")
        .eq("email", input.email)
        .is("deleted_at", null)
        .maybeSingle();
    const existing = await findLive();
    if (existing.error) throw new Error(`profile lookup failed (code ${existing.error.code})`);

    let row = existing.data as { id: string; user_id: string | null } | null;
    if (!row) {
      const ins = await admin
        .from("lab_profiles")
        .insert({ email: input.email, ...fields })
        .select("id")
        .single();
      if (ins.error || !ins.data) {
        // A concurrent first submit won the unique index: reuse its row.
        if (ins.error?.code !== "23505") throw new Error(`profile insert failed (code ${ins.error?.code})`);
        const again = await findLive();
        if (again.error || !again.data) throw new Error(`profile re-select failed (code ${again.error?.code})`);
        row = again.data as { id: string; user_id: string | null };
      } else {
        row = { id: (ins.data as { id: string }).id, user_id: null };
        justInserted = true;
      }
    }
    const profileId = row.id;
    // A claimed row (user_id set) belongs to a verified user. Whoever merely knows
    // the email must not overwrite their birth data, card, consent or MailerLite
    // fields, so we skip every write and still send the link. The response is the
    // same either way, so it doesn't reveal that the email exists.
    const claimed = row.user_id !== null;
    if (!claimed && !justInserted) {
      const upd = await admin.from("lab_profiles").update(fields).eq("id", profileId);
      if (upd.error) throw new Error(`profile update failed (code ${upd.error.code})`);
    }

    const supabase = await createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: input.email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=/lab/profile`,
        shouldCreateUser: true,
      },
    });
    if (otpError) {
      console.error("[lab] signInWithOtp failed, status", otpError.status);
      return NextResponse.json({ error: API.otpFailed }, { status: 502 });
    }

    const sun = stored.positions.find((p) => p.body === "Sun")?.sign ?? "";
    const moon = stored.positions.find((p) => p.body === "Moon")?.sign ?? "";
    // Failure does not fail the request (upsertLabSubscriber never throws).
    if (!claimed) {
      await upsertLabSubscriber(input.email, { lab_card: input.card, sun_sign: sun, moon_sign: moon, ...transit });
    }

    const leadId = await recordLeadEvent(admin, {
      email: input.email,
      type: "lab_email_submitted",
      detail: { src: input.src, card: input.card, has_time: stored.hasTime },
    });
    if (leadId && !claimed) {
      const link = await admin.from("lab_profiles").update({ lead_id: leadId }).eq("id", profileId);
      if (link.error) console.error("[lab] lead link failed, code", link.error.code);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[lab] gate failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: API.serverError }, { status: 500 });
  }
}
