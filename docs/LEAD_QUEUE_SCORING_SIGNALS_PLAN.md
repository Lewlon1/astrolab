# Plan: fix dormant scoring signals, remove the ManyChat dependency

Status: **proposed, not started.** Nothing in this document has been built yet.

## Why this exists

Investigating the ManyChat CSV export (see `SESSION_NOTES_astro_psyche_lab.md` and
`LEAD_QUEUE_SETUP.md` §Task 2) surfaced a bigger problem than ManyChat itself: the scoring
engine rewards seven behavioural signals, but only three are ever written by any code path.

| Signal | Weight | Written by |
|---|---|---|
| Email link click | 12 | ✅ MailerLite sync |
| Email open | 4 | ✅ MailerLite sync |
| Opt-in / subscribed | 10 | ✅ MailerLite sync |
| **Pricing click** | **30** | ❌ nothing |
| **Story reply** | **25** | ❌ nothing |
| **Love code delivered** | **20** | ❌ nothing |
| **Attended an event** | **18** | ❌ nothing |

The four dormant signals are the *highest-weighted* in the rubric. Concretely, three of the
five Tier 1 action generators can never fire today: `booking_nudge` needs `pricing_click`,
`story_reply_answer` needs `story_reply`, and the kit-pattern-4 `follow_up` needs
`code_delivered`. What does fire — `voice_note` and the stage-driven `follow_up` — is driven
by pipeline stage, not by any of these events.

ManyChat cannot export contacts at all (confirmed against ManyChat's own help docs — see
session notes for sources), so it is being removed as a dependency of the Lead Queue rather
than worked around. The queue's real problem was never the missing CSV; it's these four
signals.

## A correction made while planning this

An earlier version of this plan proposed joining `leads.session_key` to `analytics_events`
as a near-free way to derive `pricing_click`. That undersold the cost: `getSessionKey()`
(`lib/analytics/session.ts`) reads from `sessionStorage`, which resets every browser tab and
every new visit. `leads.session_key` therefore only ever holds the *signup* session — a
pricing click on a later visit has a different key and cannot be joined back to the lead.
The join is real but narrow (same-visit signup-then-browse only); it is Phase 3a below, not
the primary fix.

What actually is close to free: MailerLite's activity endpoint already returns the clicked
`url` per subscriber, and the sync already stores it in `lead_events.detail.url`
(`app/api/admin/lead-queue/sync/route.ts`). That data has subscriber identity attached
already — no session-stitching needed. That's Phase 1.

---

## Phase 1 — Derive `pricing_click` from MailerLite click URLs

**Unblocks the highest weight in the rubric (30). No new integration.**

A MailerLite campaign click arrives with subscriber identity and a target URL. A click on
`/book`, `/services`, or a Stripe/Cal.com link is a pricing click; a click on a blog post is
not. Today both are scored identically as a flat 12 (`w_email_click`).

**Work:**
- Add a URL → event-type classifier (patterns as config, not hard-coded, matching how
  weights are already stored in `lead_scoring_config` rather than in code).
- In the sync (`app/api/admin/lead-queue/sync/route.ts`), emit `pricing_click` instead of
  `clicked` when the URL matches; also derive `booking` from a Cal/Stripe link click.
- Because `detail.url` is already stored on existing `lead_events` rows, a one-off
  reclassification pass can upgrade history retroactively — this is not exclusively
  forward-looking.

**Blocking risk, checked first:** the MailerLite client was written from published API docs
and has never been verified against a real payload (`lib/mailerlite.ts` says so explicitly).
Step one of this phase is a real sync and an inspection of `lead_events.detail.url` — if the
field is absent, empty, or shaped differently than documented, the phase needs to be
re-scoped before the classifier is built on top of it.

## Phase 2 — Manual event logging in the lead drawer

**Unblocks `story_reply` (25), `code_delivered` (20), `event_attended` (18).**

These are facts only Gabs knows; no integration can report them, and trying to infer them
heuristically would put false confidence into the rankings. The honest producer is a manual
control.

**Work:**
- Four buttons in the existing lead drawer (`components/admin/lead-queue/LeadDrawer.tsx`):
  *Code delivered* · *Story reply received* · *Attended event* · *Viewed pricing*.
- Each POSTs to the existing "mark actioned" endpoint
  (`app/api/admin/lead-queue/route.ts`) with one added field for event type, writing a
  `lead_events` row with today's timestamp.
- No schema change — `lead_events.type` already accepts any text.

This is the cheapest phase and the one that most changes what the Daily Actions tab
actually serves: it's what makes `story_reply_answer` and the code-delivered `follow_up`
fire for the first time.

## Phase 3 — Analytics → `lead_events`

Two parts, kept separate because they differ sharply in cost and in privacy weight.

### 3a — Same-session join (narrow, cheap, ship it)

Join `leads.session_key` → `analytics_events` for `booking_click` / `booking_confirmed`
conversions. Catches only the case where someone views pricing in the *same visit* they
sign up. Read-only derivation off existing tables; no schema change, no client change.
Expected yield: modest, but free.

