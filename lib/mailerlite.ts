/**
 * MailerLite API client (Connect API, v2).
 *
 * Reads MAILERLITE_API_KEY — the variable app/api/leads/route.ts already uses.
 * Deliberately NOT a second MAILERLITE_API_TOKEN: one credential, one variable.
 *
 * UNVERIFIED AGAINST THE LIVE API. The session that wrote this could not reach
 * connect.mailerlite.com (blocked by the sandbox network policy), so the
 * response shapes below come from MailerLite's published API docs rather than
 * an observed payload. Field access is defensive throughout — anything missing
 * degrades to null instead of throwing. Confirm on the first real sync.
 */

const API_BASE = "https://connect.mailerlite.com/api";

/**
 * MailerLite documents 120 requests/minute. We stay well under it: the sync
 * pages subscribers at 100/request and only pulls per-subscriber activity for
 * a capped number of top leads.
 */
export const MAILERLITE_RATE_LIMIT_PER_MIN = 120;
const PAGE_SIZE = 100;
const MAX_PAGES = 50; // hard stop: 5,000 subscribers per sync
const ACTIVITY_FETCH_CAP = 40;

export interface MailerLiteSubscriber {
  id: string;
  email: string;
  status: string; // active | unsubscribed | unconfirmed | bounced | junk
  source: string | null;
  sent: number;
  opens_count: number;
  clicks_count: number;
  subscribed_at: string | null;
  unsubscribed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  fields: Record<string, unknown>;
  groups: { id: string; name: string }[];
}

export interface MailerLiteActivity {
  id: string;
  type: string; // opened | clicked | sent | unsubscribed | bounced | ...
  created_at: string | null;
  campaignName: string | null;
  url: string | null;
}

export class MailerLiteError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "MailerLiteError";
  }
}

function token(): string {
  const key = process.env.MAILERLITE_API_KEY;
  if (!key) {
    throw new MailerLiteError(
      "MAILERLITE_API_KEY is not set. Add it in Vercel (and .env.local for dev)."
    );
  }
  return key;
}

