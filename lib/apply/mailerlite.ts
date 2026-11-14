// Server-only by convention. MailerLite group moves for /apply.
// Groups: MAILERLITE_APPLY_PARTIAL_GROUP_ID ("Apply — partial") and
// MAILERLITE_APPLY_COMPLETE_GROUP_ID ("Apply — complete"). Uses MAILERLITE_API_KEY.
// Never throws; logs an HTTP status only, never the email.

const API_BASE = "https://connect.mailerlite.com/api";
const TIMEOUT_MS = 8000;

async function call(path: string, method: "POST" | "DELETE", body?: unknown): Promise<Response | null> {
  const key = process.env.MAILERLITE_API_KEY;
  if (!key) {
    console.error("[apply] MAILERLITE_API_KEY is not set");
    return null;
  }
  try {
    return await fetch(`${API_BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json", "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[apply] MailerLite unreachable:", err instanceof Error ? err.name : "error");
    return null;
  }
}

/** Upserts the subscriber into `groupEnv`'s group (adds; keeps other groups). Returns the subscriber id or null. */
async function upsertIntoGroup(email: string, groupEnv: string, fields: Record<string, string>): Promise<string | null> {
  const group = process.env[groupEnv];
  if (!group) console.error(`[apply] ${groupEnv} is not set; subscriber not added to a group`);
  const res = await call("/subscribers", "POST", { email, fields, ...(group ? { groups: [group] } : {}) });
  if (!res) return null;
  if (!res.ok) {
    console.error("[apply] MailerLite upsert failed, status", res.status);
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

const clean = (o: Record<string, string | null | undefined>) =>
  Object.fromEntries(Object.entries(o).filter((e): e is [string, string] => typeof e[1] === "string" && e[1] !== ""));

/**
 * Step 1 email: add to "Apply — partial". Only custom fields that already exist in
 * MailerLite (the Lab's lab_card / sun_sign / moon_sign) are sent; the variant lives in Supabase.
 */
export function addPartial(
  email: string,
  fields: { lab_card?: string; sun_sign?: string; moon_sign?: string },
): Promise<string | null> {
  return upsertIntoGroup(email, "MAILERLITE_APPLY_PARTIAL_GROUP_ID", clean(fields));
}

/** Full application: add to "Apply — complete", then remove from "Apply — partial". */
export async function moveToComplete(email: string, fields: { name?: string | null }): Promise<boolean> {
  const id = await upsertIntoGroup(email, "MAILERLITE_APPLY_COMPLETE_GROUP_ID", clean(fields));
  const partial = process.env.MAILERLITE_APPLY_PARTIAL_GROUP_ID;
  if (!id || !partial) return Boolean(id);
  const res = await call(`/subscribers/${encodeURIComponent(id)}/groups/${encodeURIComponent(partial)}`, "DELETE");
  // 404 = wasn't in the partial group: fine.
  if (res && !res.ok && res.status !== 404) console.error("[apply] MailerLite group removal failed, status", res.status);
  return true;
}
