import { beforeEach, describe, expect, it, vi } from "vitest";

const { recordEvt } = vi.hoisted(() => ({ recordEvt: vi.fn(async () => "lead1") }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => {
      const q: Record<string, unknown> = {};
      q.select = () => q;
      q.eq = () => q;
      q.is = () => q;
      q.maybeSingle = async () => ({
        data: { id: "p1", email: "a@b.co", card_drawn: "The Tower", src: "bio", positions: { hasTime: false } },
        error: null,
      });
      return q;
    },
  }),
}));
vi.mock("@/lib/lab/events", () => ({ recordLeadEvent: recordEvt }));

import { POST } from "./route";

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/lab/event", { method: "POST", body: JSON.stringify(body) }));

describe("event route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("records which offer and which button was clicked", async () => {
    const res = await post({ type: "lab_booking_clicked", service: "astro-psyche-blend", placement: "chart" });
    expect(res.status).toBe(204);
    expect(recordEvt).toHaveBeenCalledWith(expect.anything(), {
      email: "a@b.co",
      type: "lab_booking_clicked",
      detail: { src: "bio", card: "The Tower", has_time: false, service: "astro-psyche-blend", placement: "chart" },
    });
  });

  it("drops unknown service and placement values but still records the click", async () => {
    const res = await post({ type: "lab_booking_clicked", service: "free-money", placement: "footer" });
    expect(res.status).toBe(204);
    const detail = (recordEvt.mock.calls[0] as unknown as [unknown, { detail: Record<string, unknown> }])[1].detail;
    expect(detail).toMatchObject({ service: null, placement: null });
  });

  it("rejects other event types", async () => {
    expect((await post({ type: "something_else" })).status).toBe(400);
    expect(recordEvt).not.toHaveBeenCalled();
  });
});
