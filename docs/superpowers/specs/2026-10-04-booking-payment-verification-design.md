# Booking Payment Verification (Book first, auto-confirm)

**Date:** 2026-10-04
**Status:** Approved design — pending implementation plan

## Problem

Cal.com's Stripe app cannot accept promotion codes. Stripe Payment Links can, but
they only take money — they don't reserve a calendar slot. We want clients to book
a slot in Cal.com, pay via a Stripe Payment Link (with promo codes), and have the
booking confirmed only once payment is verified. Gabs needs an admin view to see
payment state and handle exceptions manually.

Today the site never talks to Stripe or Cal.com server-side: no webhooks, no secret
keys, no booking/payment data in Supabase (`lib/booking.ts`).

## Decisions

| Question | Decision |
|---|---|
| Flow | Book first (Cal, "requires confirmation") → pay (Stripe Payment Link) → auto-confirm via Cal API |
| Unpaid bookings | Flag only — never auto-declined; Gabs decides |
| Admin extras | Mark paid manually; show promo code used |
| Booking ↔ payment link | Cal booking `uid` passed to Stripe as `client_reference_id` |
| Rollout | Opt-in per service via new `services.payment_url` column |

## Flow

```
Client clicks "Book" ─► Cal popup (event = "requires confirmation", NO Cal Stripe app)
        │ booking created as PENDING
        ├─► Cal webhook (BOOKING_REQUESTED) ─► /api/webhooks/cal ─► upsert bookings row (unpaid)
        │
        └─► embed fires bookingSuccessfulV2 {uid}
              ─► site redirects to the service's Stripe Payment Link
                 ?client_reference_id=<uid>   (promo codes enabled in Stripe)
                       │ client pays
                       ▼
            Stripe webhook (checkout.session.completed) ─► /api/webhooks/stripe
              1. verify signature, read client_reference_id = uid
              2. retrieve session with discounts expanded → amount, promo code
              3. mark row paid
              4. POST Cal /v2/bookings/{uid}/confirm ─► Cal emails client + adds to calendar
```

## Components

### `lib/payments/stripe.ts` (server-only)
- Verify webhook signature (`STRIPE_WEBHOOK_SECRET`).
- Retrieve a Checkout Session with `total_details.breakdown` expanded.
- Pure helper `extractPayment(session)` → `{ calUid, sessionId, amountCents, currency, promoCode, discountCents }`.

### `lib/payments/cal.ts` (server-only)
- Verify Cal webhook signature (`x-cal-signature-256`, HMAC-SHA256 with `CAL_WEBHOOK_SECRET`).
- `confirmBooking(uid)` → `POST https://api.cal.com/v2/bookings/{uid}/confirm` with `CAL_API_KEY` and `cal-api-version` header.
- `rejectBooking(uid, reason?)` → Cal reject endpoint.
- Pure helper `extractBooking(payload)` → booking fields + mapped `cal_status`.

### `lib/payments/bookingStore.ts` (server-only)
Supabase service-role client and the upsert/state-transition logic, shared by both
webhooks and the admin route. Every write is idempotent and order-independent:
- Upsert by `cal_uid` — whichever webhook arrives first creates the row; the other fills its fields in.
- `stripe_session_id` is unique; replaying the same Stripe event is a no-op.
- Payment with no `client_reference_id` → inserted with `cal_uid = null` (unmatched).

### Webhook routes
- `app/api/webhooks/stripe/route.ts` — handles `checkout.session.completed`. Marks paid, then calls `confirmBooking`. On Cal failure, stores the error in `confirm_error` and still returns 200 (payment is recorded; retry is manual).
- `app/api/webhooks/cal/route.ts` — handles `BOOKING_REQUESTED`, `BOOKING_CREATED`, `BOOKING_CANCELLED`, `BOOKING_REJECTED`, `BOOKING_RESCHEDULED`. Upserts booking fields and `cal_status`.
- Both reject invalid signatures with 400 and use the raw request body for verification.

