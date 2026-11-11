import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A tiny fake of the Supabase query builder: records calls, returns canned results.
type Call = { table: string; op: string; args: unknown[] };
const calls: Call[] = [];
const LEAD = "3f2b8a1c-1d2e-4f5a-9b6c-7d8e9f0a1b2c";
const state = { upsertError: null as null | { code: string } };

function builder(table: string) {
  const chain: Record<string, unknown> = {};
  const record = (op: string) => (...args: unknown[]) => {
    calls.push({ table, op, args });
    return chain;
  };
  for (const op of ["update", "eq", "is", "select", "insert"]) chain[op] = record(op);
  chain.upsert = (...args: unknown[]) => {
    calls.push({ table, op: "upsert", args });
    const err = state.upsertError;
    state.upsertError = null; // the fallback upsert succeeds
    return Promise.resolve({ error: err });
  };
  chain.maybeSingle = () => Promise.resolve({ data: { id: LEAD }, error: null });
  chain.then = (res: (v: unknown) => void) => res({ error: null, data: [{ id: LEAD }] });
  return chain;
}

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: (t: string) => builder(t) }) }));
const ml = vi.hoisted(() => ({ addPartial: vi.fn(async () => "sub_1"), moveToComplete: vi.fn(async () => true) }));
vi.mock("@/lib/apply/mailerlite", () => ml);
vi.mock("@/lib/apply/rateLimit", () => ({ partialLimiter: { allow: () => true }, applyLimiter: { allow: () => true } }));

import { POST as partial } from "./partial/route";
import { POST as apply } from "./route";

const post = (url: string, body: unknown, cookie = "lp_v=b") =>
  new Request(url, { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify(body) });

const SECRET_EMAIL = "secret.person@example.com";
const SECRET_TEXT = "I want to leave my marriage";

describe("/api/apply/partial", () => {
  let logs: unknown[][];
  beforeEach(() => {
    calls.length = 0;
    logs = [];
    vi.spyOn(console, "error").mockImplementation((...a) => void logs.push(a));
    vi.spyOn(console, "log").mockImplementation((...a) => void logs.push(a));
  });
  afterEach(() => vi.restoreAllMocks());

  it("saves the lead with the cookie's variant, logs lp_email_captured and adds to MailerLite", async () => {
    const res = await partial(post("http://x/api/apply/partial", { email: SECRET_EMAIL, consent: true, market: "uk", concept: "c2", variant: "a", utm: { utm_source: "meta" } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, leadId: LEAD });
    const up = calls.find((c) => c.table === "leads" && c.op === "upsert")!;
    expect(up.args[0]).toMatchObject({ email: SECRET_EMAIL, lp_variant: "b", experiment_id: "lp_r1", concept: "c2", market: "uk", utm_source: "meta" });
    const ev = calls.find((c) => c.table === "lead_events" && c.op === "insert")!;
    expect(ev.args[0]).toMatchObject({ lead_id: LEAD, type: "lp_email_captured", detail: { lp_variant: "b", experiment_id: "lp_r1", qa: false } });
    expect(ml.addPartial).toHaveBeenCalledWith(SECRET_EMAIL, expect.any(Object));
  });

  it("still keeps the email when the SQL hasn't been run, without logging it", async () => {
    state.upsertError = { code: "PGRST204" };
    const res = await partial(post("http://x/api/apply/partial", { email: SECRET_EMAIL, consent: true, market: "us" }));
    expect(res.status).toBe(200);
    const ups = calls.filter((c) => c.op === "upsert");
    expect(ups).toHaveLength(2);
    expect(ups[1].args[0]).toEqual({ email: SECRET_EMAIL, source: "website_form" });
    expect(JSON.stringify(logs)).not.toContain("secret.person");
  });

  it("explains a missing consent", async () => {
    const res = await partial(post("http://x/api/apply/partial", { email: SECRET_EMAIL, consent: false, market: "uk" }));
    expect(res.status).toBe(400);
    expect((await res.json()).field).toBe("consent");
  });
});

describe("/api/apply", () => {
  let logs: unknown[][];
  beforeEach(() => {
    calls.length = 0;
    logs = [];
    vi.spyOn(console, "error").mockImplementation((...a) => void logs.push(a));
  });
  afterEach(() => vi.restoreAllMocks());

  const answers = { first_name: "Sam", astro_familiarity: "new", focus: "self", end_2027: SECRET_TEXT, budget_ready: "ready" };

  it("saves answers, logs the event without free text, and returns Cal metadata", async () => {
    const res = await apply(post("http://x/api/apply", { leadId: LEAD, email: SECRET_EMAIL, answers, market: "us", concept: "c1", utm: { utm_campaign: "lp_r1" } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cal.params).toMatchObject({ "metadata[lead_id]": LEAD, "metadata[lp_variant]": "b", "metadata[concept]": "c1", "metadata[utm_campaign]": "lp_r1" });
    const upd = calls.find((c) => c.table === "leads" && c.op === "update")!;
    expect(upd.args[0]).toMatchObject({ application: answers, name: "Sam" });
    const ev = calls.find((c) => c.table === "lead_events")!;
    expect(JSON.stringify(ev.args[0])).not.toContain(SECRET_TEXT);
    expect(ml.moveToComplete).toHaveBeenCalled();
    expect(JSON.stringify(logs)).not.toContain(SECRET_TEXT);
  });

  it("names the field to fix", async () => {
    const res = await apply(post("http://x/api/apply", { leadId: LEAD, email: SECRET_EMAIL, answers: { ...answers, focus: "" }, market: "us" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ field: "focus" });
  });
});
