# Conversion optimisation — implementation plan

Date: 2026-10-07 · Branch: `claude/sessions-services-display-c48d2c` · Status: proposed

Scope: items 1, 3, 4 and 6 from the analytics review. Items 2 (header Book Now →
tarot) and 5 (Linktree/Facebook landing) are out of scope.

## Ground rules

- **No production migrations.** Nothing here needs a schema change. Any DB
  change is applied by the owner in the Supabase SQL editor, never by Claude.
- **Reads against production are `SELECT` only.** No `DELETE`/`UPDATE` on analytics tables.
- Each task ends by appending lessons to `SESSION_NOTES_astro_psyche_lab.md`
  (the single notes document).
- Verify with `npx tsc --noEmit`, `npx vitest run`, `npx next lint` before every push.

## Baseline (read-only, 2026-10-07; 165 human sessions since 2026-06-01, 55 in last 30d)

| Metric | Now |
|---|---|
| Mobile sessions that registered a `tarot` section view | 3 of 82 (but 29 flipped a card) |
| Sessions reaching `services_index` | 12 (avg 4.6 s) |
| Sessions reaching `lead_capture` | 36 (avg 8.4 s) |
| `newsletter_signup` conversions | 2 ever |
| Sessions with `booking_click` / `booking_confirmed` | 37 / 10 |
| Internal/dev referrers in "human" sessions | ≥7 (`vercel.com` 5, `localhost` 1, `github.com` 1) |

Sample size is small. Expect directional signal only; do not call A/B winners.

## Order of work

Group A (data hygiene, ship first so later changes are measured on clean data):
**Task 1 → Task 6**. Group B (layout): **Task 3 → Task 4**.
Record the Group A deploy date — section-view counts are **not comparable**
across it for tall sections.

---

## Task 1 — Fix section-view tracking on tall sections (mobile)

**Problem.** `TrackSection` only counts a section as viewed at ≥50% of the
*section's* height visible. The tarot section is taller than a phone viewport,
so it can never hit 50% on mobile.

**Approach.** A section counts as visible when the visible slice is ≥50% of the
section **or** ≥50% of the viewport height, whichever is smaller. Pure function,
unit-tested; observer thresholds widened so intermediate ratios fire.

**Files**
- `lib/analytics/visibility.ts` — new: `isSectionVisible({ intersectionHeight, targetHeight, viewportHeight })`
- `lib/analytics/visibility.test.ts` — new (vitest): short section, tall section, zero-height, partial
- `components/analytics/TrackSection.tsx` — use it in the observer callback; `threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]`; read `entry.intersectionRect.height`, `entry.boundingClientRect.height`, `window.innerHeight`
- `SESSION_NOTES_astro_psyche_lab.md` — notes + deploy date

**Do not touch:** `lib/analytics/track.ts`, `queue.ts`, `/api/analytics`, any SQL.

**Done when**
- Unit tests pass for the cases above.
- Post-deploy `SELECT` (mobile): sessions with a `tarot` `section_view` ≥ sessions with a `tarot_card_flip`
  (a flip implies the section was seen). Today it is 3 vs 29.

**Risk.** Section-view and dwell numbers rise for tall sections after deploy;
that is the fix, not a regression. Note the date.

## Task 6 — Exclude internal traffic

**Approach.** Client-side opt-out only (no DB change). Visiting any page with
`?internal=1` sets `localStorage["apl.an.internal"]="1"`; `?internal=0` clears
it. While set, the analytics client emits nothing. The flag is an owner-side
opt-out in the owner's own browser, not a visitor identifier, so the cookieless
design is unchanged. Also drop events server-side when attribution `referrer_host`
is `localhost*` (dev noise) in `/api/analytics`.

**Files** (confirm exact provider with `grep -rn ensureSessionStarted components app`)
- `lib/analytics/internal.ts` — new: `isInternal()`, `applyInternalParam(search)` (try/catch around storage)
- `lib/analytics/internal.test.ts` — new (vitest, stub `localStorage`)
- `lib/analytics/track.ts` — early-return in `track()` when `isInternal()`
- the client component that calls `ensureSessionStarted` — call `applyInternalParam(window.location.search)` first
- `app/api/analytics/route.ts` — return 204 early for `localhost` referrer host
- `SESSION_NOTES_astro_psyche_lab.md` — how to flag your phone/laptop

**Do not touch:** `supabase/migrations/*`, `analytics_*` RPCs.