### 3b — Durable visitor stitching (the real fix — needs a decision, not just effort)

To catch a pricing click on any visit, not just the signup visit, requires a persistent
identifier:
- A durable `visitor_id` in `localStorage` (not `sessionStorage`), sent with every
  analytics event.
- Bound to the lead at signup, and re-bound on email click-through via a `?lead=` param
  appended to MailerLite campaign links.

**This is flagged, not scoped as approved work.** It introduces a persistent first-party
tracking identifier, and first-party analytics currently runs with **no consent gating**
(`lib/analytics/` has no consent checks, confirmed by search). The site's `/privacy` page
lists ManyChat and Meta Pixel as trackers but nothing like this. Building 3b needs an
explicit go-ahead, paired with either consent-gating the identifier or adding it to the
privacy page — not a unilateral engineering call.

## Phase 4 — Remove ManyChat from the Lead Queue

Scope note: this removes ManyChat as a dependency of the **Lead Queue** only. The public
Instagram widget (`components/ManyChatScript.tsx`, referenced in `app/layout.tsx` and
`/privacy`) is a live product feature, not part of this tool, and is left alone unless
told otherwise.

**Work:**
- Rename `lib/manychatCsv.ts` → `lib/leadCsv.ts`; de-brand the upload route and doc
  comments. The parser is already generic (alias-based column detection) — only the naming
  implies a ManyChat dependency that isn't structurally there.
- UI: "Upload ManyChat CSV" → "Upload CSV" (`components/admin/lead-queue/QueuePanel.tsx`).
- New CSV-imported rows get `source: 'csv_import'` rather than `'manychat'`. The `source`
  CHECK constraint keeps allowing `'manychat'` so historical rows already in the database
  stay valid — this is additive, not a rename-in-place.
- **Fix a real naming bug found while tracing this:** `EVENT_WEIGHT_KEYS` in
  `lib/leadScoring.ts` maps the `subscribed` event to `w_manychat_optin`. Every MailerLite
  subscription is currently scored under a weight literally labelled "ManyChat opt-in" —
  wrong regardless of the ManyChat decision. Rename to `w_optin` / "Opted in", delivered as
  a `lead_scoring_config` key rename in the next migration (renaming a config row's key
  needs a migration since the app reads it by key).
- Drop the unused `manychat_id` column (nothing writes it) — SQL only, in **migration
  014**, delivered as raw SQL for manual execution, matching every prior migration in this
  project. Not applied by this session.

## Phase 5 — Paste-in leads *(optional, only if wanted)*

A textarea on the Queue tab accepting `email, handle, name` lines, reusing the existing CSV
merge logic and merge report (`app/api/admin/lead-queue/upload/route.ts`,
`lib/manychatCsv.ts` / `lib/leadCsv.ts`). Only worth building if the ~25 Instagram contacts
are actually wanted in the queue; skip otherwise.

---

## Sequencing

| Phase | Effort | Depends on | Ships independently? |
|---|---|---|---|
| 2 — Manual event buttons | S | Nothing | Yes |
| 1 — MailerLite URL classify | S | A real sync, to check `detail.url` | Yes |
| 4 — Remove ManyChat dependency | S | Migration 014 | Yes |
| 3a — Analytics same-session join | M | Nothing | Yes |
| 3b — Durable visitor stitching | L | Explicit go-ahead (privacy) | No |
| 5 — Paste-in leads | S | Nothing | Yes |

**Recommended order: 2 → 1 → 4, then reassess.**

- Phase 2 needs nothing and immediately changes what the Daily Actions tab serves.
- Phase 1 is the single biggest scoring win but should open with a real MailerLite sync to
  confirm `detail.url`'s actual shape before the classifier is built against it.
- Phase 4 is tidy-up that can ride along with either.
- Hold Phase 3b until Phases 1 and 2 have been observed against real data — they may
  supply enough signal on their own, in which case the privacy cost of 3b isn't worth
  paying.

## Verification standard for this work

Same standard used to fix the migration-013 duplicate-email bug, not the standard that
produced it originally:

- Any SQL (migration 014) gets run against a local Postgres instance seeded with a
  realistic schema replica, **statement-by-statement on separate connections** — the model
  that previously caught a helper-table bug the Supabase SQL editor didn't tolerate.
- Application logic gets extended coverage in the existing engine test harness (currently
  46 assertions covering tiering, budget, rotation, suppression, idempotency, CSV parsing)
  for the new event types and the URL classifier.
- Phase 1 explicitly opens with inspecting real MailerLite sync output before writing
  classifier logic against an assumed shape — the same class of mistake (building against
  an unverified assumption) that caused the two earlier migration failures.

## Explicitly not proposed

- Paying for a ManyChat upgrade to unlock export/API access.
- An Instagram Graph API integration (requires Meta Business verification and app review —
  disproportionate for a 25-contact account).
- Heuristically inferring `code_delivered` or `story_reply` from other signals. Guessing at
  these is exactly what would put false confidence into the rankings; Phase 2 exists
  because they should come from a human who knows, not an inference.
