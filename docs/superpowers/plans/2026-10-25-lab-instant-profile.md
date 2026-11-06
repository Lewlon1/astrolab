# Lab: instant profile (option C), email verification later (option B)

**Goal:** after the visitor submits their email at the gate, show their profile straight away in the same tab. No email round-trip to see the reading. The magic-link email still goes out so they can return on another device and, later, verify with a 6-digit code (option B).

**Why:** the magic-link round-trip is the weakest step of the funnel. The link opens in a different browser from Instagram's in-app browser, email scanners can spend the one-time link, and the PKCE and redirect settings are fragile. Today (2026-10-25) a fresh setup took hours to get working.

## Design

**Viewer cookie.** `/api/lab/gate` sets a signed, `httpOnly` cookie `lab_profile` = `<profileId>.<expiresAt>.<hmac>`. SameSite=Lax, `Secure` in production, path `/`, 7-day expiry. The HMAC key is a new env var `LAB_SESSION_SECRET` (at least 32 random characters). If it is missing, no cookie is issued and none is accepted (fail closed, the visitor falls back to today's "check your inbox" state).

**Who may see a profile through the cookie.** Only a row that is still unclaimed (`user_id IS NULL`) and not deleted. Once the real owner verifies their email (`user_id` set), a cookie stops working. A stale cookie therefore never exposes a verified user's profile. The gate already refuses to write to a claimed row; it must also not issue a cookie for one (the visitor sees the existing "check your inbox" state, so the response still does not reveal that the email exists).

**One resolver.** `lib/lab/viewer.ts` exports `resolveLabViewer(cookies)` returning `{ profileId, via: "session" | "cookie" } | null`. A Supabase session wins over the cookie. The profile page and the three authenticated routes (`/api/lab/delete`, `/api/lab/birth-time`, `/api/lab/event`) call it instead of each calling `supabase.auth.getUser()` directly.

**Delete via cookie** is allowed (it is the visitor's own browser session) and clears the cookie.

**Upgrade path (option B, later).** The profile page shows a banner while the profile is unclaimed: "We emailed you a link. Confirm your email to keep your chart." A later task adds `{{ .Token }}` to the email template and a code field that calls `verifyOtp({ email, token, type: "email" })`, which needs no PKCE cookie.

## Decision (made 2026-10-25): keep the MailerLite sync at the gate, flagged for legal review

Was: decision needed before building.

MailerLite currently receives the address at the gate, before it is verified. Options: (1) keep that, as now; (2) add the subscriber to the Lab group only after verification (a form of double opt-in, which also settles the open legal item). Default in this plan: **keep (1)**, flagged for legal review.

## Status: built 2026-10-25 (uncommitted at the time of writing)

Tasks 1-7 are done; task 8's browser check is blocked until `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`. Also added beyond the plan: a failed sign-in email no longer blocks an unclaimed profile (`emailSent: false`, banner explains); the consent version is bumped to `2026-10-25.v1` for the cookie disclosure.

## Tasks (TDD: failing test first, then the code)

1. **`lib/lab/session.ts`** (`signSession`, `verifySession`): HMAC-SHA256, constant-time compare, rejects expired, malformed or tampered values, and a missing secret.
   Tests: round-trip, tampered id, expired, wrong secret, missing secret.
2. **`lib/lab/viewer.ts`** (`resolveLabViewer`): Supabase user first, then a verified cookie whose row is unclaimed and not deleted.
   Tests: session wins; cookie works for an unclaimed row; cookie refused once `user_id` is set; cookie refused for a deleted row.
3. **Gate route:** after the insert or update, set the cookie unless the row is claimed. Return `{ ok: true, profile: true | false }`.
   Tests: cookie set on first submit and on resubmit of an unclaimed row; no cookie for a claimed row; no cookie when `LAB_SESSION_SECRET` is unset. Update the existing gate tests.
4. **Profile page:** use `resolveLabViewer`; when `via === "cookie"` show the "confirm your email" banner. Redirect to `/lab` only when there is no viewer.
5. **Delete, birth-time and event routes:** use `resolveLabViewer`; delete clears the cookie.
   Tests: each route works with a cookie viewer and returns 401 with neither.
6. **`LabDraw` / `Gate`:** on `ok`, `router.push("/lab/profile")` instead of the "sent" state when `profile` is true; keep the "sent" state otherwise. Keep the Meta Pixel `Lead` call and the analytics event before navigating.
7. **Privacy copy:** add a line to the `#lab` section: a cookie keeps your profile open in this browser for 7 days. Update `CONSENT_TEXT_VERSION` only if the legal wording changes.
8. **Verify:** `vitest`, `tsc`, `eslint`; browser check of the whole flow locally (draw, birth data, email, profile visible, delete clears it); mobile width 375px.

## Out of scope (next)

- Option B: the 6-digit code field and template change.
- Deferred MailerLite sync (see the decision above).

## Prerequisites

- `SUPABASE_SERVICE_ROLE_KEY` set in `.env.local` and Vercel (the gate needs it).
- New env var `LAB_SESSION_SECRET` in `.env.local` and Vercel (`openssl rand -base64 48`).
- The Supabase redirect allowlist and Magic Link template (already covered on the PR).

## Risks

- **Unverified address on a visible profile.** Someone can submit another person's email and see a profile built from their own data. They cannot see anything belonging to the real owner (claimed rows are never read or written). The cost is list quality and consent, covered by the decision above.
- **Shared device.** The cookie lasts 7 days on that browser. The profile page's delete control and the shorter expiry limit this.
- **Cookie size and secrecy.** The cookie holds only an id, expiry and signature. The secret must be rotated if it leaks, which invalidates all cookies.
