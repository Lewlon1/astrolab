import { describe, expect, it } from "vitest";
import { validateApplication, validatePartial } from "../validate";
import { calParams, calUrl, parseLpBooking } from "../cal";
import { variantFromRequest } from "../requestContext";
import { lpDetail } from "../events";
import { APPLICATION_UI } from "@/content/apply/application";

const LEAD = "3f2b8a1c-1d2e-4f5a-9b6c-7d8e9f0a1b2c";
const goodAnswers = {
  want_by_april: "Less second-guessing.",
  keeps_repeating: "I say yes to everything, then resent it.",
  birth_date: "1988-03-14",
  birth_place: "Leeds",
  birth_time: "07:30",
};

describe("validatePartial", () => {
  const base = { email: " Sam@Example.com ", consent: true, market: "uk", concept: "c2" };

  it("accepts and normalises", () => {
    const v = validatePartial({ ...base, utm: { utm_source: "meta", junk: "x" } });
    expect(v.ok && v.value).toMatchObject({ email: "sam@example.com", market: "uk", concept: "c2", utm: { utm_source: "meta", utm_medium: null } });
  });

  it("says what to fix", () => {
    expect(validatePartial({ ...base, email: "nope" })).toEqual({ ok: false, field: "email", message: APPLICATION_UI.errors.email });
    expect(validatePartial({ ...base, consent: false })).toEqual({ ok: false, field: "consent", message: APPLICATION_UI.errors.consent });
  });

  it("rejects unknown markets and maps unknown concepts to default", () => {
    expect(validatePartial({ ...base, market: "fr" }).ok).toBe(false);
    const v = validatePartial({ ...base, concept: "<script>" });
    expect(v.ok && v.value.concept).toBe("default");
  });

  it("keeps a complete reading summary only", () => {
    const v1 = validatePartial({ ...base, reading: { card: "The Tower", sun: "Leo", moon: "Cancer" } });
    expect(v1.ok && v1.value.reading).toEqual({ card: "The Tower", sun: "Leo", moon: "Cancer" });
    const v2 = validatePartial({ ...base, reading: { card: "The Tower" } });
    expect(v2.ok && v2.value.reading).toBeNull();
  });
});

describe("validateApplication", () => {
  const base = { leadId: LEAD, email: "sam@example.com", answers: goodAnswers };

  it("accepts a full application", () => {
    const v = validateApplication(base);
    expect(v.ok && v.value.answers).toEqual(goodAnswers);
  });

  it("names the question to fix", () => {
    const v = validateApplication({ ...base, answers: { ...goodAnswers, want_by_april: "  " } });
    expect(v).toEqual({ ok: false, field: "want_by_april", message: APPLICATION_UI.errors.required });
    const p = validateApplication({ ...base, answers: { ...goodAnswers, birth_place: "" } });
    expect(p).toEqual({ ok: false, field: "birth_place", message: APPLICATION_UI.errors.required });
    const long = validateApplication({ ...base, answers: { ...goodAnswers, keeps_repeating: "x".repeat(1001) } });
    expect(long.ok === false && long.message).toBe("Shorten this answer to 1000 characters or fewer.");
  });

  it("birth time is optional; date and time must be real", () => {
    const noTime: Record<string, string> = { ...goodAnswers };
    delete noTime.birth_time;
    const ok = validateApplication({ ...base, answers: noTime });
    expect(ok.ok && "birth_time" in ok.value.answers).toBe(false);
    for (const bad of ["14/03/1988", "1988-02-30", "1899-12-31", "2999-01-01"]) {
      const v = validateApplication({ ...base, answers: { ...goodAnswers, birth_date: bad } });
      expect(v).toEqual({ ok: false, field: "birth_date", message: APPLICATION_UI.errors.date });
    }
    const t = validateApplication({ ...base, answers: { ...goodAnswers, birth_time: "25:00" } });
    expect(t).toEqual({ ok: false, field: "birth_time", message: APPLICATION_UI.errors.time });
  });

  it("needs a real lead id and drops unknown answers", () => {
    expect(validateApplication({ ...base, leadId: "1" }).ok).toBe(false);
    const v = validateApplication({ ...base, answers: { ...goodAnswers, extra: "x" } });
    expect(v.ok && "extra" in v.value.answers).toBe(false);
  });
});

describe("Cal metadata", () => {
  const prefill = {
    leadId: LEAD,
    name: "Sam",
    email: "sam@example.com",
    lp_variant: "b" as const,
    concept: "c2" as const,
    market: "us" as const,
    utm: { utm_source: "meta", utm_medium: "paid_social", utm_campaign: "lp_r1", utm_content: "ad 1", utm_term: null },
  };

  it("passes lead_id, variant, concept and UTMs as metadata", () => {
    const p = calParams(prefill);
    expect(p).toMatchObject({
      name: "Sam",
      email: "sam@example.com",
      "metadata[lead_id]": LEAD,
      "metadata[lp_variant]": "b",
      "metadata[experiment_id]": "lp_r1",
      "metadata[concept]": "c2",
      "metadata[market]": "us",
      "metadata[utm_source]": "meta",
      "metadata[utm_content]": "ad 1",
    });
    expect("metadata[utm_term]" in p).toBe(false);
    expect(calUrl(prefill)).toContain("metadata%5Blead_id%5D=" + LEAD);
  });

  it("parses an /apply booking from the webhook, and ignores others", () => {
    const body = {
      triggerEvent: "BOOKING_CREATED",
      payload: { uid: "cal_1", metadata: { lead_id: LEAD, lp_variant: "b", concept: "c2", market: "us", utm_source: "meta" } },
    };
    expect(parseLpBooking(body)).toMatchObject({ uid: "cal_1", leadId: LEAD, lp_variant: "b", concept: "c2", market: "us", utm: { utm_source: "meta" } });
    expect(parseLpBooking({ ...body, triggerEvent: "BOOKING_CANCELLED" })).toBeNull();
    expect(parseLpBooking({ triggerEvent: "BOOKING_CREATED", payload: { uid: "cal_2", metadata: {} } })).toBeNull();
    expect(parseLpBooking({ triggerEvent: "BOOKING_CREATED", payload: { uid: "cal_3" } })).toBeNull();
  });
});

describe("request context", () => {
  const req = (cookie?: string) => new Request("http://x/api/apply", { headers: cookie ? { cookie } : {} });

  it("trusts the lp_v cookie over the body", () => {
    expect(variantFromRequest(req("lp_v=b; other=1"), "a")).toEqual({ lp_variant: "b", qa: false });
    expect(variantFromRequest(req("lp_v=a; lp_qa=1"), "b")).toEqual({ lp_variant: "a", qa: true });
    expect(variantFromRequest(req(), "b")).toEqual({ lp_variant: "b", qa: false });
    expect(variantFromRequest(req(), "zzz")).toEqual({ lp_variant: "a", qa: false });
  });

  it("every event carries the experiment fields", () => {
    const d = lpDetail({ lp_variant: "a", concept: "default", market: "uk", qa: true, utm: { utm_source: "meta", utm_medium: null, utm_campaign: null, utm_content: null, utm_term: null } });
    expect(d).toMatchObject({ lp_variant: "a", experiment_id: "lp_r1", concept: "default", market: "uk", qa: true, utm_source: "meta" });
  });
});
