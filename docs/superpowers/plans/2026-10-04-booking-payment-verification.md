# Booking Payment Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clients book a Cal.com slot (held as "requires confirmation"), pay via a Stripe Payment Link with promo codes, and the booking is auto-confirmed once a Stripe webhook verifies payment; Gabs manages exceptions at `/admin/bookings`.

**Architecture:** Two signed webhook routes (Stripe, Cal) feed a `bookings` table through a small, unit-tested store module that is idempotent and order-independent. The store talks to the DB through a `BookingsRepo` interface and to Cal through a `CalApi` interface, so all business logic is tested against in-memory fakes. The public Cal button "arms" a redirect; a single listener catches the embed's `bookingSuccessfulV2` event and sends the client to the Stripe link with `client_reference_id=<cal uid>`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (`@supabase/supabase-js` service-role client for webhooks), `stripe` Node SDK, Cal.com API v2, `@calcom/embed-react` 1.5.3, Vitest (new).

**Spec:** `docs/superpowers/specs/2026-10-04-booking-payment-verification-design.md`

## Global Constraints

- Flow: book first (Cal, "requires confirmation") → pay (Stripe Payment Link) → auto-confirm via Cal API.
- Unpaid bookings are **never** auto-declined. Declining is a manual admin action only.
- Booking ↔ payment link: Cal booking `uid` passed to Stripe as `client_reference_id`.
- Rollout is opt-in per service via `services.payment_url`; services without it behave exactly as today.
- Stripe sessions are recorded only if they carry `client_reference_id` **or** `metadata.booking_flow === "cal"` (so Quick Hit / Travel payments are ignored).
- Cal API: base `https://api.cal.com/v2`, header `cal-api-version: 2024-08-13`, `Authorization: Bearer <CAL_API_KEY>`.
- Env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CAL_API_KEY`, `CAL_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`. The service-role key must only be imported from server code (`lib/supabase/admin.ts`, API routes).
- Webhooks return 400 on bad signature, 500 on processing failure (so Stripe/Cal retry), 200 otherwise.
- Next.js 14: route handler params are `{ params: { id: string } }` (not a Promise). Match `app/api/admin/actions/[id]/route.ts`.
- Admin UI styling follows existing admin components (`#1a1a18` ink, `#6b6560` muted, `#e8e5df` borders, `bg-white rounded-xl` cards, `Toast` from `components/admin/ui/Toast`).

## File Structure

| File | Responsibility |
|---|---|
| `vitest.config.ts` (create) | Test runner config with `@/` alias |
| `lib/booking.ts` (modify) | Add `paymentUrl` to Cal target; `paymentLinkFor`, `withPaymentUrl` |
| `lib/payments/types.ts` (create) | `Booking`, statuses, `BookingsRepo`, `CalApi`, `PaymentInfo`, `CalBookingEvent` |
| `lib/payments/calWebhook.ts` (create) | Cal signature verification + payload parsing (pure) |
| `lib/payments/stripePayment.ts` (create) | Stripe client, signature verification, session → `PaymentInfo` |
| `lib/payments/bookingStore.ts` (create) | All state transitions (webhooks + admin actions) |
| `lib/payments/memoryRepo.ts` (create) | In-memory `BookingsRepo` for tests |
| `lib/payments/supabaseRepo.ts` (create) | Supabase-backed `BookingsRepo` |
| `lib/payments/calApi.ts` (create) | Cal API v2 confirm/decline client |
| `lib/payments/bookingView.ts` (create) | Pure display helpers for the admin page |
| `lib/payments/payRedirect.ts` (create) | Client-side "armed" payment URL state |
| `lib/supabase/admin.ts` (create) | Service-role Supabase client |
| `supabase/migrations/014_bookings_payments.sql` (create) | `services.payment_url` + `bookings` table + RLS |
| `app/api/webhooks/stripe/route.ts` (create) | Stripe webhook |
| `app/api/webhooks/cal/route.ts` (create) | Cal webhook |
| `app/api/admin/bookings/[id]/route.ts` (create) | Admin actions |
| `app/admin/bookings/page.tsx` (create) | Admin page (server) |
| `components/admin/bookings/BookingsListClient.tsx` (create) | Admin page UI |
| `components/admin/AdminNav.tsx` (modify) | Nav entry |
| `components/booking/PaymentRedirectListener.tsx` (create) | Embed event → Stripe redirect |
| `components/booking/CalBookButton.tsx`, `BookAction.tsx` (modify) | Arm redirect on click |
| `app/(public)/layout.tsx` (modify) | Mount listener |
| `types/index.ts`, `lib/services.ts`, `components/TarotDeck.tsx`, `components/admin/ServiceForm.tsx` (modify) | `payment_url` plumbing + admin field |
| `docs/BOOKING_PAYMENTS_SETUP.md` (create) | Env, Cal, Stripe setup + E2E checklist |

---

### Task 1: Test runner + payment link helpers

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (scripts + devDependency)
- Modify: `lib/booking.ts`
- Test: `lib/booking.test.ts`

**Interfaces:**
- Produces:
  - `BookingTarget` cal variant becomes `{ kind: "cal"; slug: string; paymentUrl?: string }`
  - `paymentLinkFor(paymentUrl: string, calUid: string): string`
  - `withPaymentUrl(target: BookingTarget | null, paymentUrl: string | null | undefined): BookingTarget | null`
  - `npm test` runs Vitest once (`vitest run`)

- [ ] **Step 1: Install Vitest and add script**

```bash
npm install --save-dev vitest@^2
npm pkg set scripts.test="vitest run"
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", "astrolab/**"],
  },
});
```

- [ ] **Step 3: Write the failing test** — `lib/booking.test.ts`

```ts
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
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- lib/booking.test.ts`
Expected: FAIL — `paymentLinkFor` / `withPaymentUrl` is not exported.

- [ ] **Step 5: Implement in `lib/booking.ts`**

Replace the `BookingTarget` type with:

```ts
export type BookingTarget =
  // paymentUrl: Stripe Payment Link the client is sent to after booking
  // (pay-after-booking flow). Set from services.payment_url via withPaymentUrl.
  | { kind: "cal"; slug: string; paymentUrl?: string }
  | { kind: "stripe"; url: string };
```

Append to the end of the file:

```ts
// Stripe Payment Link with the Cal booking uid attached, so the Stripe webhook
// can tie the payment back to the booking.
export function paymentLinkFor(paymentUrl: string, calUid: string): string {
  const url = new URL(paymentUrl);
  url.searchParams.set("client_reference_id", calUid);
  return url.toString();
}

// Attach a service's payment_url to a Cal booking target. Stripe targets and
// empty URLs pass through unchanged.
export function withPaymentUrl(
  target: BookingTarget | null,
  paymentUrl: string | null | undefined
): BookingTarget | null {
  const url = paymentUrl?.trim();
  if (!target || target.kind !== "cal" || !url) return target;
  return { ...target, paymentUrl: url };
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- lib/booking.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/booking.ts lib/booking.test.ts
git commit -m "feat(booking): add Vitest and payment link helpers"
```

---

### Task 2: Payment types + Cal webhook parsing

**Files:**
- Create: `lib/payments/types.ts`
- Create: `lib/payments/calWebhook.ts`
- Test: `lib/payments/calWebhook.test.ts`

**Interfaces:**
- Produces (types.ts — used by every later task):

```ts
export type CalStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "manual";
export interface Booking { /* see code below */ }
export type BookingFields = Omit<Booking, "id" | "created_at" | "updated_at">;
export type BookingPatch = Partial<BookingFields>;
export interface BookingsRepo { findById; findByCalUid; findByStripeSession; insert; update; remove }
export interface CalApi { confirm(uid: string): Promise<void>; decline(uid: string, reason?: string): Promise<void> }
export type PaymentInfo = { ... };
export type CalBookingEvent = { ... };
```

- Produces (calWebhook.ts):
  - `verifyCalSignature(rawBody: string, signature: string | null, secret: string): boolean`
  - `parseCalEvent(body: unknown): CalBookingEvent | null`

- [ ] **Step 1: Create `lib/payments/types.ts`**

```ts
// Shared types for the pay-after-booking flow (Cal.com booking → Stripe payment
// → Cal confirm). See docs/superpowers/specs/2026-10-04-booking-payment-verification-design.md

export type CalStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "manual";

export interface Booking {
  id: string;
  /** null = a Stripe payment we couldn't match to a booking. */
  cal_uid: string | null;
  service_slug: string | null;
  event_type_id: number | null;
  attendee_name: string | null;
  attendee_email: string | null;
  start_time: string | null;
  end_time: string | null;
  cal_status: CalStatus;
  payment_status: PaymentStatus;
  payment_method_note: string | null;
  stripe_session_id: string | null;
  amount_paid_cents: number | null;
  currency: string | null;
  promo_code: string | null;
  discount_cents: number | null;
  paid_at: string | null;
  confirmed_at: string | null;
  confirm_error: string | null;
  created_at: string;
  updated_at: string;
}

export type BookingFields = Omit<Booking, "id" | "created_at" | "updated_at">;
export type BookingPatch = Partial<BookingFields>;

export interface BookingsRepo {
  findById(id: string): Promise<Booking | null>;
  findByCalUid(uid: string): Promise<Booking | null>;
  findByStripeSession(sessionId: string): Promise<Booking | null>;
  insert(row: BookingFields): Promise<Booking>;
  update(id: string, patch: BookingPatch): Promise<Booking>;
  remove(id: string): Promise<void>;
}

export interface CalApi {
  confirm(uid: string): Promise<void>;
  decline(uid: string, reason?: string): Promise<void>;
}

/** A completed Stripe Checkout Session, reduced to what we store. */
export type PaymentInfo = {
  calUid: string | null;
  stripeSessionId: string;
  paid: boolean;
  /** true when the session came from a pay-after-booking Payment Link. */
  isBookingPayment: boolean;
  amountCents: number | null;
  currency: string | null;
  promoCode: string | null;
  discountCents: number | null;
  email: string | null;
  name: string | null;
};

/** A Cal.com webhook delivery, reduced to what we store. */
export type CalBookingEvent = {
  trigger: string;
  uid: string;
  /** Old uid when the booking was rescheduled (Cal issues a new uid). */
  previousUid: string | null;
  serviceSlug: string | null;
  eventTypeId: number | null;
  attendeeName: string | null;
  attendeeEmail: string | null;
  startTime: string | null;
  endTime: string | null;
  /** null = this trigger doesn't tell us the status. */
  calStatus: CalStatus | null;
};
```