async function request<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${token()}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
  } catch (err) {
    throw new MailerLiteError(
      `Could not reach MailerLite: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (res.status === 429) {
    const retry = res.headers.get("retry-after");
    throw new MailerLiteError(
      `MailerLite rate limit hit (120 req/min).${retry ? ` Retry after ${retry}s.` : ""} Sync stopped — re-run shortly; already-synced leads are kept.`,
      429
    );
  }

  if (res.status === 401 || res.status === 403) {
    throw new MailerLiteError(
      "MailerLite rejected the API key (401/403). Check MAILERLITE_API_KEY.",
      res.status
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new MailerLiteError(
      `MailerLite returned ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`,
      res.status
    );
  }

  return (await res.json()) as T;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function normaliseSubscriber(raw: Record<string, unknown>): MailerLiteSubscriber | null {
  const email = str(raw.email);
  const id = str(raw.id) ?? (typeof raw.id === "number" ? String(raw.id) : null);
  // A subscriber with no email cannot be merged into `leads`, which keys on it.
  if (!email || !id) return null;

  const groups = Array.isArray(raw.groups)
    ? (raw.groups as Record<string, unknown>[])
        .map((g) => ({
          id: str(g?.id) ?? "",
          name: str(g?.name) ?? "",
        }))
        .filter((g) => g.name)
    : [];

  return {
    id,
    email: email.toLowerCase(),
    status: str(raw.status) ?? "active",
    source: str(raw.source),
    sent: num(raw.sent),
    opens_count: num(raw.opens_count),
    clicks_count: num(raw.clicks_count),
    subscribed_at: str(raw.subscribed_at),
    unsubscribed_at: str(raw.unsubscribed_at),
    created_at: str(raw.created_at),
    updated_at: str(raw.updated_at),
    fields:
      raw.fields && typeof raw.fields === "object"
        ? (raw.fields as Record<string, unknown>)
        : {},
    groups,
  };
}

/**
 * Fetch every subscriber, following MailerLite's cursor pagination.
 * Stops at MAX_PAGES so a runaway list can never hang the sync.
 */
export async function fetchAllSubscribers(): Promise<MailerLiteSubscriber[]> {
  const out: MailerLiteSubscriber[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < MAX_PAGES; page++) {
    const qs = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (cursor) qs.set("cursor", cursor);

    const body = await request<{
      data?: Record<string, unknown>[];
      meta?: { next_cursor?: string | null };
    }>(`/subscribers?${qs.toString()}`);

    const rows = Array.isArray(body.data) ? body.data : [];
    for (const row of rows) {
      const sub = normaliseSubscriber(row);
      if (sub) out.push(sub);
    }

    cursor = body.meta?.next_cursor ?? null;
    if (!cursor || rows.length === 0) break;
  }

  return out;
}

/**
 * Per-subscriber activity. Only called for a capped set of high-scoring leads —
 * one request each, so an uncapped call would blow the rate limit on a list of
 * any size.
 */
export async function fetchSubscriberActivity(
  subscriberId: string
): Promise<MailerLiteActivity[]> {
  const body = await request<{ data?: Record<string, unknown>[] }>(
    `/subscribers/${encodeURIComponent(subscriberId)}/activity`
  );

  const rows = Array.isArray(body.data) ? body.data : [];
  return rows.map((r) => {
    const campaign = r.campaign as Record<string, unknown> | undefined;
    return {
      id: str(r.id) ?? crypto.randomUUID(),
      type: str(r.type) ?? "unknown",
      created_at: str(r.created_at),
      campaignName: campaign ? str(campaign.name) : null,
      url: str(r.url),
    };
  });
}

/**
 * Activity for many subscribers, sequential and capped. Sequential is
 * deliberate: parallel bursts are what trip the per-minute limit.
 * Individual failures are swallowed so one bad subscriber cannot fail a sync.
 */
export async function fetchActivityForMany(
  subscriberIds: string[],
  cap = ACTIVITY_FETCH_CAP
): Promise<Map<string, MailerLiteActivity[]>> {
  const result = new Map<string, MailerLiteActivity[]>();

  for (const id of subscriberIds.slice(0, cap)) {
    try {
      result.set(id, await fetchSubscriberActivity(id));
    } catch (err) {
      if (err instanceof MailerLiteError && err.status === 429) throw err;
      // Otherwise: skip this subscriber, keep the sync going.
    }
  }

  return result;
}

export async function fetchGroups(): Promise<{ id: string; name: string }[]> {
  const body = await request<{ data?: Record<string, unknown>[] }>("/groups");
  const rows = Array.isArray(body.data) ? body.data : [];
  return rows
    .map((g) => ({ id: str(g.id) ?? "", name: str(g.name) ?? "" }))
    .filter((g) => g.id && g.name);
}

/** Best-effort display name from MailerLite's custom fields. */
export function nameFromFields(fields: Record<string, unknown>): string | null {
  const first = str(fields.name);
  const last = str(fields.last_name);
  if (first && last) return `${first} ${last}`;
  return first ?? last ?? null;
}

/**
 * Infer language from MailerLite group names or a `language` field.
 * Gabs runs English (Astropsyche Lab) and Spanish (Eteria Circle) audiences,
 * so the queue filters on this.
 */
export function languageFromSubscriber(sub: MailerLiteSubscriber): string | null {
  const explicit = str(sub.fields.language);
  if (explicit) return explicit.toLowerCase().startsWith("es") ? "es" : "en";

  const haystack = sub.groups.map((g) => g.name.toLowerCase()).join(" ");
  if (/eteria|espa|spanish|\bes\b/.test(haystack)) return "es";
  if (/astropsyche|english|\ben\b/.test(haystack)) return "en";
  return null;
}
