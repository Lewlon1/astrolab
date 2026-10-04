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
