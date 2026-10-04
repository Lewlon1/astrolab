import { describe, expect, it } from "vitest";
import { paymentLinkFor, withPaymentUrl } from "@/lib/booking";

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
