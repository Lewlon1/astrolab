import { describe, expect, it, vi } from "vitest";
import { calApi } from "@/lib/payments/calApi";

const ok = () => vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));

describe("calApi", () => {
  it("confirms with the v2 endpoint, bearer key and version header", async () => {
    const fetchImpl = ok();
    await calApi("cal_live_key", fetchImpl).confirm("uid/1");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.cal.com/v2/bookings/uid%2F1/confirm",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer cal_live_key",
          "cal-api-version": "2024-08-13",
        }),
      })
    );
  });

  it("declines with a reason body", async () => {
    const fetchImpl = ok();
    await calApi("k", fetchImpl).decline("u1", "No payment");
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.cal.com/v2/bookings/u1/decline");
    expect(JSON.parse(init.body)).toEqual({ reason: "No payment" });
  });

  it("throws with status and body on failure", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("nope", { status: 403 }));
    await expect(calApi("k", fetchImpl).confirm("u1")).rejects.toThrow(/403.*nope/);
  });

  it("throws when no API key is configured", async () => {
    await expect(calApi("", ok()).confirm("u1")).rejects.toThrow(/CAL_API_KEY/);
  });
});