- [ ] **Step 2: Write the failing test** — `lib/payments/calWebhook.test.ts`

```ts
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseCalEvent, verifyCalSignature } from "@/lib/payments/calWebhook";

const SECRET = "whsec_cal_test";
const sign = (body: string) =>
  createHmac("sha256", SECRET).update(body).digest("hex");

const requested = {
  triggerEvent: "BOOKING_REQUESTED",
  createdAt: "2026-10-04T10:00:00.000Z",
  payload: {
    uid: "cal_uid_1",
    type: "stellar-insights",
    eventTypeId: 42,
    startTime: "2026-10-10T09:00:00.000Z",
    endTime: "2026-10-10T10:00:00.000Z",
    status: "PENDING",
    attendees: [{ name: "Ada", email: "ada@example.com" }],
  },
};

describe("verifyCalSignature", () => {
  const body = JSON.stringify(requested);

  it("accepts a correct HMAC-SHA256 hex signature", () => {
    expect(verifyCalSignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects a wrong or missing signature", () => {
    expect(verifyCalSignature(body, sign(body + "x"), SECRET)).toBe(false);
    expect(verifyCalSignature(body, "short", SECRET)).toBe(false);
    expect(verifyCalSignature(body, null, SECRET)).toBe(false);
  });
});

describe("parseCalEvent", () => {
  it("parses BOOKING_REQUESTED as pending", () => {
    expect(parseCalEvent(requested)).toEqual({
      trigger: "BOOKING_REQUESTED",
      uid: "cal_uid_1",
      previousUid: null,
      serviceSlug: "stellar-insights",
      eventTypeId: 42,
      attendeeName: "Ada",
      attendeeEmail: "ada@example.com",
      startTime: "2026-10-10T09:00:00.000Z",
      endTime: "2026-10-10T10:00:00.000Z",
      calStatus: "pending",
    });
  });

  it("maps cancelled / rejected / created triggers", () => {
    const at = (trigger: string) =>
      parseCalEvent({ ...requested, triggerEvent: trigger })?.calStatus;
    expect(at("BOOKING_CANCELLED")).toBe("cancelled");
    expect(at("BOOKING_REJECTED")).toBe("rejected");
    expect(at("BOOKING_CREATED")).toBe("accepted");
  });

  it("reads rescheduleUid and payload status on reschedule", () => {
    const ev = parseCalEvent({
      triggerEvent: "BOOKING_RESCHEDULED",
      payload: { ...requested.payload, uid: "cal_uid_2", rescheduleUid: "cal_uid_1", status: "ACCEPTED" },
    });
    expect(ev?.uid).toBe("cal_uid_2");
    expect(ev?.previousUid).toBe("cal_uid_1");
    expect(ev?.calStatus).toBe("accepted");
  });

  it("returns null for unhandled triggers, missing uid, or junk", () => {
    expect(parseCalEvent({ ...requested, triggerEvent: "MEETING_ENDED" })).toBeNull();
    expect(parseCalEvent({ triggerEvent: "BOOKING_REQUESTED", payload: {} })).toBeNull();
    expect(parseCalEvent("nope")).toBeNull();
    expect(parseCalEvent(null)).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- lib/payments/calWebhook.test.ts`
Expected: FAIL — cannot resolve `@/lib/payments/calWebhook`.

- [ ] **Step 4: Implement `lib/payments/calWebhook.ts`**

```ts
// Cal.com webhook helpers (server-only: uses node:crypto).
// Cal signs the raw body with HMAC-SHA256 (hex) in the X-Cal-Signature-256 header.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { CalBookingEvent, CalStatus } from "@/lib/payments/types";

export function verifyCalSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  const expected = Buffer.from(
    createHmac("sha256", secret).update(rawBody).digest("hex"),
    "utf8"
  );
  const given = Buffer.from(signature, "utf8");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

const STATUS_BY_TRIGGER: Record<string, CalStatus | null> = {
  BOOKING_REQUESTED: "pending",
  BOOKING_CREATED: "accepted",
  BOOKING_CANCELLED: "cancelled",
  BOOKING_REJECTED: "rejected",
  // Reschedules carry their status in the payload instead.
  BOOKING_RESCHEDULED: null,
};

const PAYLOAD_STATUS: Record<string, CalStatus> = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
};

const str = (v: unknown) => (typeof v === "string" && v ? v : null);

export function parseCalEvent(body: unknown): CalBookingEvent | null {
  if (!body || typeof body !== "object") return null;
  const { triggerEvent, payload } = body as {
    triggerEvent?: unknown;
    payload?: Record<string, unknown>;
  };
  if (
    typeof triggerEvent !== "string" ||
    !Object.prototype.hasOwnProperty.call(STATUS_BY_TRIGGER, triggerEvent)
  ) {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;

  const uid = str(payload.uid);
  if (!uid) return null;

  const attendees = Array.isArray(payload.attendees) ? payload.attendees : [];
  const first = (attendees[0] ?? {}) as { name?: unknown; email?: unknown };

  const calStatus =
    STATUS_BY_TRIGGER[triggerEvent] ??
    PAYLOAD_STATUS[String(payload.status ?? "").toUpperCase()] ??
    null;

  return {
    trigger: triggerEvent,
    uid,
    previousUid: str(payload.rescheduleUid),
    serviceSlug: str(payload.type),
    eventTypeId: typeof payload.eventTypeId === "number" ? payload.eventTypeId : null,
    attendeeName: str(first.name),
    attendeeEmail: str(first.email),
    startTime: str(payload.startTime),
    endTime: str(payload.endTime),
    calStatus,
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- lib/payments/calWebhook.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/payments/types.ts lib/payments/calWebhook.ts lib/payments/calWebhook.test.ts
git commit -m "feat(payments): add booking types and Cal webhook parsing"
```

---

### Task 3: Stripe payment extraction

**Files:**
- Modify: `package.json` (add `stripe`)
- Create: `lib/payments/stripePayment.ts`
- Test: `lib/payments/stripePayment.test.ts`

**Interfaces:**
- Consumes: `PaymentInfo` from `lib/payments/types.ts`
- Produces:
  - `stripe(): Stripe` — lazily-created client from `STRIPE_SECRET_KEY`
  - `verifyStripeEvent(client: Stripe, rawBody: string, signature: string | null, secret: string): Stripe.Event` — throws on bad signature
  - `loadPayment(api: StripeLike, sessionId: string): Promise<PaymentInfo>`
  - `type StripeLike` — the two Stripe methods `loadPayment` uses (so tests can fake it)

- [ ] **Step 1: Install Stripe**

```bash
npm install stripe
```

- [ ] **Step 2: Write the failing test** — `lib/payments/stripePayment.test.ts`

```ts
import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import {
  loadPayment,
  verifyStripeEvent,
  type StripeLike,
} from "@/lib/payments/stripePayment";

function fakeStripe(session: Record<string, unknown>, promoCode = "SPRING20") {
  const retrieveSession = vi.fn().mockResolvedValue(session);
  const retrievePromo = vi.fn().mockResolvedValue({ id: "promo_1", code: promoCode });
  const api = {
    checkout: { sessions: { retrieve: retrieveSession } },
    promotionCodes: { retrieve: retrievePromo },
  } as unknown as StripeLike;
  return { api, retrieveSession, retrievePromo };
}

const base = {
  id: "cs_test_1",
  client_reference_id: "cal_uid_1",
  payment_status: "paid",
  amount_total: 5400,
  currency: "eur",
  metadata: {},
  customer_details: { email: "ada@example.com", name: "Ada" },
  total_details: { amount_discount: 0, breakdown: { discounts: [] } },
};

describe("loadPayment", () => {
  it("expands the discount breakdown and maps a plain payment", async () => {
    const { api, retrieveSession } = fakeStripe(base);
    const p = await loadPayment(api, "cs_test_1");
    expect(retrieveSession).toHaveBeenCalledWith("cs_test_1", {
      expand: ["total_details.breakdown"],
    });
    expect(p).toEqual({
      calUid: "cal_uid_1",
      stripeSessionId: "cs_test_1",
      paid: true,
      isBookingPayment: true,
      amountCents: 5400,
      currency: "eur",
      promoCode: null,
      discountCents: null,
      email: "ada@example.com",
      name: "Ada",
    });
  });

  it("resolves the promotion code text and discount amount", async () => {
    const { api, retrievePromo } = fakeStripe({
      ...base,
      total_details: {
        amount_discount: 1100,
        breakdown: {
          discounts: [{ amount: 1100, discount: { promotion_code: "promo_1" } }],
        },
      },
    });
    const p = await loadPayment(api, "cs_test_1");
    expect(retrievePromo).toHaveBeenCalledWith("promo_1");
    expect(p.promoCode).toBe("SPRING20");
    expect(p.discountCents).toBe(1100);
  });

  it("falls back to the coupon name when no promotion code is attached", async () => {
    const { api, retrievePromo } = fakeStripe({
      ...base,
      total_details: {
        amount_discount: 500,
        breakdown: {
          discounts: [{ amount: 500, discount: { promotion_code: null, coupon: { name: "Friends" } } }],
        },
      },
    });
    const p = await loadPayment(api, "cs_test_1");
    expect(retrievePromo).not.toHaveBeenCalled();
    expect(p.promoCode).toBe("Friends");
  });

  it("flags booking payments by reference or metadata, and unpaid sessions", async () => {
    const plain = fakeStripe({ ...base, client_reference_id: null });
    expect((await loadPayment(plain.api, "cs")).isBookingPayment).toBe(false);

    const tagged = fakeStripe({ ...base, client_reference_id: null, metadata: { booking_flow: "cal" } });
    expect((await loadPayment(tagged.api, "cs")).isBookingPayment).toBe(true);

    const unpaid = fakeStripe({ ...base, payment_status: "unpaid" });
    expect((await loadPayment(unpaid.api, "cs")).paid).toBe(false);
  });
});

describe("verifyStripeEvent", () => {
  const client = new Stripe("sk_test_dummy");
  const secret = "whsec_test";
  const payload = JSON.stringify({ id: "evt_1", object: "event", type: "checkout.session.completed", data: { object: { id: "cs_test_1" } } });

  it("accepts a correctly signed payload", () => {
    const header = client.webhooks.generateTestHeaderString({ payload, secret });
    expect(verifyStripeEvent(client, payload, header, secret).id).toBe("evt_1");
  });

  it("throws on a bad or missing signature", () => {
    expect(() => verifyStripeEvent(client, payload, "t=1,v1=bad", secret)).toThrow();
    expect(() => verifyStripeEvent(client, payload, null, secret)).toThrow();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- lib/payments/stripePayment.test.ts`
