# Pay-after-booking setup (Cal.com + Stripe promo codes)

Clients book in Cal.com, are sent to a Stripe Payment Link (promo codes allowed),
and the booking confirms automatically when payment lands. Unpaid bookings wait
in **Admin → Bookings** for Gabs to chase, mark paid, or decline.

## 1. Database

Run `supabase/migrations/014_bookings_payments.sql` (Supabase SQL editor or MCP).

**Apply this migration BEFORE deploying this code.** The service editor saves a `payment_url` column that does not exist until 014 runs.

## 2. Environment variables (Vercel → Settings → Environment Variables, and `.env.local`)

| Name | Where to get it |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → `service_role` (or a `sb_secret_…` secret key) |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → **Create restricted key** with Read on Checkout Sessions and Promotion Codes |
| `STRIPE_WEBHOOK_SECRET` | Shown after creating the Stripe webhook (step 4) |
| `CAL_API_KEY` | Cal.com → Settings → Developer → API keys |
| `CAL_WEBHOOK_SECRET` | Any long random string; paste the same value into the Cal webhook (step 3) |

Redeploy after adding them.

Use the `www` domain for both webhooks: `theastropsychelab.com` redirects to
`www.theastropsychelab.com`, and webhooks do not follow redirects reliably.

## 3. Cal.com

**One account-wide webhook (once):** Settings → Developer → Webhooks → New:
- Subscriber URL: `https://www.theastropsychelab.com/api/webhooks/cal`
- Secret: the `CAL_WEBHOOK_SECRET` value
- Triggers: Booking Requested, Booking Created, Booking Cancelled, Booking Rejected, Booking Rescheduled
- Custom payload template: leave **off**.
- It covers every event type, including ones created later. Events without
  "Requires confirmation" arrive already confirmed and only show under
  *All* / *Upcoming* in Admin → Bookings.

**For each session event using pay-after-booking:**
1. Event type → **Advanced** → turn on **Requires confirmation** (always).
2. Event type → **Apps** → turn **off** the Stripe app (otherwise the client pays twice).
3. Optional: Workflows → edit the "booking requested" email so it says the booking is confirmed once payment is completed.

## 4. Stripe

1. For each session, create a Payment Link: Products → the session → **Create payment link**.
   - Options → **Allow promotion codes**: on.
   - Advanced → **Metadata**: `booking_flow` = `cal`.
   - After payment → show a confirmation page (e.g. "Payment received — your booking confirmation email is on its way").
2. Products → **Coupons** → create coupons + customer-facing promotion codes (expiry, max redemptions, first-time only, etc.).
3. Developers → **Webhooks** → Add endpoint:
   - URL: `https://www.theastropsychelab.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## 5. Admin

Admin → Services → edit the session → **Payment link (pay after booking)** → paste the Stripe link → Save.
Leave it empty to switch a service back to the old behaviour.

The original sessions (Stellar Insights, Cosmic Alliance, Astro Psyche Blend)
already open their Cal calendar on the site. For any other service, paste its
Cal.com event link into **Booking link** — a green "Pay after booking is on"
note confirms it's set up.

### Adding a new session (no developer needed)

1. **Cal.com:** create the event type → turn on **Requires confirmation**, keep the Stripe app off. (The account webhook already covers it.)
2. **Stripe:** create a Payment Link for it → **Allow promotion codes** on, Metadata `booking_flow` = `cal`.
3. **Admin → Services → New:** fill in the details, paste the Cal event link (e.g. `https://cal.com/theastropsychelab/new-session`) into **Booking link** and the Stripe link into **Payment link**, then save.
4. Book it once yourself with a ~90%-off test code to check it confirms.

## 6. End-to-end test (Stripe test mode)

1. Use `sk_test_…` keys, a test-mode Payment Link and test webhook secret.
2. On the site, book the service. Expected: Cal shows "booking requested", then the page goes to Stripe.
3. In **Admin → Bookings** the booking appears under *Needs attention* as `Cal: pending · Unpaid`.
4. Pay with card `4242 4242 4242 4242`, any future date/CVC, and a promo code.
5. Expected within a few seconds: the row shows `Cal: accepted` and `€amount · CODE (−€discount)`; Cal sends the client the confirmation email and the event appears in Gabs's calendar.
6. Book again but close the Stripe tab. Expected: row stays *Unpaid*; **Copy payment link** gives a link that, when paid, confirms that booking.
7. Use **Mark paid manually** on another test booking. Expected: `Paid manually · <note>`, Cal confirmed.
8. Use **Decline** on another. Expected: `Cal: rejected`, slot freed, client emailed by Cal.
9. Reschedule a paid, confirmed test booking. Expected: the row moves to the new time and returns to `Cal: accepted` automatically (no payment needed again).
10. Check Stripe → Webhooks → recent deliveries show `200`; Cal → Webhooks → recent deliveries show `200`.

Then switch to live keys, live Payment Links and a live Stripe webhook.

## Troubleshooting

- **Row says "Cal confirm failed"**: check `CAL_API_KEY`, then click **Confirm in Cal**.
- **Payment shows as "not linked to a booking"**: the client opened the Payment Link directly. Use **Link to booking**.
- **Nothing appears after payment**: Stripe webhook deliveries — a `400` means the signing secret is wrong; `ignored: true` means the session isn't paid yet, or the Payment Link lacks `booking_flow=cal` metadata and the URL had no `client_reference_id`.
- **Cal webhook Ping test fails**: `404` = code not deployed; `307` = URL missing `www`; `400` = secret mismatch with `CAL_WEBHOOK_SECRET`; `500` = `CAL_WEBHOOK_SECRET` not set in Vercel (redeploy after adding).
- **Book button opens Cal in a new tab instead of on the site**: the service has no Payment link, or its Booking link isn't a `cal.com/<user>/<event>` link.
