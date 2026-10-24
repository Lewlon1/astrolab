# Admin simplification — implementation plan

Date: 2026-10-08 · Branch: `claude/magical-goldberg-s42n1m` · Status: Tasks 1–4 implemented 2026-10-08 (sessions 1–3) · Revised 2026-10-08 after owner answers + prod read-only check

Goal: make `/admin` answer one question for Gabs every time she opens it —
**"what do I do today that gets someone closer to paying?"** — and hide everything
that doesn't serve that.

## Ground rules

- **No production migrations.** Nothing here needs a schema change. Every task reads
  existing tables only (`leads`, `bookings`, `action_items`, `events`, analytics RPCs).
- **Nothing is deleted.** Video Editor and Photoshop are hidden behind a flag, not removed;
  routes return 404 while the flag is off.
- Each session ends by appending lessons to `SESSION_NOTES_astro_psyche_lab.md`
  (the single notes document).
- Verify with `npx tsc --noEmit`, `npx vitest run`, `npx next lint` before every push.

## Current state (2026-10-08)

`components/admin/AdminNav.tsx` is a flat list of **15 top-level links** in one row:
Dashboard, Analytics, Services, Bookings, Blog, Testimonials, Events, Leads, Lead Queue,
Repurpose, Engagement, Inspiration, Transits, Video Editor, Photoshop.

Problems:
- 15 links don't fit a desktop row and are a long scroll on mobile (where Gabs likely is).
- Order is build order, not workflow order. Money (Bookings, Lead Queue) is buried mid-list.
- Video Editor and Photoshop run on mock data (`components/admin/video-editor/mockMedia.ts`)
  and are not part of any revenue path.
- Two overlapping tools: Engagement (localStorage rotation) and Lead Queue Tier 3
  (DB-backed rotation). Session notes flagged Engagement for retirement; owner wants it used more instead (see Task 4).
- Dashboard (`app/admin/page.tsx`) shows "Blog views: Coming soon", lead counts, and
  events — but **not unpaid bookings or today's lead actions**, which are the two things
  that turn into money soonest.

## Production check (read-only SELECT, 2026-10-08, project `nekpalyvjeaskdchrgih`)

| Check | Result |
|---|---|
| Migration 013 tables (`lead_events`, `lead_scoring_config`, `action_items`, `ritual_calendar`) | all 4 exist ✅ |
| Migration 014 (`bookings.payment_status`, `bookings.cal_status`, `services.payment_url`) | exist ✅ |
| `action_items` | 26 rows, generated on only **3 distinct days** (2026-08-08 → 2026-10-07). **0 ever marked done**; 8 skipped, 12 expired |
| `lead_events` | **0 rows** — MailerLite sync / ManyChat import never run, so lead scoring has no behaviour to rank on |
| `engagement_accounts` | 10 accounts set up |
| `bookings` | 6 total, **all unpaid** (4 `pending`, 2 `accepted`). May include test bookings — owner to confirm |

What this says: the tools exist and the schema is live, but there is no daily habit. Batches are
generated when Lead Queue is opened, so it has been opened ~3 times in two months. Reorganising
menus won't fix that; **the phone home screen has to *be* the daily routine.**

Owner answers: Gabs uses admin **mostly on her phone**; she **should use Engagement more but
currently doesn't** → Engagement is promoted, not retired.

## Target information architecture

Group by **where in the funnel** the tool sits, not by data type. Ordered left-to-right
from closest-to-money to furthest.

Phone-first: on mobile the 5 groups become a **bottom tab bar** (thumb reach, always visible);
desktop keeps a top bar with dropdowns.

| Group | Purpose | Items (route) |
|---|---|---|
| **Today** | One screen: what to do now | Dashboard (`/admin`) |
| **Clients** (sales) | Turn warm people into paid sessions | Lead Queue (`/admin/lead-queue`), Bookings (`/admin/bookings`), Leads (`/admin/leads`) |
| **Content** (lead generation) | Attract new people into the list/DMs | Transits (`/admin/transits`), Inspiration (`/admin/inspiration`), Repurpose (`/admin/repurpose`), Engagement (`/admin/engagement`) |
| **Website** | What visitors see and buy | Services & prices (`/admin/services`), Blog (`/admin/blog`), Events (`/admin/events`), Testimonials (`/admin/testimonials`) |
| **Insights** | Is it working? | Analytics (`/admin/analytics`) |
| *Labs* (flag off) | Experiments, hidden | Video Editor, Photoshop |

