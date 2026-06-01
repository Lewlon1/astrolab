import { createClient } from "@/lib/supabase/server";
import { detectDevice } from "@/lib/analytics/device";

// First-party analytics ingestion. Receives batched events from the browser
// (usually via navigator.sendBeacon on page hide). Always returns 204 quickly
// and never throws back to the client — analytics must never break the page.

const VALID_TYPES = new Set([
  "page_view",
  "session_start",
  "session_end",
  "section_view",
  "section_dwell",
  "click",
  "interaction",
  "conversion",
]);

const ATTR_KEYS = [
  "landing_path",
  "referrer",
  "referrer_host",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "lang",
] as const;

const MAX_EVENTS = 50;
const DAY_MS = 86_400_000;

const noContent = () => new Response(null, { status: 204 });

function str(v: unknown, max: number): string | null {
  return typeof v === "string" && v.length > 0 ? v.slice(0, max) : null;
}

function clampInt(v: unknown, min: number, max: number): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.min(max, Math.max(min, Math.round(v)));
}

function toIso(v: unknown): string | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const now = Date.now();
  const ms = v < now - DAY_MS || v > now + DAY_MS ? now : v; // clamp absurd client skew
  return new Date(ms).toISOString();
}

export async function POST(request: Request) {
  // sendBeacon delivers a Blob/text body — parse defensively.
  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (!text) return noContent();
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return noContent();
  }

  const session_key = str(body.session_key, 64);
  const events = Array.isArray(body.events) ? body.events : [];
  if (!session_key || events.length === 0) return noContent();

  // Server-side enrichment. Country comes from the Vercel geo header; the raw IP
  // is never read or stored. (Header is absent on localhost → country stays null.)
  const ua = request.headers.get("user-agent") ?? "";
  const device = detectDevice(ua);
  const country = request.headers.get("x-vercel-ip-country");

  const supabase = await createClient();

  // 1. First-touch session row, written through a SECURITY DEFINER function that
  //    does INSERT ... ON CONFLICT DO NOTHING (see migration 011). A PostgREST
  //    .upsert() here takes an ON CONFLICT DO UPDATE path under RLS, whose
  //    WITH CHECK is admin-only, so anonymous sessions were silently rejected.
  //    The function keeps the row immutable to anon — no UPDATE policy needed.
  const sessionParams: Record<string, unknown> = {
    p_session_key: session_key,
    p_device: device,
    p_is_bot: device === "bot",
    p_country: country && country.length > 0 ? country : null,
  };
  const attribution = body.attribution;
  if (attribution && typeof attribution === "object") {
    const a = attribution as Record<string, unknown>;
    for (const k of ATTR_KEYS) {
      const val = str(a[k], 1024);
      if (val) sessionParams[`p_${k}`] = val;
    }
  }
  const { error: sessionError } = await supabase.rpc(
    "analytics_touch_session",
    sessionParams
  );
  if (sessionError) {
    console.error("[analytics] session write failed:", sessionError.message);
  }

  // 2. Validate + normalise events, then bulk insert.
  const rows = events
    .map((e) => (e && typeof e === "object" ? (e as Record<string, unknown>) : null))
    .filter((e): e is Record<string, unknown> => !!e && VALID_TYPES.has(e.event_type as string))
    .slice(0, MAX_EVENTS)
    .map((e) => ({
      session_key,
      event_type: e.event_type as string,
      event_name: str(e.event_name, 120),
      path: str(e.path, 512),
      section: str(e.section, 64),
      dwell_ms: clampInt(e.dwell_ms, 0, 3_600_000),
      props: e.props && typeof e.props === "object" ? e.props : {},
      occurred_at: toIso(e.occurred_at),
    }));

  if (rows.length > 0) {
    const { error: eventsError } = await supabase
      .from("analytics_events")
      .insert(rows);
    if (eventsError) {
      console.error("[analytics] events write failed:", eventsError.message);
    }
  }

  return noContent();
}
