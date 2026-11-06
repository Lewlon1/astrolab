import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter } from "../rateLimit";

describe("rate limiter", () => {
  it("blocks past the limit and recovers as the window slides", () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
    expect(rl.allow("a")).toBe(true);
    t = 100;
    expect(rl.allow("a")).toBe(true);
    expect(rl.allow("a")).toBe(false);
    expect(rl.allow("b")).toBe(true);
    t = 1050; // first hit (t=0) has aged out
    expect(rl.allow("a")).toBe(true);
    expect(rl.allow("a")).toBe(false);
    t = 1200;
    expect(rl.allow("a")).toBe(true);
  });
  it("takes the first x-forwarded-for entry", () => {
    const h = (v: string | null) => ({ get: () => v });
    expect(clientIp(h("1.2.3.4, 5.6.7.8"))).toBe("1.2.3.4");
    expect(clientIp(h(null))).toBe("unknown");
  });
});