Expected: FAIL — cannot resolve `@/lib/payments/stripePayment`.

- [ ] **Step 4: Implement `lib/payments/stripePayment.ts`**

```ts
// Stripe helpers for the pay-after-booking flow (server-only).

import Stripe from "stripe";
import type { PaymentInfo } from "@/lib/payments/types";

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key);
  }
  return client;
}

export function verifyStripeEvent(
  api: Stripe,
  rawBody: string,
  signature: string | null,
  secret: string
): Stripe.Event {
  if (!signature) throw new Error("Missing stripe-signature header");
  return api.webhooks.constructEvent(rawBody, signature, secret);
}

/** The subset of the Stripe client loadPayment needs — lets tests pass a fake. */
export type StripeLike = {
  checkout: { sessions: Pick<Stripe.Checkout.SessionsResource, "retrieve"> };
  promotionCodes: Pick<Stripe.PromotionCodesResource, "retrieve">;
};

// Loosely typed on purpose: discount shapes differ between Stripe API versions.
type DiscountLike = {
  amount?: number;
  discount?: {
    promotion_code?: string | { id?: string; code?: string } | null;
    coupon?: { name?: string | null } | null;
  } | null;
};

type SessionLike = {
  id: string;
  client_reference_id: string | null;
  payment_status: string;
  amount_total: number | null;
  currency: string | null;
  metadata?: Record<string, string> | null;
  customer_details?: { email?: string | null; name?: string | null } | null;
  total_details?: {
    amount_discount?: number;
    breakdown?: { discounts?: DiscountLike[] } | null;
  } | null;
};

async function promoCodeFor(
  api: StripeLike,
  discount: DiscountLike | undefined
): Promise<string | null> {
  const ref = discount?.discount?.promotion_code;
  if (typeof ref === "string") {
    const promo = await api.promotionCodes.retrieve(ref);
    return promo.code ?? null;
  }
  if (ref && typeof ref === "object" && ref.code) return ref.code;
  return discount?.discount?.coupon?.name ?? null;
}

export async function loadPayment(
  api: StripeLike,
  sessionId: string
): Promise<PaymentInfo> {
  const session = (await api.checkout.sessions.retrieve(sessionId, {
    expand: ["total_details.breakdown"],
  })) as unknown as SessionLike;

  const discounts = session.total_details?.breakdown?.discounts ?? [];
  const discountCents = session.total_details?.amount_discount || null;
  const calUid = session.client_reference_id || null;

  return {
    calUid,
    stripeSessionId: session.id,
    paid: session.payment_status === "paid",
    isBookingPayment: !!calUid || session.metadata?.booking_flow === "cal",
    amountCents: session.amount_total,
    currency: session.currency,
    promoCode: discounts.length ? await promoCodeFor(api, discounts[0]) : null,
    discountCents,
    email: session.customer_details?.email ?? null,
    name: session.customer_details?.name ?? null,
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- lib/payments/stripePayment.test.ts`
Expected: PASS (6 tests). If TypeScript rejects `Pick<Stripe.Checkout.SessionsResource, "retrieve">` because the installed SDK names the resource class differently, check `node_modules/stripe/types/Checkout/SessionsResource.d.ts` for the exported class name and use it.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/payments/stripePayment.ts lib/payments/stripePayment.test.ts
git commit -m "feat(payments): load Stripe checkout sessions with promo codes"
```

---

### Task 4: Booking store (all state transitions)

**Files:**
- Create: `lib/payments/memoryRepo.ts`
- Create: `lib/payments/bookingStore.ts`
- Test: `lib/payments/bookingStore.test.ts`

**Interfaces:**
- Consumes: `Booking`, `BookingFields`, `BookingsRepo`, `CalApi`, `PaymentInfo`, `CalBookingEvent` (Task 2)
- Produces:
  - `memoryRepo(): BookingsRepo & { rows: Booking[] }`
  - `class BookingActionError extends Error { status: number }`
  - `recordCalEvent(repo, ev: CalBookingEvent): Promise<Booking>`
  - `recordPayment(repo, p: PaymentInfo): Promise<{ booking: Booking; duplicate: boolean }>`
  - `confirmInCal(repo, cal, booking: Booking): Promise<Booking>`
  - `confirmById(repo, cal, id: string): Promise<Booking>`
  - `markPaidManually(repo, cal, id: string, note: string): Promise<Booking>`
  - `declineBooking(repo, cal, id: string, reason?: string): Promise<Booking>`
  - `linkPayment(repo, cal, paymentRowId: string, bookingId: string): Promise<Booking>`

- [ ] **Step 1: Create the in-memory repo** — `lib/payments/memoryRepo.ts`

```ts
// In-memory BookingsRepo for tests. Enforces the same uniqueness rules as the DB.

import type { Booking, BookingFields, BookingsRepo } from "@/lib/payments/types";

export function memoryRepo(): BookingsRepo & { rows: Booking[] } {
  const rows: Booking[] = [];
  let seq = 0;
  const unique = (row: Booking) => {
    for (const other of rows) {
      if (other.id === row.id) continue;
      if (row.cal_uid && other.cal_uid === row.cal_uid) throw new Error("duplicate cal_uid");
      if (row.stripe_session_id && other.stripe_session_id === row.stripe_session_id) {
        throw new Error("duplicate stripe_session_id");
      }
    }
  };

  return {
    rows,
    async findById(id) {
      return rows.find((r) => r.id === id) ?? null;
    },
    async findByCalUid(uid) {
      return rows.find((r) => r.cal_uid === uid) ?? null;
    },
    async findByStripeSession(sessionId) {
      return rows.find((r) => r.stripe_session_id === sessionId) ?? null;
    },
    async insert(fields: BookingFields) {
      const now = new Date().toISOString();
      const row: Booking = { ...fields, id: `b${++seq}`, created_at: now, updated_at: now };
      unique(row);
      rows.push(row);
      return row;
    },
    async update(id, patch) {
      const i = rows.findIndex((r) => r.id === id);
      if (i < 0) throw new Error("not found");
      const next = { ...rows[i], ...patch, updated_at: new Date().toISOString() };
      unique(next);
      rows[i] = next;
      return next;
    },
    async remove(id) {
      const i = rows.findIndex((r) => r.id === id);
      if (i >= 0) rows.splice(i, 1);
    },
  };
}
```

- [ ] **Step 2: Write the failing test** — `lib/payments/bookingStore.test.ts`

```ts
import { describe, expect, it, vi } from "vitest";
import { memoryRepo } from "@/lib/payments/memoryRepo";
import {
  BookingActionError,
  confirmById,
  confirmInCal,
  declineBooking,
  linkPayment,
  markPaidManually,
  recordCalEvent,
  recordPayment,
} from "@/lib/payments/bookingStore";
import type { CalApi, CalBookingEvent, PaymentInfo } from "@/lib/payments/types";

const calEvent = (over: Partial<CalBookingEvent> = {}): CalBookingEvent => ({
  trigger: "BOOKING_REQUESTED",
  uid: "u1",
  previousUid: null,
  serviceSlug: "stellar-insights",
  eventTypeId: 42,
  attendeeName: "Ada",
  attendeeEmail: "ada@example.com",
  startTime: "2026-10-10T09:00:00.000Z",
  endTime: "2026-10-10T10:00:00.000Z",
  calStatus: "pending",
  ...over,
});

const payment = (over: Partial<PaymentInfo> = {}): PaymentInfo => ({
  calUid: "u1",
  stripeSessionId: "cs_1",
  paid: true,
  isBookingPayment: true,
  amountCents: 5400,
  currency: "eur",
  promoCode: "SPRING20",
  discountCents: 1100,
  email: "ada@example.com",
  name: "Ada",
  ...over,
});

const okCal = (): CalApi & { confirm: ReturnType<typeof vi.fn>; decline: ReturnType<typeof vi.fn> } => ({
  confirm: vi.fn().mockResolvedValue(undefined),
  decline: vi.fn().mockResolvedValue(undefined),
});

describe("recordCalEvent", () => {
  it("inserts a pending, unpaid booking", async () => {
    const repo = memoryRepo();
    const b = await recordCalEvent(repo, calEvent());
    expect(b).toMatchObject({
      cal_uid: "u1",
      service_slug: "stellar-insights",
      attendee_email: "ada@example.com",
      cal_status: "pending",
      payment_status: "unpaid",
    });
    expect(repo.rows).toHaveLength(1);
  });

  it("does not downgrade a non-pending booking back to pending", async () => {
    const repo = memoryRepo();
    const b = await recordCalEvent(repo, calEvent());
    await repo.update(b.id, { cal_status: "accepted" });
    const again = await recordCalEvent(repo, calEvent());
    expect(again.cal_status).toBe("accepted");
  });

  it("applies cancellations", async () => {
    const repo = memoryRepo();
    await recordCalEvent(repo, calEvent());
    const b = await recordCalEvent(repo, calEvent({ trigger: "BOOKING_CANCELLED", calStatus: "cancelled" }));
    expect(b.cal_status).toBe("cancelled");
  });

  it("moves a rescheduled booking (and its payment) to the new uid", async () => {
    const repo = memoryRepo();
    await recordCalEvent(repo, calEvent());
    await recordPayment(repo, payment());
    const b = await recordCalEvent(
      repo,
      calEvent({ trigger: "BOOKING_RESCHEDULED", uid: "u2", previousUid: "u1", startTime: "2026-10-12T09:00:00.000Z", calStatus: "accepted" })
    );
    expect(repo.rows).toHaveLength(1);
    expect(b).toMatchObject({ cal_uid: "u2", start_time: "2026-10-12T09:00:00.000Z", payment_status: "paid" });
  });
});