Top-level nav goes from 15 links to **5** (Today, Clients, Content, Website, Insights).

Why "Clients" is separate from "lead generation": lead generation (content) fills the top
of the funnel; Lead Queue + Bookings close it. Mixing them puts a content tool next to
"chase unpaid booking", and the urgent item gets lost.

Why Testimonials sits in Website: they are social proof on the public site, edited rarely.

---

## Task 1 — Feature flag Video Editor + Photoshop (hide from UI)

**Approach.** One typed config module, no env vars needed for the default; optional env
override so they can be switched on in a preview deploy without a code change.

**Files**
- `lib/admin/features.ts` — new:
  ```ts
  export const ADMIN_FEATURES = {
    videoEditor: process.env.NEXT_PUBLIC_ADMIN_LABS === "1",
    photoshop:   process.env.NEXT_PUBLIC_ADMIN_LABS === "1",
  } as const;
  export type AdminFeature = keyof typeof ADMIN_FEATURES;
  export const isAdminFeatureOn = (f: AdminFeature) => ADMIN_FEATURES[f];
  ```
- `lib/admin/features.test.ts` — new: off by default, on when env is `"1"`.
- `app/admin/video-editor/layout.tsx` — call `notFound()` when flag off (layout, so the
  fullscreen wrapper doesn't render either).
- `app/admin/photoshop/layout.tsx` — same.
- `components/admin/AdminNav.tsx` — nav items carry an optional `feature` key; filtered
  out when off (done as part of Task 2's rewrite).

**Not touched:** `components/admin/video-editor/**`, `components/admin/photoshop/**`.

**Done when:** neither link appears; `/admin/video-editor` and `/admin/photoshop` 404;
setting `NEXT_PUBLIC_ADMIN_LABS=1` locally brings both back.

---

## Task 2 — Grouped navigation

**Approach.** Replace the flat list with a typed nav config and 5 groups. **Mobile first:**
a fixed bottom tab bar with the 5 groups (icon + short label). Tapping a group with one page
goes straight there; tapping a group with several opens a bottom sheet listing its pages.
Hamburger removed. Desktop: top bar, each group a button with a small dropdown panel.
Active group highlighted via `usePathname()`. Add bottom padding to the admin content
area so the tab bar never covers the last row; respect `env(safe-area-inset-bottom)`.

Keep the top-bar layout (don't switch to a sidebar): Photoshop/Video Editor layouts
assume `top-14`, and a sidebar would change every admin page's width.

**Files**
- `components/admin/navConfig.ts` — new: `NAV_GROUPS: { label, items: { label, href, feature? }[] }[]`
  and `visibleNavGroups()` that applies `isAdminFeatureOn`. "Today" is a single link, not a dropdown.
- `components/admin/navConfig.test.ts` — new: no group empty after filtering; every
  `href` starts with `/admin`; labs items hidden by default.
- `components/admin/AdminNav.tsx` — rewrite to render from `navConfig` (desktop top bar);
  close dropdown on route change and on outside click / Escape.
- `components/admin/AdminTabBar.tsx` — new: mobile bottom tab bar + bottom sheet.
- `app/admin/layout.tsx` — mount the tab bar (hidden `md:` and up), add bottom padding on mobile.
- `app/admin/photoshop/layout.tsx`, `app/admin/video-editor/layout.tsx` — already flag-guarded in Task 1;
  no tab-bar work needed while labs are off.

**Done when:** 5 top-level entries on desktop and in the mobile tab bar; every non-labs page
reachable in ≤2 taps; checked at 375px width (Playwright screenshot) with no horizontal scroll.

---

## Task 3 — "Today" home screen: the daily routine on one phone screen

**Approach.** Rewrite `app/admin/page.tsx` as a checklist Gabs works top-to-bottom on her
phone, then is done. Stats move below the fold.

1. **Get paid** (only if any): unpaid bookings (`payment_status = 'unpaid'` and
   `cal_status in ('pending','accepted')`) — each row shows name, session, date, and the
   one action (chase / mark paid) linking to `/admin/bookings`. Prod has 6 today.
2. **Today's actions**: load (and generate if missing) today's batch via `todayInMadrid()` +
   `loadBatch()` from `lib/dailyActions.ts`, so **opening admin = getting a batch** (today it
   only happens if she opens Lead Queue). Show top 3 with Done / Skip buttons calling the
   existing `PATCH /api/admin/actions/[id]`; "See all" → `/admin/lead-queue`.
3. **Engage (10 min)**: today's engagement accounts from `engagement_accounts` (same daily
   rotation logic as `EngagementClient`), each with a one-tap Instagram link and a
   "Suggest reply" button that opens the existing reply assistant (`/api/suggest-reply`).
4. **Progress line**: "3 of 8 done today" — a visible finish line is the habit hook.
5. Metrics row below: Leads this week, Total subscribers, **Paid bookings (30d)** (replaces
   "Blog views: Coming soon"), Upcoming events. Recent leads + events unchanged, below that.

Must render with zero bookings, an empty batch, and zero engagement accounts.

**Files**
- `app/admin/page.tsx`
- `components/admin/today/` — new: `UnpaidBookingsCard.tsx`, `TodayActionsCard.tsx`,
  `EngageCard.tsx`, `TodayProgress.tsx` (client components; small, mobile-first)
- `lib/dailyActions.ts` — reuse; extract a `getOrCreateTodayBatch()` helper if
  `app/api/admin/actions/route.ts` holds the generate-if-missing logic, and call it from both
- `app/api/admin/actions/route.ts` — switch to the shared helper (no behaviour change)
- `components/admin/EngagementClient.tsx` — extract the rotation + done-state logic to
  `lib/engagementRotation.ts` (+ test) so the dashboard card and the page share it

**Done when:** at 375px, the unpaid-bookings card and the first action are visible without
scrolling; ticking an action updates the progress line without reload.

---

## Task 4 — Make Engagement a habit, not a separate page

Owner wants Gabs using Engagement more. Two things block that: it lives on its own page
nobody opens, and its done-state is in `localStorage` (lost across phone/laptop, invisible
to Lead Queue). Lead Queue Tier 3 (`comment_engage`) already generates the same kind of task
in the DB.

**Approach (after Task 3 ships):**
- Treat Lead Queue Tier 3 `comment_engage` items as the single source of truth for "engage
  with account X today"; the Today Engage card and `/admin/engagement` both read/write
  `action_items` instead of `localStorage`. No schema change — `action_items` already has
  status.
- Keep `/admin/engagement` as the full page (reply assistant + account management) under
  **Content**.

**Files:** `lib/engagementRotation.ts`, `components/admin/EngagementClient.tsx`,
`components/admin/today/EngageCard.tsx`, `lib/actionEngine.ts` (read-only check of Tier 3
shape; edit only if account id isn't already on the item).

---

## Prerequisite outside the code — feed the Lead Queue

`lead_events` is empty, so Tier 1 conversion actions are ranking on nothing. Owner tasks from
`docs/LEAD_QUEUE_SETUP.md`: add the MailerLite API key and press Sync; import a ManyChat CSV.
Without this, Today will mostly show filler actions.

---

## Suggested session split

| Session | Tasks | Files |
|---|---|---|
| 1 | Task 1 + Task 2 | `lib/admin/features.ts`(+test), `components/admin/navConfig.ts`(+test), `components/admin/AdminNav.tsx`, `components/admin/AdminTabBar.tsx`, `app/admin/layout.tsx`, `app/admin/video-editor/layout.tsx`, `app/admin/photoshop/layout.tsx`, `SESSION_NOTES_astro_psyche_lab.md` |
| 2 | Task 3 | `app/admin/page.tsx`, `components/admin/today/*`, `lib/dailyActions.ts`, `app/api/admin/actions/route.ts`, `lib/engagementRotation.ts`(+test), `components/admin/EngagementClient.tsx`, `SESSION_NOTES_astro_psyche_lab.md` |
| 3 | Task 4 | `lib/engagementRotation.ts`, `components/admin/EngagementClient.tsx`, `components/admin/today/EngageCard.tsx`, `lib/actionEngine.ts`, `SESSION_NOTES_astro_psyche_lab.md` |

## Open questions for the owner

1. Are the 6 unpaid bookings real clients or payment-flow tests? If tests, clean them up
   (prepare reviewed SQL, owner runs it) so the Today card isn't noise from day one.
2. Has the MailerLite key been added in Vercel? (`lead_events` = 0 suggests not.)
