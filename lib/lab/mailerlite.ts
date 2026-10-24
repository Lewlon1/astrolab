// Server-only by convention (the `server-only` package is not installed).
// MailerLite writes for the Lab. Uses MAILERLITE_API_KEY (same variable as
// lib/mailerlite.ts) and MAILERLITE_LAB_GROUP_ID. Like lib/mailerlite.ts the
// response shapes come from MailerLite's docs and are unverified against the
// live API; field access is defensive. Every function has a timeout, never
// throws, and logs only an HTTP status, never the email.

const API_BASE = "https://connect.mailerlite.com/api";
const TIMEOUT_MS = 8000;

export type LabFields = {
  lab_card: string;
  sun_sign: string;
  moon_sign: string;
  next_transit?: string | null;
  transit_peak_date?: string | null;
};

async function call(path: string, init: { method: "GET" | "POST"; body?: unknown }): Promise<Response | null> {
  const key = process.env.MAILERLITE_API_KEY;
  if (!key) {
    console.error("[lab] MAILERLITE_API_KEY is not set");
    return null;
  }
  try {
    return await fetch(`${API_BASE}${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[lab] MailerLite unreachable:", err instanceof Error ? err.name : "error");
    return null;
  }
}

/** Fields where "" is a deliberate clear rather than "nothing to send". */
const CLEARABLE: ReadonlySet<string> = new Set(["next_transit", "transit_peak_date"]);

/**
 * Drops null, undefined and empty values, except the transit fields, where ""
 * is kept so a profile with no season clears the previous value. Whether
 * MailerLite treats "" as clearing a custom field is unverified against the live API.
 */
export function cleanFields(fields: Partial<LabFields>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v !== "string") continue;
    if (v || CLEARABLE.has(k)) out[k] = v;
  }
  return out;
}

/** Transit fields for a MailerLite update: null becomes "" so a stale value is cleared, not left behind. */
export function transitFieldsForMailerLite(f: {
  next_transit: string | null;
  transit_peak_date: string | null;
}): Pick<LabFields, "next_transit" | "transit_peak_date"> {
  return { next_transit: f.next_transit ?? "", transit_peak_date: f.transit_peak_date ?? "" };
}

/** POST /subscribers upserts. Adds the Lab group when MAILERLITE_LAB_GROUP_ID is set. Returns the subscriber id or null. */
async function upsert(email: string, fields: Partial<LabFields>, withGroup: boolean): Promise<string | null> {
  const body: Record<string, unknown> = { email, fields: cleanFields(fields) };
  const group = process.env.MAILERLITE_LAB_GROUP_ID;
  if (withGroup) {
    if (group) body.groups = [group];
    else console.error("[lab] MAILERLITE_LAB_GROUP_ID is not set; subscriber not added to a group");
  }
  const res = await call("/subscribers", { method: "POST", body });
  if (!res) return null;
  if (!res.ok) {
    console.error("[lab] MailerLite upsert failed, status", res.status);
    return null;
  }
  try {
    const json = (await res.json()) as { data?: { id?: unknown } };
    const id = json?.data?.id;
    return typeof id === "string" ? id : typeof id === "number" ? String(id) : null;
  } catch {
    return null;
  }
}

export function upsertLabSubscriber(email: string, fields: LabFields): Promise<string | null> {
  return upsert(email, fields, true);
}

/** Same POST (an upsert) without touching group membership. */
export function updateLabFields(email: string, fields: Partial<LabFields>): Promise<string | null> {
  return upsert(email, fields, false);
}

/**
 * GDPR delete: look the subscriber up, then POST /subscribers/{id}/forget.
 * Returns true when the subscriber is forgotten, or was not found (nothing held).
 */
export async function forgetSubscriber(email: string): Promise<boolean> {
  const lookup = await call(`/subscribers/${encodeURIComponent(email)}`, { method: "GET" });
  if (!lookup) return false;
  if (lookup.status === 404) return true;
  if (!lookup.ok) {
    console.error("[lab] MailerLite lookup failed, status", lookup.status);
    return false;
  }
  let id: string | null = null;
  try {
    const json = (await lookup.json()) as { data?: { id?: unknown } };
    const raw = json?.data?.id;
    id = typeof raw === "string" ? raw : typeof raw === "number" ? String(raw) : null;
  } catch {
    return false;
  }
  if (!id) return false;
  const res = await call(`/subscribers/${encodeURIComponent(id)}/forget`, { method: "POST" });
  if (!res) return false;
  if (!res.ok) console.error("[lab] MailerLite forget failed, status", res.status);
  return res.ok;
}