### `components/booking/CalBookButton.tsx`
When the service has a `payment_url`, subscribe to the embed's `bookingSuccessfulV2`
event and redirect to `payment_url` with `client_reference_id=<uid>` appended. The
existing `booking_confirmed` analytics listener is unchanged.

### `services.payment_url`
New nullable column, editable in `components/admin/ServiceForm.tsx` ("Payment link
(Stripe) — required for pay-after-booking"). Services without it keep their current
behaviour. Plumbed through `lib/services.ts` so the Cal button for that service
knows where to redirect.

## Data model — `supabase/migrations/014_bookings_payments.sql`

`alter table services add column payment_url text;`

`bookings`:

| Column | Type / notes |
|---|---|
| `id` | uuid PK, default `gen_random_uuid()` |
| `cal_uid` | text unique, nullable (null = unmatched payment) |
| `service_slug` | text |
| `event_type_id` | integer |
| `attendee_name`, `attendee_email` | text |
| `start_time`, `end_time` | timestamptz |
| `cal_status` | text check in (`pending`,`accepted`,`rejected`,`cancelled`), default `pending` |
| `payment_status` | text check in (`unpaid`,`paid`,`manual`), default `unpaid` |
| `payment_method_note` | text (manual payments) |
| `stripe_session_id` | text unique |
| `amount_paid_cents` | integer |
| `currency` | text |
| `promo_code` | text |
| `discount_cents` | integer |
| `paid_at`, `confirmed_at` | timestamptz |
| `confirm_error` | text |
| `created_at`, `updated_at` | timestamptz, default `now()` |

RLS: enabled. Admin read/update policies following `007_admin_rls_policies.sql`.
No public access. Inserts only via service role (webhooks).

## Admin — `/admin/bookings`

- Nav entry "Bookings".
- Tabs: **Needs attention** (default: unpaid + pending, `confirm_error` set, unmatched payments) · **Upcoming** · **All**.
- Row: name, email, service, session time, Cal status badge, payment badge. Paid rows show amount and promo, e.g. `€54.00 · SPRING20 (−€11.00)`.
- Actions (state-dependent), served by `app/api/admin/bookings/[id]/route.ts` with the existing admin auth check:
  - **Mark paid manually** — note (e.g. "bank transfer") → `payment_status = manual` → Cal confirm.
  - **Retry confirm** — when paid and `confirm_error` set.
  - **Copy payment link** — `payment_url?client_reference_id=<uid>` for clients who dropped off.
  - **Decline** — Cal reject → frees the slot. Manual only.
  - **Link to booking** — attach an unmatched payment to a pending booking, then confirm.

## Error handling

| Case | Behaviour |
|---|---|
| Client closes tab before paying | Row stays unpaid/pending → Needs attention |
| Cal confirm API fails | Row paid + `confirm_error` → Retry confirm |
| Payment without `client_reference_id` | Unmatched row → Link to booking |
| Duplicate webhook delivery | Idempotent no-op |
| Stripe webhook before Cal webhook | Row created from Stripe data; Cal webhook fills in attendee/time |
| Invalid signature | 400, nothing written |

## Configuration

Env vars (Vercel + `.env.local`): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`CAL_API_KEY`, `CAL_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.
New dependency: `stripe`.

External setup (documented in a setup guide alongside the migration):
- **Cal.com**: per event — enable "Requires confirmation", remove the Cal Stripe app; add a webhook to `/api/webhooks/cal` with a secret. Optionally reword the "booking requested" email to say payment completes the booking.
- **Stripe**: per Payment Link — enable "Allow promotion codes"; add a webhook to `/api/webhooks/stripe` for `checkout.session.completed`.

## Testing

- Unit tests for `extractPayment`, `extractBooking`, and the store's state transitions: either-order upsert, duplicate delivery, promo extraction, unmatched payments.
- Signature verification against Stripe/Cal test signatures.
- Manual E2E in Stripe test mode with a promo code and a Cal test event (steps in the setup guide).

## Out of scope

Auto-decline/timeouts, unpaid alert emails, refunds from admin (use Stripe
dashboard), changes to the five hard-coded services until `payment_url` is set.
