# Admin simplification — implementation plan

Date: 2026-10-08 · Branch: `claude/magical-goldberg-s42n1m` · Status: plan only, nothing implemented

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
  (DB-backed rotation). Session notes already flag Engagement as a retirement candidate.
- Dashboard (`app/admin/page.tsx`) shows "Blog views: Coming soon", lead counts, and
  events — but **not unpaid bookings or today's lead actions**, which are the two things
  that turn into money soonest.

## Target information architecture

Group by **where in the funnel** the tool sits, not by data type. Ordered left-to-right
from closest-to-money to furthest.

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

**Approach.** Replace the flat list with a typed nav config and 5 groups. Desktop: each
group is a button with a small dropdown panel. Mobile: the hamburger shows group headings
with their links underneath (no nested toggles — one tap to any page). Active group
highlighted via `usePathname()`.

Keep the top-bar layout (don't switch to a sidebar): Photoshop/Video Editor layouts
assume `top-14`, and a sidebar would change every admin page's width.

**Files**
- `components/admin/navConfig.ts` — new: `NAV_GROUPS: { label, items: { label, href, feature? }[] }[]`
  and `visibleNavGroups()` that applies `isAdminFeatureOn`. "Today" is a single link, not a dropdown.
- `components/admin/navConfig.test.ts` — new: no group empty after filtering; every
  `href` starts with `/admin`; labs items hidden by default.
- `components/admin/AdminNav.tsx` — rewrite to render from `navConfig`; close dropdown on
  route change and on outside click / Escape.

**Done when:** 5 top-level entries on desktop; every existing (non-labs) page reachable
in ≤2 clicks; mobile menu fits on one phone screen without scrolling (13 links + 5 headings).

---

## Task 3 — "Today" dashboard: money first

**Approach.** Reorder `app/admin/page.tsx` so the first screen is actions, not stats.

1. **Needs you now** (top, only renders rows that have something):
   - Unpaid bookings: `bookings` where `payment_status = 'unpaid'` and `cal_status in ('pending','accepted')`
     → count + link to `/admin/bookings`.
   - Today's lead actions: count of today's `action_items` not done (reuse `todayInMadrid()`
     + `loadBatch()` from `lib/dailyActions.ts`) → link to `/admin/lead-queue`.
     If migration 013 isn't applied, the query errors → hide the row, don't crash.
2. **Metrics row** — replace "Blog views: Coming soon" with **Paid bookings (30 days)**
   (`payment_status in ('paid','manual')`). Keep Leads this week, Total subscribers, Upcoming events.
3. Recent leads + upcoming events — unchanged.
4. **Quick actions** — regroup to match the nav (Clients / Content / Website), drop
   anything pointing at labs.

**Files**
- `app/admin/page.tsx`
- `lib/dailyActions.ts` — read-only reuse; touch only if an exported count helper is
  cleaner than `loadBatch()`.

**Done when:** an unpaid booking or pending lead action is visible without scrolling on a
phone; dashboard still renders with zero bookings and with migration 013 missing.

---

## Task 4 (optional, owner decision) — Retire Engagement into Lead Queue

Engagement duplicates Lead Queue Tier 3 with a weaker (localStorage) store. Proposal:
flag it off with the same mechanism as Task 1 once Gabs confirms she uses Daily Actions
instead. **Do not do this without her confirmation** — it's her daily habit tool.

**Files:** `lib/admin/features.ts` (add `engagement`), `components/admin/navConfig.ts`,
`app/admin/engagement/layout.tsx` (new, `notFound()` guard). `engagement/accounts` sits
under the same layout so is covered.

---

## Suggested session split

| Session | Tasks | Files |
|---|---|---|
| 1 | Task 1 + Task 2 | `lib/admin/features.ts`(+test), `components/admin/navConfig.ts`(+test), `components/admin/AdminNav.tsx`, `app/admin/video-editor/layout.tsx`, `app/admin/photoshop/layout.tsx`, `SESSION_NOTES_astro_psyche_lab.md` |
| 2 | Task 3 | `app/admin/page.tsx`, (maybe) `lib/dailyActions.ts`, `SESSION_NOTES_astro_psyche_lab.md` |
| 3 | Task 4, only after Gabs confirms | `lib/admin/features.ts`, `components/admin/navConfig.ts`, `app/admin/engagement/layout.tsx`, `SESSION_NOTES_astro_psyche_lab.md` |

## Open questions for the owner

1. Does Gabs use admin mostly on her phone? (Changes whether Task 2 optimises the dropdown or the mobile list first.)
2. Does she still open Engagement daily, or has Lead Queue replaced it?
3. Is migration 013 applied in production yet? If not, the "Today's lead actions" row in Task 3 will stay hidden until it is.
