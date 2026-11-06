import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveLabViewer } from "../viewer";
import { signSession } from "../session";

const A = "3f1c2b8e-4a5d-4c6e-9f70-1a2b3c4d5e6f";
const B = "7a9d0c1e-2b3c-4d5e-8f60-0a1b2c3d4e5f";
const NOW = 1_800_000_000_000;

type Row = { id: string; user_id: string | null; email: string; deleted_at: string | null };

/** In-memory lab_profiles: select / eq / is / maybeSingle and update(...).eq().is().is(). */
function fakeAdmin(rows: Row[]) {
  const from = () => {
    const filters: [string, unknown][] = [];
    const match = () => rows.filter((r) => filters.every(([c, v]) => (r as Record<string, unknown>)[c] === v));
    const q: Record<string, unknown> = {};
    q.select = () => q;
    q.eq = (c: string, v: unknown) => (filters.push([c, v]), q);
    q.is = (c: string, v: unknown) => (filters.push([c, v]), q);
    q.maybeSingle = async () => ({ data: match()[0] ?? null, error: null });
    q.update = (vals: Partial<Row>) => {
      const u: Record<string, unknown> = {};
      u.eq = (c: string, v: unknown) => (filters.push([c, v]), u);
      u.is = (c: string, v: unknown) => {
        filters.push([c, v]);
        return Object.assign(Promise.resolve({ error: null }), {
          is: (c2: string, v2: unknown) => {
            filters.push([c2, v2]);
            match().forEach((r) => Object.assign(r, vals));
            return Promise.resolve({ error: null });
          },
        });
      };
      return u;
    };
    return q;
  };
  return { from } as unknown as SupabaseClient;
}

const supabaseFor = (user: { id: string; email?: string } | null) =>
  ({ auth: { getUser: async () => ({ data: { user } }) } }) as unknown as SupabaseClient;

beforeEach(() => {
  process.env.LAB_SESSION_SECRET = "s".repeat(40);
});
afterEach(() => {
  delete process.env.LAB_SESSION_SECRET;
});

const resolve = (rows: Row[], user: { id: string; email?: string } | null, cookieValue?: string) =>
  resolveLabViewer<Row>({ supabase: supabaseFor(user), admin: fakeAdmin(rows), cookieValue, columns: "id, user_id, email", now: NOW });

describe("resolveLabViewer", () => {
  it("a signed-in user sees their own profile", async () => {
    const rows = [{ id: A, user_id: "u1", email: "a@b.co", deleted_at: null }];
    const v = await resolve(rows, { id: "u1" });
    expect(v).toMatchObject({ via: "session", row: { id: A } });
  });

  it("a signed-in user's session wins over a cookie for another profile", async () => {
    const rows = [
      { id: A, user_id: "u1", email: "a@b.co", deleted_at: null },
      { id: B, user_id: null, email: "b@b.co", deleted_at: null },
    ];
    const v = await resolve(rows, { id: "u1" }, signSession(B, NOW)!);
    expect(v?.row.id).toBe(A);
  });

  it("links an unclaimed profile by email for a signed-in user, as the profile page used to", async () => {
    const rows = [{ id: A, user_id: null, email: "a@b.co", deleted_at: null }];
    const v = await resolve(rows, { id: "u1", email: "A@B.co" });
    expect(v).toMatchObject({ via: "session", row: { id: A } });
    expect(rows[0].user_id).toBe("u1");
  });

  it("a cookie opens an unclaimed profile", async () => {
    const rows = [{ id: A, user_id: null, email: "a@b.co", deleted_at: null }];
    const v = await resolve(rows, null, signSession(A, NOW)!);
    expect(v).toMatchObject({ via: "cookie", row: { id: A } });
  });

  it("a cookie stops working once the profile is claimed", async () => {
    const rows = [{ id: A, user_id: "u9", email: "a@b.co", deleted_at: null }];
    expect(await resolve(rows, null, signSession(A, NOW)!)).toBeNull();
  });

  it("a cookie never opens a deleted profile", async () => {
    const rows = [{ id: A, user_id: null, email: "a@b.co", deleted_at: "2026-10-25" }];
    expect(await resolve(rows, null, signSession(A, NOW)!)).toBeNull();
  });

  it("rejects a forged, expired or missing cookie", async () => {
    const rows = [{ id: A, user_id: null, email: "a@b.co", deleted_at: null }];
    expect(await resolve(rows, null, undefined)).toBeNull();
    expect(await resolve(rows, null, `${A}.${Math.floor(NOW / 1000) + 99999}.forged`)).toBeNull();
    expect(await resolve(rows, null, signSession(A, NOW - 8 * 24 * 3600 * 1000)!)).toBeNull();
  });

  it("no cookie access without LAB_SESSION_SECRET", async () => {
    const rows = [{ id: A, user_id: null, email: "a@b.co", deleted_at: null }];
    const value = signSession(A, NOW)!;
    delete process.env.LAB_SESSION_SECRET;
    expect(await resolve(rows, null, value)).toBeNull();
  });
});