describe("recordPayment", () => {
  it("marks an existing booking paid with promo details", async () => {
    const repo = memoryRepo();
    await recordCalEvent(repo, calEvent());
    const { booking, duplicate } = await recordPayment(repo, payment());
    expect(duplicate).toBe(false);
    expect(booking).toMatchObject({
      cal_uid: "u1",
      payment_status: "paid",
      stripe_session_id: "cs_1",
      amount_paid_cents: 5400,
      promo_code: "SPRING20",
      discount_cents: 1100,
    });
    expect(booking.paid_at).not.toBeNull();
  });

  it("creates the row when Stripe arrives before Cal, and Cal fills it in later", async () => {
    const repo = memoryRepo();
    await recordPayment(repo, payment({ name: null }));
    const b = await recordCalEvent(repo, calEvent());
    expect(repo.rows).toHaveLength(1);
    expect(b).toMatchObject({ payment_status: "paid", attendee_name: "Ada", service_slug: "stellar-insights" });
  });

  it("is a no-op for a replayed session", async () => {
    const repo = memoryRepo();
    await recordPayment(repo, payment());
    const again = await recordPayment(repo, payment());
    expect(again.duplicate).toBe(true);
    expect(repo.rows).toHaveLength(1);
  });

  it("records payments without a booking uid as unmatched", async () => {
    const repo = memoryRepo();
    const { booking } = await recordPayment(repo, payment({ calUid: null }));
    expect(booking.cal_uid).toBeNull();
    expect(booking.payment_status).toBe("paid");
  });

  it("records a second payment for an already-paid booking as unmatched", async () => {
    const repo = memoryRepo();
    await recordPayment(repo, payment());
    const { booking } = await recordPayment(repo, payment({ stripeSessionId: "cs_2" }));
    expect(booking.cal_uid).toBeNull();
    expect(repo.rows).toHaveLength(2);
  });
});

describe("confirmInCal", () => {
  it("confirms a pending booking and clears any old error", async () => {
    const repo = memoryRepo();
    const cal = okCal();
    const b = await recordCalEvent(repo, calEvent());
    await repo.update(b.id, { confirm_error: "old" });
    const done = await confirmInCal(repo, cal, (await repo.findById(b.id))!);
    expect(cal.confirm).toHaveBeenCalledWith("u1");
    expect(done).toMatchObject({ cal_status: "accepted", confirm_error: null });
    expect(done.confirmed_at).not.toBeNull();
  });

  it("stores the error when Cal fails", async () => {
    const repo = memoryRepo();
    const cal = okCal();
    cal.confirm.mockRejectedValue(new Error("Cal down"));
    const b = await recordCalEvent(repo, calEvent());
    const done = await confirmInCal(repo, cal, b);
    expect(done).toMatchObject({ cal_status: "pending", confirm_error: "Cal down" });
  });

  it("skips bookings that are not pending or have no uid", async () => {
    const repo = memoryRepo();
    const cal = okCal();
    const b = await recordCalEvent(repo, calEvent({ calStatus: "accepted", trigger: "BOOKING_CREATED" }));
    await confirmInCal(repo, cal, b);
    const { booking: unmatched } = await recordPayment(repo, payment({ calUid: null, stripeSessionId: "cs_9" }));
    await confirmInCal(repo, cal, unmatched);
    expect(cal.confirm).not.toHaveBeenCalled();
  });
});