**Historical data.** Existing internal sessions stay in the dashboard. Options,
owner's call: (a) live with it and compare only post-deploy; (b) owner runs a
manual `DELETE`/flag in the SQL editor after reviewing a `SELECT` list Claude
provides. Claude will not delete production rows.

**Done when** with the flag set, a page load + click produces no
`analytics_events` rows; with it cleared, rows appear.

## Task 3 — Make grid bookings measurable and more prominent

**Correction to the earlier suggestion.** Grid cards already have a booking CTA
(`components/services/ServiceRowCard.tsx`, `cta_book_card` / `booking_click`).
The real gaps: grid clicks are indistinguishable from tarot-card clicks (same
event name), and the grid is reached by few sessions.

**Approach**
1. Add `placement` (`"tarot" | "grid"`) to booking analytics props so grid vs.
   tarot conversions can be separated. Event names unchanged (dashboards keep working).
2. Add a one-line lead-in under "Every service." pointing hesitant visitors to
   the free option (copy EN/ES, text-only; no layout reorder).
3. **Do not move the grid** until 3–4 weeks of tagged data exist (decision gate below).

**Files** (step 0: read `components/booking/BookAction.tsx` to see how it forwards analytics props)
- `components/booking/BookAction.tsx` — accept/forward optional `placement`
- `components/services/ServiceRowCard.tsx` — pass `placement="grid"`
- `components/TarotDeck.tsx` — pass `placement="tarot"` on its `BookAction`s
- `components/services/ServicesIndex.tsx` — lead-in line
- `components/analytics/BookingConversionListener.tsx` — only if it must read `placement` from the DOM
- `SESSION_NOTES_astro_psyche_lab.md`

**Do not touch:** `lib/booking.ts`, `serviceCta()`, admin pages, payment code
(payments branch is merged; keep it isolated).

**Decision gate (≈4 weeks after deploy).** If grid `booking_click` sessions are
<10% of tarot's despite similar exposure, reconsider grid position; if grid
reach stays <15% of sessions, consider moving it above the magazine (needs your
sign-off — it reverses today's order).

## Task 4 — Earlier newsletter capture

**Approach.** Add a compact inline sign-up strip directly after the tarot
spread (reached by far more sessions than the current full-width section near
the bottom). Keep the existing `lead_capture` section. Reuse
`LeadCaptureForm`; distinguish placement via the analytics event prop only —
**do not change the `leads.source` value** (avoids touching the DB/check constraints).

**Files**
- `components/LeadCaptureInline.tsx` — new: single-line headline ("Not ready to book? Get the new moon letter."), EN/ES via `LangText`, wraps `LeadCaptureForm`
- `components/LeadCaptureForm.tsx` — optional `placement` prop (default `"section"`); add it to the existing `track("conversion","newsletter_signup", { source, placement })`
- `app/(public)/page.tsx` — insert `<TrackSection name="lead_inline" index={11}>` after tarot (index 11 appended so existing indexes stay comparable)
- `lib/analytics/constants.ts` — add `"lead_inline"` to `SECTION_ORDER` after `"tarot"`
- `app/admin/analytics/page.tsx` — add `lead_inline: "Newsletter (inline)"` to `SECTION_LABELS`
- `SESSION_NOTES_astro_psyche_lab.md`

**Do not touch:** `app/api/leads/route.ts`, `leads` table, MailerLite sync, `LeadCaptureSection.tsx` copy.

**Risks.** Two forms on one page (distinct input `id`s; `#lead-capture` anchor
stays on the full section). A strip right after the tarot could distract from
booking; keep it visually quiet (no dark block).

**Measure.** `newsletter_signup` per 100 sessions, split by `placement`.
Baseline ≈1.2 per 100 (2 in 165). At ~55 sessions/month this takes months to
read; treat as directional.

---

## Session prompts (copy into a fresh session each)

**Session A — Tasks 1 + 6.** "Implement Tasks 1 and 6 from
`docs/superpowers/plans/2026-10-07-conversion-optimisation.md`. Touch only the
files listed under those tasks. No migrations, no production writes. Run tsc,
vitest, lint. Append lessons to `SESSION_NOTES_astro_psyche_lab.md`."

**Session B — Tasks 3 + 4.** "Implement Tasks 3 and 4 from the same plan, after
Session A is deployed. Touch only listed files. Don't change `leads.source` or
any DB. Append lessons to the notes file."

## Open decisions for the owner

1. Task 6 historical data: live with it, or you run a manual cleanup?
2. Task 3: approve the free-option lead-in copy? (Draft EN: "Not sure where to start? Begin with the free one.")
3. Task 4: approve strip position (after tarot) and headline.
