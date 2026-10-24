import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const createClientMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

import { getAdminUser, requireAdminApi } from "./admin";

type RpcResult = { data: unknown; error: { message: string } | null };

function mockSupabase(user: { id: string } | null, rpc?: RpcResult) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    rpc: vi.fn().mockResolvedValue(rpc ?? { data: null, error: null }),
  };
}

describe("getAdminUser", () => {
  it("returns isAdmin false when there is no user, without calling the RPC", async () => {
    const supabase = mockSupabase(null);
    const res = await getAdminUser(supabase as never);
    expect(res).toEqual({ user: null, isAdmin: false });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("fails closed when the RPC errors", async () => {
    const supabase = mockSupabase(
      { id: "u1" },
      { data: true, error: { message: "function is_admin() does not exist" } }
    );
    const res = await getAdminUser(supabase as never);
    expect(res.user).toEqual({ id: "u1" });
    expect(res.isAdmin).toBe(false);
  });

  it("returns isAdmin true when the RPC returns true", async () => {
    const supabase = mockSupabase({ id: "u1" }, { data: true, error: null });
    const res = await getAdminUser(supabase as never);
    expect(res.isAdmin).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith("is_admin");
  });

  it("returns isAdmin false when the RPC returns false", async () => {
    const supabase = mockSupabase({ id: "u1" }, { data: false, error: null });
    expect((await getAdminUser(supabase as never)).isAdmin).toBe(false);
  });
});

describe("requireAdminApi", () => {
  beforeEach(() => createClientMock.mockReset());

  it("returns 401 with no user", async () => {
    createClientMock.mockResolvedValue(mockSupabase(null));
    const res = await requireAdminApi();
    expect(res).toBeInstanceOf(NextResponse);
    expect((res as NextResponse).status).toBe(401);
  });

  it("returns 403 for a signed-in non-admin", async () => {
    createClientMock.mockResolvedValue(
      mockSupabase({ id: "u1" }, { data: false, error: null })
    );
    const res = await requireAdminApi();
    expect((res as NextResponse).status).toBe(403);
  });

  it("returns 403 when the RPC errors", async () => {
    createClientMock.mockResolvedValue(
      mockSupabase({ id: "u1" }, { data: null, error: { message: "boom" } })
    );
    expect(((await requireAdminApi()) as NextResponse).status).toBe(403);
  });

  it("returns supabase and user for an admin", async () => {
    const supabase = mockSupabase({ id: "u1" }, { data: true, error: null });
    createClientMock.mockResolvedValue(supabase);
    const res = await requireAdminApi();
    expect(res).not.toBeInstanceOf(NextResponse);
    expect(res).toEqual({ supabase, user: { id: "u1" } });
  });
});