describe("admin actions", () => {
  it("confirmById refuses unpaid bookings", async () => {
    const repo = memoryRepo();
    const b = await recordCalEvent(repo, calEvent());
    await expect(confirmById(repo, okCal(), b.id)).rejects.toBeInstanceOf(BookingActionError);
  });

  it("markPaidManually records the note and confirms", async () => {
    const repo = memoryRepo();
    const cal = okCal();
    const b = await recordCalEvent(repo, calEvent());
    const done = await markPaidManually(repo, cal, b.id, "bank transfer");
    expect(done).toMatchObject({ payment_status: "manual", payment_method_note: "bank transfer", cal_status: "accepted" });
    await expect(markPaidManually(repo, cal, b.id, "again")).rejects.toThrow(/already/);
  });

  it("declineBooking rejects in Cal and records it", async () => {
    const repo = memoryRepo();
    const cal = okCal();
    const b = await recordCalEvent(repo, calEvent());
    const done = await declineBooking(repo, cal, b.id, "No payment received");
    expect(cal.decline).toHaveBeenCalledWith("u1", "No payment received");
    expect(done.cal_status).toBe("rejected");
  });

  it("linkPayment moves an unmatched payment onto a booking and confirms", async () => {
    const repo = memoryRepo();
    const cal = okCal();
    const b = await recordCalEvent(repo, calEvent());
    const { booking: unmatched } = await recordPayment(repo, payment({ calUid: null }));
    const done = await linkPayment(repo, cal, unmatched.id, b.id);
    expect(repo.rows).toHaveLength(1);
    expect(done).toMatchObject({ id: b.id, payment_status: "paid", stripe_session_id: "cs_1", promo_code: "SPRING20", cal_status: "accepted" });
  });

  it("linkPayment refuses rows that aren't an unmatched payment + unpaid booking", async () => {
    const repo = memoryRepo();
    const b = await recordCalEvent(repo, calEvent());
    await expect(linkPayment(repo, okCal(), b.id, b.id)).rejects.toBeInstanceOf(BookingActionError);
  });

  it("throws a 404 BookingActionError for unknown ids", async () => {
    const err = await confirmById(memoryRepo(), okCal(), "nope").catch((e) => e);
    expect(err).toBeInstanceOf(BookingActionError);
    expect(err.status).toBe(404);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- lib/payments/bookingStore.test.ts`
Expected: FAIL — cannot resolve `@/lib/payments/bookingStore`.

- [ ] **Step 4: Implement `lib/payments/bookingStore.ts`**

```ts
// Booking/payment state transitions, shared by the Stripe + Cal webhooks and the
// admin actions. Every write is idempotent and order-independent: whichever
// webhook arrives first creates the row, the other fills it in.

import type {
  Booking,
  BookingFields,
  BookingPatch,
  BookingsRepo,
  CalApi,
  CalBookingEvent,
  PaymentInfo,
} from "@/lib/payments/types";

export class BookingActionError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "BookingActionError";
  }
}

const EMPTY: BookingFields = {
  cal_uid: null,
  service_slug: null,
  event_type_id: null,
  attendee_name: null,
  attendee_email: null,
  start_time: null,
  end_time: null,
  cal_status: "pending",
  payment_status: "unpaid",
  payment_method_note: null,
  stripe_session_id: null,
  amount_paid_cents: null,
  currency: null,
  promo_code: null,
  discount_cents: null,
  paid_at: null,
  confirmed_at: null,
  confirm_error: null,
};

const now = () => new Date().toISOString();
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

async function mustFind(repo: BookingsRepo, id: string): Promise<Booking> {
  const booking = await repo.findById(id);
  if (!booking) throw new BookingActionError("Booking not found", 404);
  return booking;
}

export async function recordCalEvent(
  repo: BookingsRepo,
  ev: CalBookingEvent
): Promise<Booking> {
  let existing = await repo.findByCalUid(ev.uid);
  if (!existing && ev.previousUid) existing = await repo.findByCalUid(ev.previousUid);

  const patch: BookingPatch = { cal_uid: ev.uid };
  if (ev.serviceSlug) patch.service_slug = ev.serviceSlug;
  if (ev.eventTypeId !== null) patch.event_type_id = ev.eventTypeId;
  if (ev.attendeeName) patch.attendee_name = ev.attendeeName;
  if (ev.attendeeEmail) patch.attendee_email = ev.attendeeEmail;
  if (ev.startTime) patch.start_time = ev.startTime;
  if (ev.endTime) patch.end_time = ev.endTime;

  // A late BOOKING_REQUESTED must never undo a confirm/cancel we already saw.
  const downgrade = ev.calStatus === "pending" && existing && existing.cal_status !== "pending";
  if (ev.calStatus && !downgrade) patch.cal_status = ev.calStatus;

  if (existing) return repo.update(existing.id, patch);
  return repo.insert({ ...EMPTY, ...patch });
}

export async function recordPayment(
  repo: BookingsRepo,
  p: PaymentInfo
): Promise<{ booking: Booking; duplicate: boolean }> {
  const seen = await repo.findByStripeSession(p.stripeSessionId);
  if (seen) return { booking: seen, duplicate: true };

  const paid: BookingPatch = {
    payment_status: "paid",
    stripe_session_id: p.stripeSessionId,
    amount_paid_cents: p.amountCents,
    currency: p.currency,
    promo_code: p.promoCode,
    discount_cents: p.discountCents,
    paid_at: now(),
  };

  if (p.calUid) {
    const existing = await repo.findByCalUid(p.calUid);
    if (!existing) {
      const booking = await repo.insert({
        ...EMPTY,
        ...paid,
        cal_uid: p.calUid,
        attendee_name: p.name,
        attendee_email: p.email,
      });
      return { booking, duplicate: false };
    }
    if (existing.payment_status === "unpaid") {
      const booking = await repo.update(existing.id, {
        ...paid,
        attendee_name: existing.attendee_name ?? p.name,
        attendee_email: existing.attendee_email ?? p.email,
      });
      return { booking, duplicate: false };
    }
    // Already paid by another session → fall through so Gabs sees it.
  }

  const booking = await repo.insert({
    ...EMPTY,
    ...paid,
    attendee_name: p.name,
    attendee_email: p.email,
  });
  return { booking, duplicate: false };
}

export async function confirmInCal(
  repo: BookingsRepo,
  cal: CalApi,
  booking: Booking
): Promise<Booking> {
  if (!booking.cal_uid || booking.cal_status !== "pending") return booking;
  try {
    await cal.confirm(booking.cal_uid);
    return repo.update(booking.id, {
      cal_status: "accepted",
      confirmed_at: now(),
      confirm_error: null,
    });
  } catch (e) {
    return repo.update(booking.id, { confirm_error: message(e) });
  }
}

export async function confirmById(
  repo: BookingsRepo,
  cal: CalApi,
  id: string
): Promise<Booking> {
  const booking = await mustFind(repo, id);
  if (booking.payment_status === "unpaid") {
    throw new BookingActionError("Booking is not paid yet");
  }
  return confirmInCal(repo, cal, booking);
}

export async function markPaidManually(
  repo: BookingsRepo,
  cal: CalApi,
  id: string,
  note: string
): Promise<Booking> {
  const booking = await mustFind(repo, id);
  if (booking.payment_status !== "unpaid") {
    throw new BookingActionError("Booking is already paid");
  }
  const updated = await repo.update(id, {
    payment_status: "manual",
    payment_method_note: note,
    paid_at: now(),
  });
  return confirmInCal(repo, cal, updated);
}

export async function declineBooking(
  repo: BookingsRepo,
  cal: CalApi,
  id: string,
  reason?: string
): Promise<Booking> {
  const booking = await mustFind(repo, id);
  if (!booking.cal_uid || booking.cal_status !== "pending") {
    throw new BookingActionError("Only pending bookings can be declined");
  }
  await cal.decline(booking.cal_uid, reason);
  return repo.update(id, { cal_status: "rejected" });
}

export async function linkPayment(
  repo: BookingsRepo,
  cal: CalApi,
  paymentRowId: string,
  bookingId: string
): Promise<Booking> {
  const payment = await mustFind(repo, paymentRowId);
  const booking = await mustFind(repo, bookingId);
  if (payment.cal_uid !== null || !payment.stripe_session_id) {
    throw new BookingActionError("Source row is not an unmatched payment");
  }
  if (!booking.cal_uid || booking.payment_status !== "unpaid") {
    throw new BookingActionError("Target booking must be an unpaid Cal booking");
  }
  // Remove first: stripe_session_id is unique.
  await repo.remove(payment.id);
  const updated = await repo.update(booking.id, {
    payment_status: "paid",
    stripe_session_id: payment.stripe_session_id,
    amount_paid_cents: payment.amount_paid_cents,
    currency: payment.currency,
    promo_code: payment.promo_code,
    discount_cents: payment.discount_cents,
    paid_at: payment.paid_at,
  });
  return confirmInCal(repo, cal, updated);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- lib/payments/bookingStore.test.ts`
Expected: PASS (18 tests)

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/payments/memoryRepo.ts lib/payments/bookingStore.ts lib/payments/bookingStore.test.ts
git commit -m "feat(payments): booking store with idempotent webhook + admin transitions"
```

---

### Task 5: Database migration, Supabase repo, Cal API client

**Files:**
- Create: `supabase/migrations/014_bookings_payments.sql`
- Create: `lib/supabase/admin.ts`
- Create: `lib/payments/supabaseRepo.ts`
- Create: `lib/payments/calApi.ts`
- Test: `lib/payments/calApi.test.ts`

**Interfaces:**
- Consumes: `Booking`, `BookingFields`, `BookingPatch`, `BookingsRepo`, `CalApi` (Task 2)
- Produces:
  - `createAdminClient(): SupabaseClient` (service role; server-only)
  - `supabaseBookingsRepo(db: SupabaseClient): BookingsRepo`
  - `calApi(apiKey?: string, fetchImpl?: typeof fetch): CalApi`

- [ ] **Step 1: Write the migration** — `supabase/migrations/014_bookings_payments.sql`

```sql
-- ============================================
-- 014: Pay-after-booking (Cal.com → Stripe Payment Link → Cal confirm)
-- Spec: docs/superpowers/specs/2026-10-04-booking-payment-verification-design.md
-- ============================================

-- Stripe Payment Link the client is sent to after booking. Opt-in per service:
-- empty = the service keeps its current booking behaviour.
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS payment_url text;

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- null = a Stripe payment we couldn't match to a booking
  cal_uid text UNIQUE,
  service_slug text,
  event_type_id integer,
  attendee_name text,
  attendee_email text,
  start_time timestamptz,
  end_time timestamptz,
  cal_status text NOT NULL DEFAULT 'pending'
    CHECK (cal_status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  payment_status text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'manual')),
  payment_method_note text,
  stripe_session_id text UNIQUE,
  amount_paid_cents integer,
  currency text,
  promo_code text,
  discount_cents integer,
  paid_at timestamptz,
  confirmed_at timestamptz,
  confirm_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_start_time_idx ON bookings (start_time);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Admins read + update (same pattern as 007). No anon access at all.
-- Inserts/deletes happen only through the service role (webhooks, admin API),
-- which bypasses RLS.
DROP POLICY IF EXISTS "Admin: read bookings" ON bookings;
CREATE POLICY "Admin: read bookings" ON bookings
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin: update bookings" ON bookings;
CREATE POLICY "Admin: update bookings" ON bookings
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP `apply_migration` tool (name `014_bookings_payments`, the SQL above), or paste it into the Supabase SQL editor. Then verify:

```sql
select column_name from information_schema.columns
where table_name = 'bookings' order by ordinal_position;
```

Expected: 21 columns, `id` … `updated_at`. And `select payment_url from services limit 1;` succeeds.

- [ ] **Step 3: Create the service-role client** — `lib/supabase/admin.ts`

```ts
// Service-role Supabase client. Bypasses RLS — import ONLY from server code
// (API routes / webhooks), never from a component.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createAdminClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

- [ ] **Step 4: Create the Supabase repo** — `lib/payments/supabaseRepo.ts`

```ts
// BookingsRepo backed by the Supabase `bookings` table (migration 014).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Booking, BookingsRepo } from "@/lib/payments/types";

type Result = { data: unknown; error: { message: string } | null };

async function row(query: PromiseLike<Result>): Promise<Booking | null> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Booking | null) ?? null;
}

async function mustRow(query: PromiseLike<Result>): Promise<Booking> {
  const booking = await row(query);
  if (!booking) throw new Error("Booking write returned no row");
  return booking;
}

export function supabaseBookingsRepo(db: SupabaseClient): BookingsRepo {
  const table = () => db.from("bookings");
  return {
    findById: (id) => row(table().select("*").eq("id", id).maybeSingle()),
    findByCalUid: (uid) => row(table().select("*").eq("cal_uid", uid).maybeSingle()),
    findByStripeSession: (sessionId) =>
      row(table().select("*").eq("stripe_session_id", sessionId).maybeSingle()),
    insert: (fields) => mustRow(table().insert(fields).select("*").single()),
    update: (id, patch) =>
      mustRow(
        table()
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select("*")
          .single()
      ),
    async remove(id) {
      const { error } = await table().delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
  };
}
```

- [ ] **Step 5: Write the failing Cal API test** — `lib/payments/calApi.test.ts`

```ts
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
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- lib/payments/calApi.test.ts`
Expected: FAIL — cannot resolve `@/lib/payments/calApi`.

- [ ] **Step 7: Implement `lib/payments/calApi.ts`**

```ts
// Minimal Cal.com API v2 client: confirm / decline bookings that require
// confirmation. Docs: https://cal.com/docs/api-reference/v2/bookings/confirm-a-booking

import type { CalApi } from "@/lib/payments/types";

const CAL_API = "https://api.cal.com/v2";
const CAL_API_VERSION = "2024-08-13";

export function calApi(
  apiKey: string | undefined = process.env.CAL_API_KEY,
  fetchImpl: typeof fetch = fetch
): CalApi {
  async function post(path: string, body: unknown) {
    if (!apiKey) throw new Error("CAL_API_KEY is not set");
    const res = await fetchImpl(`${CAL_API}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "cal-api-version": CAL_API_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Cal ${path} failed (${res.status}): ${text.slice(0, 300)}`);
    }
  }

  return {
    confirm: (uid) => post(`/bookings/${encodeURIComponent(uid)}/confirm`, {}),
    decline: (uid, reason) =>
      post(`/bookings/${encodeURIComponent(uid)}/decline`, reason ? { reason } : {}),
  };
}
```

- [ ] **Step 8: Run tests and typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: all tests PASS, no type errors.

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/014_bookings_payments.sql lib/supabase/admin.ts lib/payments/supabaseRepo.ts lib/payments/calApi.ts lib/payments/calApi.test.ts
git commit -m "feat(payments): bookings table, Supabase repo and Cal API client"
```

---

### Task 6: Webhook routes

**Files:**
- Create: `app/api/webhooks/stripe/route.ts`
- Create: `app/api/webhooks/cal/route.ts`

**Interfaces:**
- Consumes: `stripe`, `verifyStripeEvent`, `loadPayment` (Task 3); `verifyCalSignature`, `parseCalEvent` (Task 2); `recordPayment`, `recordCalEvent`, `confirmInCal` (Task 4); `createAdminClient`, `supabaseBookingsRepo`, `calApi` (Task 5)
- Produces: `POST /api/webhooks/stripe`, `POST /api/webhooks/cal`

- [ ] **Step 1: Create the Stripe webhook** — `app/api/webhooks/stripe/route.ts`

```ts
/**
 * Stripe webhook: a pay-after-booking Payment Link was paid → record the
 * payment and confirm the Cal booking it references (client_reference_id).
 *
 * Returns 500 on processing errors so Stripe retries; the store is idempotent.
 */

import { NextRequest, NextResponse } from "next/server";
import { loadPayment, stripe, verifyStripeEvent } from "@/lib/payments/stripePayment";
import { confirmInCal, recordPayment } from "@/lib/payments/bookingStore";
import { supabaseBookingsRepo } from "@/lib/payments/supabaseRepo";
import { calApi } from "@/lib/payments/calApi";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HANDLED = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  let event;
  try {
    event = verifyStripeEvent(stripe(), rawBody, req.headers.get("stripe-signature"), secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!HANDLED.has(event.type)) return NextResponse.json({ received: true });

  try {
    const sessionId = (event.data.object as { id: string }).id;
    const payment = await loadPayment(stripe(), sessionId);
    // Quick Hit / Travel and other links aren't part of this flow.
    if (!payment.isBookingPayment || !payment.paid) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const repo = supabaseBookingsRepo(createAdminClient());
    const { booking, duplicate } = await recordPayment(repo, payment);
    if (!duplicate) await confirmInCal(repo, calApi(), booking);

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[webhooks/stripe]", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create the Cal webhook** — `app/api/webhooks/cal/route.ts`

```ts
/**
 * Cal.com webhook: keep the bookings table in sync with Cal (requested,
 * created, cancelled, rejected, rescheduled).
 *
 * Returns 500 on processing errors so Cal retries; the store is idempotent.
 */

import { NextRequest, NextResponse } from "next/server";
import { parseCalEvent, verifyCalSignature } from "@/lib/payments/calWebhook";
import { recordCalEvent } from "@/lib/payments/bookingStore";
import { supabaseBookingsRepo } from "@/lib/payments/supabaseRepo";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  if (!verifyCalSignature(rawBody, req.headers.get("x-cal-signature-256"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = parseCalEvent(body);
  // Cal sends a PING when you save the webhook, plus triggers we don't track.
  if (!event) return NextResponse.json({ received: true, ignored: true });

  try {
    await recordCalEvent(supabaseBookingsRepo(createAdminClient()), event);
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[webhooks/cal]", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Typecheck and build**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds; route list includes `ƒ /api/webhooks/cal` and `ƒ /api/webhooks/stripe`.

- [ ] **Step 4: Smoke-test signature rejection locally**

Add to `.env.local` (dummy values are fine for this check):

```
STRIPE_WEBHOOK_SECRET=whsec_local_dummy
CAL_WEBHOOK_SECRET=cal_local_dummy
STRIPE_SECRET_KEY=sk_test_dummy
```

Start the dev server with the preview tool (or `npm run dev` in a terminal), then:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3000/api/webhooks/stripe -d '{}'
```

Expected: `400`

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3000/api/webhooks/cal -H "x-cal-signature-256: bad" -d '{}'
```

Expected: `400`

```bash
BODY='{"triggerEvent":"PING","payload":{}}'; SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac cal_local_dummy -hex | sed 's/^.* //'); curl -s -X POST localhost:3000/api/webhooks/cal -H "x-cal-signature-256: $SIG" -d "$BODY"
```

Expected: `{"received":true,"ignored":true}`

- [ ] **Step 5: Commit**

```bash
git add app/api/webhooks
git commit -m "feat(payments): Stripe and Cal.com webhook routes"
```

---

### Task 7: Admin bookings page + actions

**Files:**
- Create: `lib/payments/bookingView.ts`
- Test: `lib/payments/bookingView.test.ts`
- Create: `app/api/admin/bookings/[id]/route.ts`
- Create: `app/admin/bookings/page.tsx`
- Create: `components/admin/bookings/BookingsListClient.tsx`
- Modify: `components/admin/AdminNav.tsx` (navLinks array)

**Interfaces:**
- Consumes: store actions + `BookingActionError` (Task 4); `createAdminClient`, `supabaseBookingsRepo`, `calApi` (Task 5); `paymentLinkFor` (Task 1); `Booking` (Task 2)
- Produces:
  - `formatMoney(cents: number, currency: string): string`
  - `paymentSummary(b: Booking): string`
  - `needsAttention(b: Booking): boolean`
  - `isUpcoming(b: Booking, now?: Date): boolean`
  - `POST /api/admin/bookings/[id]` with body `{ action: "mark_paid", note }` | `{ action: "confirm" }` | `{ action: "decline", reason? }` | `{ action: "link", bookingId }` → `{ booking }` or `{ error }`

- [ ] **Step 1: Write the failing view test** — `lib/payments/bookingView.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { formatMoney, isUpcoming, needsAttention, paymentSummary } from "@/lib/payments/bookingView";
import type { Booking } from "@/lib/payments/types";

const b = (over: Partial<Booking> = {}): Booking => ({
  id: "b1",
  cal_uid: "u1",
  service_slug: "stellar-insights",
  event_type_id: 42,
  attendee_name: "Ada",
  attendee_email: "ada@example.com",
  start_time: "2026-10-10T09:00:00.000Z",
  end_time: "2026-10-10T10:00:00.000Z",
  cal_status: "pending",
  payment_status: "unpaid",
  payment_method_note: null,
  stripe_session_id: null,
  amount_paid_cents: null,
  currency: null,
  promo_code: null,
  discount_cents: null,
  paid_at: null,
  confirmed_at: null,
  confirm_error: null,
  created_at: "2026-10-04T10:00:00.000Z",
  updated_at: "2026-10-04T10:00:00.000Z",
  ...over,
});

describe("formatMoney", () => {
  it("formats euro cents", () => {
    expect(formatMoney(5400, "eur")).toBe("€54.00");
  });
});

describe("paymentSummary", () => {
  it("covers unpaid, manual, paid and paid-with-promo", () => {
    expect(paymentSummary(b())).toBe("Unpaid");
    expect(paymentSummary(b({ payment_status: "manual", payment_method_note: "bank transfer" }))).toBe(
      "Paid manually · bank transfer"
    );
    expect(paymentSummary(b({ payment_status: "paid", amount_paid_cents: 12000, currency: "eur" }))).toBe("€120.00");
    expect(
      paymentSummary(
        b({ payment_status: "paid", amount_paid_cents: 5400, currency: "eur", promo_code: "SPRING20", discount_cents: 1100 })
      )
    ).toBe("€54.00 · SPRING20 (−€11.00)");
  });
});

describe("needsAttention", () => {
  it("flags pending, failed confirms and unmatched payments", () => {
    expect(needsAttention(b())).toBe(true);
    expect(needsAttention(b({ cal_status: "accepted" }))).toBe(false);
    expect(needsAttention(b({ cal_status: "accepted", confirm_error: "x" }))).toBe(true);
    expect(needsAttention(b({ cal_uid: null, cal_status: "pending", payment_status: "paid" }))).toBe(true);
    expect(needsAttention(b({ cal_status: "cancelled" }))).toBe(false);
  });
});

describe("isUpcoming", () => {
  it("is true for future, non-cancelled sessions", () => {
    const now = new Date("2026-10-05T00:00:00.000Z");
    expect(isUpcoming(b({ cal_status: "accepted" }), now)).toBe(true);
    expect(isUpcoming(b({ cal_status: "cancelled" }), now)).toBe(false);
    expect(isUpcoming(b({ start_time: "2026-10-01T09:00:00.000Z" }), now)).toBe(false);
    expect(isUpcoming(b({ start_time: null }), now)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/payments/bookingView.test.ts`
Expected: FAIL — cannot resolve `@/lib/payments/bookingView`.

- [ ] **Step 3: Implement `lib/payments/bookingView.ts`**

```ts
// Pure display helpers for /admin/bookings.

import type { Booking } from "@/lib/payments/types";

export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function paymentSummary(b: Booking): string {
  if (b.payment_status === "unpaid") return "Unpaid";
  if (b.payment_status === "manual") {
    return b.payment_method_note ? `Paid manually · ${b.payment_method_note}` : "Paid manually";
  }
  const currency = b.currency ?? "eur";
  let text = b.amount_paid_cents !== null ? formatMoney(b.amount_paid_cents, currency) : "Paid";
  if (b.promo_code) {
    text += ` · ${b.promo_code}`;
    if (b.discount_cents) text += ` (−${formatMoney(b.discount_cents, currency)})`;
  }
  return text;
}

export function needsAttention(b: Booking): boolean {
  if (b.cal_uid === null) return true; // unmatched payment
  if (b.confirm_error) return true;
  return b.cal_status === "pending";
}

export function isUpcoming(b: Booking, now: Date = new Date()): boolean {
  if (!b.start_time) return false;
  if (b.cal_status === "cancelled" || b.cal_status === "rejected") return false;
  return new Date(b.start_time).getTime() >= now.getTime();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- lib/payments/bookingView.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Create the admin action route** — `app/api/admin/bookings/[id]/route.ts`

```ts
/**
 * Admin actions on a booking: mark paid manually, confirm (retry), decline,
 * or link an unmatched Stripe payment to a booking.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseBookingsRepo } from "@/lib/payments/supabaseRepo";
import { calApi } from "@/lib/payments/calApi";
import {
  BookingActionError,
  confirmById,
  declineBooking,
  linkPayment,
  markPaidManually,
} from "@/lib/payments/bookingStore";
import type { Booking } from "@/lib/payments/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action as string | undefined;

  const repo = supabaseBookingsRepo(createAdminClient());
  const cal = calApi();

  try {
    let booking: Booking;
    switch (action) {
      case "mark_paid": {
        const note = typeof body.note === "string" ? body.note.trim() : "";
        if (!note) {
          return NextResponse.json({ error: "A payment note is required" }, { status: 400 });
        }
        booking = await markPaidManually(repo, cal, params.id, note);
        break;
      }
      case "confirm":
        booking = await confirmById(repo, cal, params.id);
        break;
      case "decline":
        booking = await declineBooking(
          repo,
          cal,
          params.id,
          typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : undefined
        );
        break;
      case "link":
        if (typeof body.bookingId !== "string") {
          return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
        }
        booking = await linkPayment(repo, cal, params.id, body.bookingId);
        break;
      default:
        return NextResponse.json(
          { error: 'action must be "mark_paid", "confirm", "decline" or "link"' },
          { status: 400 }
        );
    }
    return NextResponse.json({ booking });
  } catch (e) {
    if (e instanceof BookingActionError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[admin/bookings]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Action failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 6: Create the page** — `app/admin/bookings/page.tsx`

```tsx
import { createClient } from "@/lib/supabase/server";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import BookingsListClient from "@/components/admin/bookings/BookingsListClient";
import type { Booking } from "@/lib/payments/types";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const supabase = await createClient();

  const [{ data: bookings }, { data: services }] = await Promise.all([
    supabase
      .from("bookings")
      .select("*")
      .order("start_time", { ascending: true, nullsFirst: true })
      .returns<Booking[]>(),
    supabase
      .from("services")
      .select("slug, name, payment_url")
      .returns<{ slug: string; name: string; payment_url: string | null }[]>(),
  ]);

  const all = bookings ?? [];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Bookings"
        description="Pay-after-booking sessions: payment status and Cal.com confirmation."
      />
      <BookingsListClient bookings={all} services={services ?? []} />
    </div>
  );
}
```

- [ ] **Step 7: Create the client list** — `components/admin/bookings/BookingsListClient.tsx`

```tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/admin/ui/Toast";
import { paymentLinkFor } from "@/lib/booking";
import { isUpcoming, needsAttention, paymentSummary } from "@/lib/payments/bookingView";
import type { Booking, CalStatus } from "@/lib/payments/types";

type ServiceRef = { slug: string; name: string; payment_url: string | null };
type Tab = "attention" | "upcoming" | "all";

const TABS: { key: Tab; label: string }[] = [
  { key: "attention", label: "Needs attention" },
  { key: "upcoming", label: "Upcoming" },
  { key: "all", label: "All" },
];

const CAL_BADGE: Record<CalStatus, string> = {
  pending: "bg-amber-50 text-amber-800",
  accepted: "bg-green-50 text-green-800",
  rejected: "bg-red-50 text-red-800",
  cancelled: "bg-[#f5f3ef] text-[#6b6560]",
};

const btn =
  "text-xs font-medium px-3 py-1.5 rounded-lg border border-[#e8e5df] hover:bg-[#f5f3ef] transition-colors disabled:opacity-50";

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BookingsListClient({
  bookings,
  services,
}: {
  bookings: Booking[];
  services: ServiceRef[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("attention");
  const [busy, setBusy] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [linkTarget, setLinkTarget] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

  const serviceBySlug = useMemo(
    () => new Map(services.map((s) => [s.slug, s])),
    [services]
  );

  const visible = bookings.filter((b) =>
    tab === "attention" ? needsAttention(b) : tab === "upcoming" ? isUpcoming(b) : true
  );

  // Unpaid Cal bookings an unmatched payment can be linked to.
  const linkable = bookings.filter(
    (b) => b.cal_uid && b.payment_status === "unpaid" && b.cal_status === "pending"
  );

  async function act(id: string, body: Record<string, unknown>, success: string) {
    setBusy(id);
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setToast({ message: json.error ?? "Action failed", type: "error" });
      return;
    }
    const updated = json.booking as Booking | undefined;
    setToast(
      updated?.confirm_error
        ? { message: `Saved, but Cal confirm failed: ${updated.confirm_error}`, type: "error" }
        : { message: success, type: "success" }
    );
    setNoteFor(null);
    setNote("");
    router.refresh();
  }

  async function copyPaymentLink(b: Booking) {
    const url = b.service_slug ? serviceBySlug.get(b.service_slug)?.payment_url : null;
    if (!url || !b.cal_uid) {
      setToast({ message: "This service has no payment link set", type: "error" });
      return;
    }
    await navigator.clipboard.writeText(paymentLinkFor(url, b.cal_uid));
    setToast({ message: "Payment link copied", type: "success" });
  }

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <div className="flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              tab === t.key
                ? "bg-[#1a1a18] text-white"
                : "text-[#6b6560] hover:bg-[#f5f3ef]"
            }`}
          >
            {t.label}
            {t.key === "attention" && ` (${bookings.filter(needsAttention).length})`}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="bg-white border border-[#e8e5df] rounded-xl p-8 text-center text-[#6b6560]">
          Nothing here.
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((b) => {
            const unmatched = b.cal_uid === null;
            const service = b.service_slug ? serviceBySlug.get(b.service_slug) : undefined;
            const isBusy = busy === b.id;

            return (
              <li key={b.id} className="bg-white border border-[#e8e5df] rounded-xl p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#1a1a18]">
                      {b.attendee_name ?? "Unknown client"}
                      <span className="text-[#6b6560] font-normal"> · {b.attendee_email ?? "no email"}</span>
                    </p>
                    <p className="text-sm text-[#6b6560]">
                      {unmatched
                        ? "Stripe payment not linked to a booking"
                        : `${service?.name ?? b.service_slug ?? "Unknown service"} · ${formatWhen(b.start_time)}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {!unmatched && (
                      <span className={`px-2 py-0.5 rounded-full ${CAL_BADGE[b.cal_status]}`}>
                        Cal: {b.cal_status}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        b.payment_status === "unpaid" ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-800"
                      }`}
                    >
                      {paymentSummary(b)}
                    </span>
                  </div>
                </div>

                {b.confirm_error && (
                  <p className="text-xs text-red-700">Cal confirm failed: {b.confirm_error}</p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {!unmatched && b.payment_status === "unpaid" && b.cal_status === "pending" && (
                    <>
                      <button className={btn} disabled={isBusy} onClick={() => setNoteFor(noteFor === b.id ? null : b.id)}>
                        Mark paid manually
                      </button>
                      <button className={btn} disabled={isBusy} onClick={() => copyPaymentLink(b)}>
                        Copy payment link
                      </button>
                    </>
                  )}
                  {!unmatched && b.payment_status !== "unpaid" && b.cal_status === "pending" && (
                    <button className={btn} disabled={isBusy} onClick={() => act(b.id, { action: "confirm" }, "Booking confirmed")}>
                      Confirm in Cal
                    </button>
                  )}
                  {!unmatched && b.cal_status === "pending" && (
                    <button
                      className={`${btn} text-red-700`}
                      disabled={isBusy}
                      onClick={() => {
                        if (!window.confirm("Decline this booking in Cal.com? The client is notified and the slot is freed.")) return;
                        act(b.id, { action: "decline", reason: "Payment not received" }, "Booking declined");
                      }}
                    >
                      Decline
                    </button>
                  )}
                  {unmatched && (
                    <>
                      <select
                        className="text-xs border border-[#e8e5df] rounded-lg px-2 py-1.5 bg-white"
                        value={linkTarget[b.id] ?? ""}
                        onChange={(e) => setLinkTarget((m) => ({ ...m, [b.id]: e.target.value }))}
                      >
                        <option value="">Link to booking…</option>
                        {linkable.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.attendee_name ?? t.attendee_email ?? "Unknown"} · {formatWhen(t.start_time)}
                          </option>
                        ))}
                      </select>
                      <button
                        className={btn}
                        disabled={isBusy || !linkTarget[b.id]}
                        onClick={() => act(b.id, { action: "link", bookingId: linkTarget[b.id] }, "Payment linked")}
                      >
                        Link
                      </button>
                    </>
                  )}
                </div>

                {noteFor === b.id && (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      autoFocus
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="How was it paid? e.g. bank transfer"
                      className="text-sm border border-[#e8e5df] rounded-lg px-3 py-1.5 flex-1 min-w-[200px]"
                    />
                    <button
                      className={btn}
                      disabled={isBusy || !note.trim()}
                      onClick={() => act(b.id, { action: "mark_paid", note }, "Marked paid and confirmed")}
                    >
                      Save
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Add the nav entry** — `components/admin/AdminNav.tsx`

In `navLinks`, after the `Services` entry:

```ts
  { label: "Services", href: "/admin/services" },
  { label: "Bookings", href: "/admin/bookings" },
```

- [ ] **Step 9: Verify**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: PASS, no errors.

With `SUPABASE_SERVICE_ROLE_KEY` set in `.env.local`, start the dev server, sign in, open `/admin/bookings`. Expected: page renders with "Nothing here." (or real rows). Insert a test row in the Supabase SQL editor:

```sql
insert into bookings (cal_uid, service_slug, attendee_name, attendee_email, start_time)
values ('test_uid_1', 'stellar-insights', 'Test Client', 'test@example.com', now() + interval '3 days');
```

Reload: the row shows under "Needs attention" with "Cal: pending", "Unpaid", and "Mark paid manually / Copy payment link / Decline" buttons. Delete the test row afterwards (`delete from bookings where cal_uid = 'test_uid_1';`) — do NOT click Decline/Mark paid on it (it would call the real Cal API with a fake uid and surface a Cal error, which is the expected error path but noisy).

- [ ] **Step 10: Commit**

```bash
git add lib/payments/bookingView.ts lib/payments/bookingView.test.ts "app/api/admin/bookings" app/admin/bookings components/admin/bookings components/admin/AdminNav.tsx
git commit -m "feat(admin): bookings page with payment status and manual actions"
```

---

### Task 8: Public flow — payment_url plumbing and redirect to Stripe

**Files:**
- Modify: `types/index.ts` (Service interface)
- Modify: `lib/services.ts:46-47` (`serviceCta`)
- Modify: `components/TarotDeck.tsx` (CardSlot + ServiceDetail)
- Modify: `components/admin/ServiceForm.tsx` (state, preview, payload, field)
- Create: `lib/payments/payRedirect.ts`
- Create: `components/booking/PaymentRedirectListener.tsx`
- Modify: `components/booking/BookAction.tsx`, `components/booking/CalBookButton.tsx`
- Modify: `app/(public)/layout.tsx`

**Interfaces:**
- Consumes: `withPaymentUrl`, `paymentLinkFor`, `BookingTarget` (Task 1)
- Produces:
  - `Service.payment_url?: string | null`
  - `armPaymentRedirect(url: string | null): void`, `takeArmedPaymentUrl(): string | null`
  - `CalBookButton` prop `paymentUrl?: string`

- [ ] **Step 1: Add the column to the `Service` type** — `types/index.ts`, after `booking_url?: string | null;`

```ts
  // Added in migration 014 — Stripe Payment Link for pay-after-booking.
  payment_url?: string | null;
```

- [ ] **Step 2: Plumb into `serviceCta`** — `lib/services.ts`

Change the import line to:

```ts
import { bookingForSlug, withPaymentUrl, type BookingTarget } from "@/lib/booking";
```

Replace

```ts
  const target = bookingForSlug(service.slug);
```

with

```ts
  const target = withPaymentUrl(bookingForSlug(service.slug), service.payment_url);
```

- [ ] **Step 3: Plumb into the tarot deck** — `components/TarotDeck.tsx`

Import: change `import { bookingForSlug } from "@/lib/booking";` to

```ts
import { bookingForSlug, withPaymentUrl } from "@/lib/booking";
```

In the `CARDS.map` render, add a prop to `<CardSlot …>` (after `desktopLift={LIFT[i]}`):

```tsx
                paymentUrl={svc?.payment_url}
```

In `type CardSlotProps`, add:

```ts
  paymentUrl?: string | null;
```

In `function CardSlot({ … })` destructuring, add `paymentUrl,` after `desktopLift,`, and replace its `const bookingTarget = bookingForSlug(card.slug);` with:

```ts
  const bookingTarget = withPaymentUrl(bookingForSlug(card.slug), paymentUrl);
```

In `function ServiceDetail`, replace `const bookingTarget = bookingForSlug(card.slug);` with:

```ts
  const bookingTarget = withPaymentUrl(bookingForSlug(card.slug), service?.payment_url);
```

- [ ] **Step 4: Create the redirect state** — `lib/payments/payRedirect.ts`

```ts
// Which Stripe Payment Link (if any) the next completed Cal booking should go
// to. Set when a Cal button is clicked; consumed by PaymentRedirectListener.
// Module state is fine: there is one Cal popup open at a time.

let armedPaymentUrl: string | null = null;

export function armPaymentRedirect(url: string | null): void {
  armedPaymentUrl = url;
}

export function takeArmedPaymentUrl(): string | null {
  const url = armedPaymentUrl;
  armedPaymentUrl = null;
  return url;
}
```

- [ ] **Step 5: Arm on click** — `components/booking/CalBookButton.tsx`

Add the import:

```ts
import { armPaymentRedirect } from "@/lib/payments/payRedirect";
```

Add to `Props`:

```ts
  /** Stripe Payment Link to send the client to once the Cal booking completes. */
  paymentUrl?: string;
```

Add `paymentUrl,` to the destructured props, and add an `onClick` to the `<button>` (every Cal button arms, so a non-paying service clears any stale value):

```tsx
      onClick={() => armPaymentRedirect(paymentUrl ?? null)}
```

- [ ] **Step 6: Pass it through** — `components/booking/BookAction.tsx`

In the `<CalBookButton … />` element add:

```tsx
        paymentUrl={target.paymentUrl}
```

- [ ] **Step 7: Create the listener** — `components/booking/PaymentRedirectListener.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { getCalApi } from "@calcom/embed-react";
import { paymentLinkFor } from "@/lib/booking";
import { takeArmedPaymentUrl } from "@/lib/payments/payRedirect";

/**
 * Pay-after-booking: when a Cal booking completes for a service with a
 * payment_url, send the client to its Stripe Payment Link with the booking uid
 * as client_reference_id. The Stripe webhook then confirms the booking.
 * Mounted once in the public layout, next to BookingConversionListener.
 */
export default function PaymentRedirectListener() {
  useEffect(() => {
    let cal: Awaited<ReturnType<typeof getCalApi>> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onBooked = (e: CustomEvent<{ data: { uid: string | undefined } }>) => {
      const uid = e.detail.data.uid;
      const paymentUrl = takeArmedPaymentUrl();
      if (!uid || !paymentUrl) return;
      // Short delay so the booking_confirmed analytics beacon gets out first.
      timer = setTimeout(() => {
        window.location.assign(paymentLinkFor(paymentUrl, uid));
      }, 400);
    };

    (async () => {
      cal = await getCalApi();
      cal("on", { action: "bookingSuccessfulV2", callback: onBooked });
    })();

    return () => {
      if (timer) clearTimeout(timer);
      cal?.("off", { action: "bookingSuccessfulV2", callback: onBooked });
    };
  }, []);

  return null;
}
```

If `tsc` rejects the `onBooked` parameter type, import the exact type instead: `import type { EmbedEvent } from "@calcom/embed-core";` and type the parameter as `EmbedEvent<"bookingSuccessfulV2">` (the event-data map lives in `node_modules/@calcom/embed-core/dist/src/sdk-action-manager.d.ts`).

- [ ] **Step 8: Mount it** — `app/(public)/layout.tsx`

Add the import below the `BookingConversionListener` import:

```ts
import PaymentRedirectListener from "@/components/booking/PaymentRedirectListener";
```

and render it right after `<BookingConversionListener />`:

```tsx
        <PaymentRedirectListener />
```

- [ ] **Step 9: Add the admin field** — `components/admin/ServiceForm.tsx`

After the `bookingUrl` state line, add:

```ts
  const [paymentUrl, setPaymentUrl] = useState(initialData?.payment_url ?? "");
```

In `previewService`, after `booking_url: bookingUrl || null,`, add:

```ts
    payment_url: paymentUrl || null,
```

In `handleSave`'s `payload`, after `booking_url: bookingUrl.trim() || null,`, add:

```ts
      payment_url: paymentUrl.trim() || null,
```

In the Booking card, after the closing `</div>` of the existing "Booking link" block (just before the card's closing `</div>`), add:

```tsx
            <div>
              <AdminInput
                label="Payment link (pay after booking)"
                id="payment_url"
                value={paymentUrl}
                onChange={(e) => setPaymentUrl(e.target.value)}
                placeholder="https://buy.stripe.com/..."
              />
              <p className="text-xs text-[#b8b0a4] mt-1.5">
                Stripe Payment Link (promo codes allowed). After booking in
                Cal.com the client is sent here to pay, and the booking is
                confirmed automatically once payment arrives. Only works with
                built-in Cal.com booking; the Cal event must use &quot;Requires
                confirmation&quot; and must not have the Cal Stripe app. Leave
                empty to keep the current behaviour.
              </p>
              {paymentUrl.trim() && !hasBuiltInBooking && (
                <p className="text-xs text-amber-700 mt-1.5">
                  This slug has no built-in Cal.com booking, so the payment link
                  will not be used.
                </p>
              )}
            </div>
```

- [ ] **Step 10: Verify**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all PASS.

Start the dev server. In `/admin/services`, edit Stellar Insights, set Payment link to a **Stripe test-mode** Payment Link, save. On the homepage, run in the browser console before clicking:

```js
window.addEventListener("message", (e) => { if (String(e.data?.type ?? "").includes("bookingSuccessful")) console.log("cal event", e.data); });
```

Click Stellar's Book button, complete a booking on a test Cal event. Expected: after the success screen, the page navigates to `https://buy.stripe.com/...?client_reference_id=<uid>`. Clear the Payment link afterwards if the Cal event is not yet set up for this flow.

- [ ] **Step 11: Commit**

```bash
git add types/index.ts lib/services.ts components/TarotDeck.tsx components/admin/ServiceForm.tsx lib/payments/payRedirect.ts components/booking "app/(public)/layout.tsx"
git commit -m "feat(booking): redirect to Stripe after Cal booking when a payment link is set"
```

---

### Task 9: Setup guide + end-to-end check

**Files:**
- Create: `docs/BOOKING_PAYMENTS_SETUP.md`

- [ ] **Step 1: Write the guide** — `docs/BOOKING_PAYMENTS_SETUP.md`

````markdown
# Pay-after-booking setup (Cal.com + Stripe promo codes)

Clients book in Cal.com, are sent to a Stripe Payment Link (promo codes allowed),
and the booking confirms automatically when payment lands. Unpaid bookings wait
in **Admin → Bookings** for Gabs to chase, mark paid, or decline.

## 1. Database

Run `supabase/migrations/014_bookings_payments.sql` (Supabase SQL editor or MCP).

## 2. Environment variables (Vercel → Settings → Environment Variables, and `.env.local`)

| Name | Where to get it |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys (use `sk_test_…` first) |
| `STRIPE_WEBHOOK_SECRET` | Shown after creating the Stripe webhook (step 4) |
| `CAL_API_KEY` | Cal.com → Settings → Developer → API keys |
| `CAL_WEBHOOK_SECRET` | Any long random string; paste the same value into the Cal webhook (step 3) |

Redeploy after adding them.

## 3. Cal.com — for each session event using this flow

1. Event type → **Advanced** → turn on **Requires confirmation** (always).
2. Event type → **Apps** → turn **off** the Stripe app (otherwise the client pays twice).
3. Event type → **Webhooks** → New webhook:
   - URL: `https://theastropsychelab.com/api/webhooks/cal`
   - Secret: the `CAL_WEBHOOK_SECRET` value
   - Triggers: Booking requested, Booking created, Booking cancelled, Booking rejected, Booking rescheduled
   - Adding it on the event type (not account-wide) keeps unrelated events out of the Bookings page.
4. Optional: Workflows → edit the "booking requested" email so it says the booking is confirmed once payment is completed.

## 4. Stripe

1. For each session, create a Payment Link: Products → the session → **Create payment link**.
   - Options → **Allow promotion codes**: on.
   - Advanced → **Metadata**: `booking_flow` = `cal`.
   - After payment → show a confirmation page (e.g. "Payment received — your booking confirmation email is on its way").
2. Products → **Coupons** → create coupons + customer-facing promotion codes (expiry, max redemptions, first-time only, etc.).
3. Developers → **Webhooks** → Add endpoint:
   - URL: `https://theastropsychelab.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## 5. Admin

Admin → Services → edit the session → **Payment link (pay after booking)** → paste the Stripe link → Save.
Leave it empty to switch a service back to the old behaviour.

## 6. End-to-end test (Stripe test mode)

1. Use `sk_test_…` keys, a test-mode Payment Link and test webhook secret.
2. On the site, book the service. Expected: Cal shows "booking requested", then the page goes to Stripe.
3. In **Admin → Bookings** the booking appears under *Needs attention* as `Cal: pending · Unpaid`.
4. Pay with card `4242 4242 4242 4242`, any future date/CVC, and a promo code.
5. Expected within a few seconds: the row shows `Cal: accepted` and `€amount · CODE (−€discount)`; Cal sends the client the confirmation email and the event appears in Gabs's calendar.
6. Book again but close the Stripe tab. Expected: row stays *Unpaid*; **Copy payment link** gives a link that, when paid, confirms that booking.
7. Use **Mark paid manually** on another test booking. Expected: `Paid manually · <note>`, Cal confirmed.
8. Use **Decline** on another. Expected: `Cal: rejected`, slot freed, client emailed by Cal.
9. Check Stripe → Webhooks → recent deliveries show `200`; Cal → Webhooks → recent deliveries show `200`.

Then switch to live keys, live Payment Links and a live Stripe webhook.

## Troubleshooting

- **Row says "Cal confirm failed"**: check `CAL_API_KEY`, then click **Confirm in Cal**.
- **Payment shows as "not linked to a booking"**: the client opened the Payment Link directly. Use **Link to booking**.
- **Nothing appears after payment**: Stripe webhook deliveries — a `400` means the signing secret is wrong; `ignored: true` means the Payment Link lacks `booking_flow=cal` metadata and the URL had no `client_reference_id`.
````

- [ ] **Step 2: Commit**

```bash
git add docs/BOOKING_PAYMENTS_SETUP.md
git commit -m "docs: pay-after-booking setup guide and E2E checklist"
```

- [ ] **Step 3: Final verification**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: everything PASS. Then follow section 6 of the guide in Stripe test mode before going live.
