# Services terminology & display — design

Date: 2026-10-04 · Status: approved

## Decision

Drop "session" as a site concept. Everything on offer is a **service**.
The homepage tarot spread is a curated showcase of five services; `/services`
is the single complete list (driven by admin, so admin-added services appear
there automatically).

## Changes (public site only)

1. **Homepage** — remove the full `ServicesIndex` grid (delete the component;
   `ServiceRowCard` stays, used by `/services` and the admin preview). Add a
   "See all services →" link under the tarot spread. Remaining `TrackSection`
   indexes are left unchanged (gap at 6) so scroll-depth analytics stay
   comparable.
2. **Navigation** — remove the header "Sessions" (`/#tarot`) item; header and
   footer CTA "Book a Session" → "Book Now" / "Reservar" (still `/services`).
3. **Copy** — "session" → "service" in: card CTA label, tarot subtitle,
   contents index ("The Spread"), `/services` intro, FAQ and meta description,
   HomeCTA, About and Founder prose. Testimonial quotes are left verbatim.

## Out of scope

No migration, no admin changes, no booking/payment logic changes. Tarot cards
still render when their service is deactivated (possible follow-up).

## Compatibility with `feat/booking-payment-verification`

Do not touch `ServiceForm`, `lib/booking.ts`, `serviceCta()`, `BookAction`,
or admin pages. The only shared files are `lib/services.ts` (label constant)
and `TarotDeck.tsx` (subtitle/link), on hunks that branch does not edit.

## Verification

- Trial merge of `feat/booking-payment-verification` merges cleanly; typecheck,
  lint and that branch's vitest suite pass on the merged result.
- Browser: homepage shows tarot + link and no grid; header has no "Sessions";
  `/services` lists all active services; tarot Book buttons still open booking.
