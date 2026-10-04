/**
 * Where a lead came from, and what they read before converting.
 *
 * Extracted from app/admin/analytics/page.tsx so the consolidated Leads section
 * and anything else can share one join. `leads.session_key` is the only bridge
 * between the lead tables and first-party analytics; there is no FK, so this is
 * a deliberate two-query lookup rather than something the database enforces.
 */

import type { Lead } from "@/types";

export interface LeadAttribution {
  device: string | null;
  country: string | null;
  /** Distinct section names the converting session viewed, in first-seen order. */
  sectionsSeen: string[];
}

export const EMPTY_ATTRIBUTION: LeadAttribution = {
  device: null,
  country: null,
  sectionsSeen: [],
};

/**
 * A short human label for the traffic source.
 *
 * utm_source wins because it is explicit; the referrer host is the fallback;
 * "Direct" means neither was recorded, which includes app-to-app links that
 * strip the referrer, so it is not proof nobody sent them.
 */
export function cameFrom(lead: Pick<Lead, "utm_source" | "referrer">): string {
  if (lead.utm_source) return lead.utm_source;
  if (lead.referrer) {
    try {
      return new URL(lead.referrer).hostname.replace(/^www\./, "");
    } catch {
      // A referrer that isn't a parseable URL is still worth showing raw.
      return lead.referrer;
    }
  }
  return "Direct";
}

/**
 * The project's own server client type, inferred rather than restated.
 *
 * lib/leadScoring.ts gets away with a hand-written structural shape because it
 * only needs `.select()`. This needs `.select().eq().in()`, and checking the
 * full Postgrest builder against a hand-written nested type makes tsc give up
 * with "type instantiation is excessively deep". Spelling out
 * `SupabaseClient<...>` instead would hard-code the client's current generic
 * arity, which changes between versions.
 *
 * `import type` — erased at compile time, so this pulls no server code into
 * any bundle.
 */
type QueryClient = Awaited<
  ReturnType<typeof import("./supabase/server").createClient>
>;

/**
 * Attribution for a set of leads, keyed by LEAD id (not session key), so
 * callers never have to hold the session-key indirection themselves.
 *
 * Leads with no session_key — every MailerLite or CSV import — simply have no
 * entry. Analytics tables missing entirely degrades to an empty map rather than
 * throwing, matching how the rest of the admin treats un-run migrations.
 */
export async function loadAttribution(
  supabase: QueryClient,
  leads: Pick<Lead, "id" | "session_key">[]
): Promise<Map<string, LeadAttribution>> {
  const byLead = new Map<string, LeadAttribution>();

  const sessionKeys = Array.from(
    new Set(leads.map((l) => l.session_key).filter((k): k is string => !!k))
  );
  if (sessionKeys.length === 0) return byLead;

  const sectionsBySession = new Map<string, string[]>();
  const metaBySession = new Map<
    string,
    { device: string | null; country: string | null }
  >();

  try {
    const [viewsRes, sessRes] = await Promise.all([
      supabase
        .from("analytics_events")
        .select("session_key, section")
        .eq("event_type", "section_view")
        .in("session_key", sessionKeys),
      supabase
        .from("analytics_sessions")
        .select("session_key, device, country")
        .in("session_key", sessionKeys),
    ]);

    for (const v of (viewsRes.data ?? []) as {
      session_key: string;
      section: string | null;
    }[]) {
      if (!v.section) continue;
      const list = sectionsBySession.get(v.session_key);
      if (list) {
        if (!list.includes(v.section)) list.push(v.section);
      } else {
        sectionsBySession.set(v.session_key, [v.section]);
      }
    }

    for (const s of (sessRes.data ?? []) as {
      session_key: string;
      device: string | null;
      country: string | null;
    }[]) {
      metaBySession.set(s.session_key, {
        device: s.device,
        country: s.country,
      });
    }
  } catch {
    // Analytics migrations not applied — leads still render, without enrichment.
    return byLead;
  }

  for (const lead of leads) {
    if (!lead.session_key) continue;
    const meta = metaBySession.get(lead.session_key);
    const sections = sectionsBySession.get(lead.session_key);
    if (!meta && !sections) continue;
    byLead.set(lead.id, {
      device: meta?.device ?? null,
      country: meta?.country ?? null,
      sectionsSeen: sections ?? [],
    });
  }

  return byLead;
}
