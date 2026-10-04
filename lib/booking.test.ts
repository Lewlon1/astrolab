import { describe, expect, it } from "vitest";
import { calPathFor, calTargetFromUrl, paymentLinkFor, withPaymentUrl } from "@/lib/booking";

describe("paymentLinkFor", () => {
  it("appends client_reference_id", () => {
    expect(paymentLinkFor("https://buy.stripe.com/abc", "uid_123")).toBe(
      "https://buy.stripe.com/abc?client_reference_id=uid_123"
    );
  });

  it("preserves existing query params and replaces an old reference", () => {
    expect(
      paymentLinkFor(
        "https://buy.stripe.com/abc?prefilled_promo_code=X&client_reference_id=old",
        "new"
      )
    ).toBe(
      "https://buy.stripe.com/abc?prefilled_promo_code=X&client_reference_id=new"
    );
  });
});

describe("withPaymentUrl", () => {
  it("adds a trimmed paymentUrl to cal targets", () => {
    expect(
      withPaymentUrl({ kind: "cal", slug: "blend" }, "  https://buy.stripe.com/x ")
    ).toEqual({ kind: "cal", slug: "blend", paymentUrl: "https://buy.stripe.com/x" });
  });

  it("leaves cal targets alone when paymentUrl is empty", () => {
    expect(withPaymentUrl({ kind: "cal", slug: "blend" }, "  ")).toEqual({
      kind: "cal",
      slug: "blend",
    });
  });

  it("never touches stripe targets or null", () => {
    const stripe = { kind: "stripe" as const, url: "https://book.stripe.com/q" };
    expect(withPaymentUrl(stripe, "https://buy.stripe.com/x")).toBe(stripe);
    expect(withPaymentUrl(null, "https://buy.stripe.com/x")).toBeNull();
  });
});

describe("calTargetFromUrl", () => {
  it("turns a cal.com event link into an embeddable cal target", () => {
    expect(calTargetFromUrl("https://cal.com/theastropsychelab/solar-return")).toEqual({
      kind: "cal",
      slug: "solar-return",
      path: "theastropsychelab/solar-return",
    });
  });

  it("accepts app.cal.com, www, trailing slashes, query strings and team links", () => {
    expect(calTargetFromUrl("https://app.cal.com/gabs/intro/?month=2026-11")?.path).toBe("gabs/intro");
    expect(calTargetFromUrl("  https://www.cal.com/gabs/intro  ")?.path).toBe("gabs/intro");
    expect(calTargetFromUrl("https://cal.com/team/lab/group-session")).toMatchObject({
      slug: "group-session",
      path: "team/lab/group-session",
    });
  });

  it("returns null for non-Cal links, profile-only links and junk", () => {
    expect(calTargetFromUrl("https://buy.stripe.com/abc")).toBeNull();
    expect(calTargetFromUrl("https://cal.com/theastropsychelab")).toBeNull();
    expect(calTargetFromUrl("https://evilcal.com/a/b")).toBeNull();
    expect(calTargetFromUrl("not a url")).toBeNull();
    expect(calTargetFromUrl(null)).toBeNull();
  });
});

describe("calPathFor", () => {
  it("uses the explicit path when present, else the site's Cal username", () => {
    expect(calPathFor({ kind: "cal", slug: "x", path: "gabs/x" })).toBe("gabs/x");
    expect(calPathFor({ kind: "cal", slug: "stellar-insights" })).toBe(
      "theastropsychelab/stellar-insights"
    );
  });
});
