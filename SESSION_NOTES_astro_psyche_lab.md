# Astro Psyche Lab — V1 Public Redesign

**Session date:** 2026-04-14
**Branch:** `astrolab-V1` (created off `main`)
**Status:** Ready for review + manual SQL + Vercel preview deploy

---

## Summary

Full public-facing visual overhaul delivered without touching admin, API, Supabase, MailerLite, ManyChat, or Calendly integrations. Port of `astro_psyche_lab_v4.html` into the existing Next.js 14 (App Router) app structure.

- New **sunset palette** via CSS custom properties
- New **typography stack**: Cormorant Garamond (serif), Outfit (sans), Syne (display)
- **Bilingual EN/ES toggle** (React Context, localStorage-persisted)
- **Interactive 5-card tarot deck** driven by `services` table
- **Founder section** placed before service tarot deck
- **Soul Guided Travel Magazine** — new product section (+ SQL insert provided)
- **Dark blog preview** section on homepage with pillar-coded tags
- Restyled `/about`, `/services`, `/blog`, `/book`, `/events`
- `LeadCaptureForm` → `/api/leads` integration preserved (verified: `201 Created`)

---

## Files modified

```
app/(public)/about/page.tsx
app/(public)/blog/[slug]/page.tsx
app/(public)/blog/page.tsx
app/(public)/book/page.tsx
app/(public)/events/page.tsx
app/(public)/layout.tsx          — wraps children in <LangProvider>
app/(public)/page.tsx            — recomposed with new sections
app/(public)/services/page.tsx
app/globals.css                  — full sunset palette + new component styles
app/layout.tsx                   — new Google Fonts (Cormorant, Outfit, Syne)
components/BlogPostCard.tsx
components/BlogPostList.tsx
components/CalendlyBooking.tsx   — tabs restyled; Script integration unchanged
components/EventCard.tsx
components/FAQ.tsx
components/PageHero.tsx
components/PastEventsSection.tsx
components/ServiceCard.tsx
components/ShareButtons.tsx
components/SiteFooter.tsx        — single-line ink-black footer
components/SiteHeader.tsx        — new nav (About/Sessions/Travel Magazine/Reviews/Blog/Book Now), gold "Lab" logo, lang toggle inline
tailwind.config.ts
```

## Files created

```
context/LangContext.tsx          — Lang context + localStorage persistence
components/LangText.tsx          — <LangText en="…" es="…" /> helper
components/LangToggle.tsx        — EN/ES pill
components/Reveal.tsx            — IntersectionObserver scroll reveal
components/Hero.tsx              — hero with gradient bg + 4 animated orbs
components/JungRibbon.tsx        — deep-brown quote ribbon
components/Founder.tsx           — Gabs' bio w/ astro-tag + stats
components/TarotDeck.tsx         — 5 flip cards driven by Supabase services
components/MagazineDetail.tsx    — Travel Magazine feature section
components/Testimonials.tsx      — horizontal scroll (falls back to demo data)
components/BlogPreview.tsx       — dark 3-post preview section
components/HomeCTA.tsx           — gradient booking CTA
components/LeadCaptureSection.tsx — sunset-wrapper around existing LeadCaptureForm

public/images/The_fool.JPG
public/images/The_sun.JPG
public/images/The_star.jpg
public/images/The_empress.JPG
public/images/The_wheel_of_fortune.JPG
public/images/Website_profile.png

sql/astrolab-v1-services.sql     — NOT executed; run manually in Supabase SQL editor
```

## Files NOT touched (by design)

- `app/admin/**` (all admin pages + components)
- `app/api/**` (including `/api/leads`)
- `lib/supabase/**`
- `lib/bedrock.ts`, `lib/brave-search.ts`, `lib/constants.ts`, `lib/jsonld.ts`, `lib/utils.ts`
- `middleware.ts`
- `supabase/migrations/**`
- `components/admin/**`
- `components/LeadCaptureForm.tsx`
- `components/ManyChatScript.tsx`
- `.env.local`

Verified with `git diff main --name-only` — zero files in the above paths.

---

## SQL to run manually

File: `sql/astrolab-v1-services.sql`

Three statements wrapped in a transaction:
1. Rename existing €65 `Stellar Insights` → `Astro Psyche Blend`
2. Insert new `Stellar Insights` at €120
3. Insert new `Soul Guided Travel Magazine` at €75

**How to run:** Open Supabase Studio → SQL editor → paste file contents → Run. A rollback block is included as a commented-out section at the bottom for safety.

Until this SQL runs:
- The Sun card shows €65 (the fallback price, since `astro-psyche-blend` slug doesn't exist yet). After SQL it will still show €65 (correct — Astro Psyche Blend is €65).
- The Star card (Stellar Insights) shows €65 pre-SQL (the old €65 row hasn't been renamed yet). After SQL: €120.
- The Wheel card (Magazine) shows fallback €75 pre-SQL. After SQL: €75 from DB.

All card essence text and feature lists are hardcoded in `components/TarotDeck.tsx` so they display correctly regardless of SQL state.

---

## Verification outcomes

Dev server (`npm run dev`) runs cleanly on `localhost:3000`.

- ✅ Homepage renders in correct order: Hero → Jung ribbon → Founder → Tarot → Magazine → Testimonials → Lead capture → Blog preview → CTA
- ✅ EN/ES toggle in header swaps all bilingual strings (tested on homepage; persists to `localStorage['apl.lang']`)
- ✅ All 5 tarot cards flip on click; backs reveal correct tier / service name / price / essence quote / features / booking link
- ✅ Lead capture form submission: `POST /api/leads → 201 Created` (network panel confirmed)
- ✅ Admin login page (`/admin/login`) still renders with auth flow intact — visual change limited to font swap (Playfair → Cormorant on "ASTRO LAB" header)
- ✅ `/services` renders with sunset palette, cream cards, gold borders, coral prices
- ✅ `/about`, `/blog`, `/book`, `/events` restyled to match
- ✅ Mobile responsive (375px): tarot 2-per-row, nav collapses to hamburger, lang toggle visible alongside hamburger
- ✅ No client console errors after full reload
- ✅ `git diff --name-only main` reveals zero files in `app/admin`, `app/api`, `lib/supabase`, `supabase/migrations`, `middleware.ts`, `.env.local`

---

## Follow-ups

1. **Run the SQL** at `sql/astrolab-v1-services.sql` in Supabase Studio to apply the service data changes.
2. **Update Calendly URLs** for new services in `/admin/services` if Gabs wants different event types per tier (all three new rows default to the generic `/astropsychelabadmi/30min` link).
3. **Bilingual testimonials** — DB testimonials are currently single-language. The `Testimonials` component falls back to 3 bilingual demo cards if no DB testimonials are returned. To enable per-row bilingual content, add `quote_en` / `quote_es` columns to the `testimonials` table (schema change — out of scope for V1).
4. **Bilingual blog posts** — same pattern as above. Current v1 shows blog content in its stored language only.
5. **Deploy to Vercel preview** — push `astrolab-V1` to origin and open a PR against `main`; Vercel will generate a preview URL for Gabs to review before merging.
6. **Optional** — once V1 is live, consider migrating admin UI (font-heading class) to the new Cormorant stack for brand cohesion (currently admin uses the same font family but visually benefits from Playfair. Current admin remains functional but the heading face has shifted).

---

## Technical notes

- **LangContext** is a client-side React context; hydrates from `localStorage` on mount (SSR-safe via `useEffect`). Default language is EN.
- **TarotDeck** is a client component that receives `services: Service[]` as a prop from the server-rendered homepage. The homepage fetches only the 5 tarot slugs via `.in('slug', TAROT_SLUGS)`.
- **Scroll reveal** is implemented via a `Reveal` wrapper using IntersectionObserver (threshold 0.1, unobserves after first visibility).
- **Button classes** `.btn-primary`, `.btn-secondary`, `.btn-white` are defined in `globals.css` and used throughout — they're also used inline via `style` props in a few places for flexibility.
- **Tarot card back colour themes** map slug → theme class (`tc-fool`, `tc-sun`, `tc-star`, `tc-empress`, `tc-wheel`) — each sets the back background + feature bullet colour per v4 HTML.
- **Admin theme** (`.admin-theme` class, applied by `app/admin/layout.tsx`) still overrides the body `background-color` and text colour to the light admin palette. No admin regressions.
- **Fonts** are loaded once in `app/layout.tsx` via `next/font/google` and exposed as CSS variables; Tailwind `font-heading`, `font-body`, `font-display` utility classes map to those variables.

---

# Transit Planner Admin Tab — Phase 1

**Session date:** 2026-05-06
**Branch:** `claude/transit-planner-admin-SebCo`
**Status:** Architecture + UI shipped. Awaiting (1) prototype paste-in for real transit data, (2) Lewis to run two SQL files manually.

## What shipped

A fourth admin tool at `/admin/transits` with:

- Three-tab view switcher (Timeline · Calendar · Drafts), filter state shared across Timeline ↔ Calendar
- Timeline view (day-grouped agenda) and Calendar view (Mon-first month grid with type-coloured dots, popover on click, mobile fallback banner below 640px)
- Detail drawer (right slide-in) with sky reading + personal hits + two action buttons
- Single-post draft modal (pillar / format / language / angle pickers → Bedrock Sonnet → Save / Copy)
- 24-read horoscope bundle modal (one Bedrock call returns 12 signs × Sun/Rising; per-card copy + bundle save)
- "Copy prompt" fallback on both modals (uses the same builder the API uses)
- Drafts tab with separate sections for single-post drafts and horoscope bundles (bundles expand to show all 24 reads)
- Toast notifications, ConfirmModal for deletes, rate-limit timers (30s draft / 60s horoscope), error states with Copy Prompt fallback path always available

## What's deferred

- **Phase 2 work** (FastAPI Lambda Swiss Ephemeris endpoint, live personal-hit calculation, Vercel cron, natal-chart settings UI, edit-draft/edit-bundle modals, Calendar/MailerLite push, optional pre-generation cron) — all noted in the plan file, none built.

## Prototype paste-in pass

After the initial Phase 1 commit, Lewis supplied the full `transit_planner_v2.jsx` content. A second commit ported:

- **All 34 transit entries** verbatim into `lib/transits/transits-data.ts` (May 1 → October 26, 2026). Each entry is tagged `horoscopeable: boolean` per the rule (true for all lunations, ingresses, retrograde stations, and aspects with `intensity: 'major'`; false only for the one mid-intensity aspect, `mercury-square-nodes-may19`). Result: 33 of 34 transits are horoscopeable.
- **`buildDraftPrompt`** rewritten with the prototype's `buildPrompt()` text verbatim. The prototype emitted a single string (it called Anthropic Messages API directly). Here the same content is split into Bedrock's SYSTEM (voice + rules + pillar + format + language — stable per-call instructions) and USER (transit context + angle + "Output ONLY..." instruction). Concatenating SYSTEM + USER yields a prompt functionally equivalent to the prototype's original output, which is what the Copy Prompt button does.
- **`PersonalHit` type reshaped** to match the prototype's flat `{ aspect, planet, natal, meaning }` shape. The earlier Phase 1 type used a more structured `{ natalPoint, natalSign, natalDegree, aspect, orb, reading }` form that didn't match the prototype's free-form natal strings (e.g. `"Pisces 15°"`). `DetailDrawer.tsx` render updated to match.
- **Pillar definitions** in `buildDraftPrompt.ts` now name actual services with real €prices (Cosmic Quick Hit €25, Blend Reading €65, Stellar Reading €120, Cosmic Alliance €180, Star-Crossed €95) per the prototype's CONVERT pillar instruction.

## Files modified

```
components/admin/AdminNav.tsx                       — added Transits link
SESSION_NOTES_astro_psyche_lab.md                   — this section
```

## Files created

```
app/admin/transits/page.tsx                         — server shell
app/api/transit-draft/route.ts                      — Bedrock single-post (text)
app/api/transit-horoscope/route.ts                  — Bedrock 24-read bundle (JSON, with retry-on-validation-fail)

components/admin/transits/TransitsClient.tsx        — top-level orchestration
components/admin/transits/TimelineView.tsx
components/admin/transits/CalendarView.tsx
components/admin/transits/DraftsView.tsx
components/admin/transits/DetailDrawer.tsx
components/admin/transits/DraftModal.tsx
components/admin/transits/HoroscopeModal.tsx
components/admin/transits/TransitCard.tsx           — shared, supports `compact` for popovers
components/admin/transits/TodaySnapshot.tsx
components/admin/transits/MonthBar.tsx
components/admin/transits/FilterBar.tsx

lib/transits/types.ts
lib/transits/transits-data.ts                       — 3 placeholders + TODO
lib/transits/natal-chart.ts                         — placeholder GABS_NATAL + TODO
lib/transits/colors.ts                              — type → dot/badge colour
lib/transits/utils.ts                               — date helpers, filter, group, month grid
lib/transits/buildDraftPrompt.ts                    — shared client+server (no server-only imports)
lib/transits/buildHoroscopePrompt.ts                — shared client+server, supports `strict` retry mode

supabase/transit_drafts.sql                         — Lewis runs manually
supabase/transit_horoscopes.sql                     — Lewis runs manually
```

## Files NOT touched (by design)

- `app/admin/inspiration/**`, `app/admin/repurpose/**`, `app/admin/engagement/**` (all other admin tools)
- `lib/supabase/**`, `lib/bedrock.ts`, `lib/constants.ts`
- All other API routes (`/api/inspiration`, `/api/repurpose`, `/api/suggest-reply`, `/api/leads`)
- `supabase/migrations/**` (the two new tables ship as standalone `.sql` files for manual run, NOT as numbered migrations)
- `src/api_lambda/**` (reserved for Phase 2 Swiss Ephemeris work)

Verified via `git status` and the file list above — no edits outside scope.

## SQL to run manually

Two files in `supabase/`. Lewis: paste each into Supabase SQL editor → Run → confirm tables exist.

**`supabase/transit_drafts.sql`** — single-post drafts (`id, transit_id, transit_title, transit_date, pillar, format, language, angle, content, created_at`). RLS matches existing admin tables: `auth.role() = 'authenticated'` for all operations.

**`supabase/transit_horoscopes.sql`** — 24-read bundles (`id, transit_id, transit_title, transit_date, language, reads jsonb, created_at`). `reads` is a JSONB array of `{sign, placement, content}`. Same RLS pattern. Two indexes: `created_at DESC` and `transit_id`.

Until both are run: `/admin/transits` loads, Timeline + Calendar work, Bedrock Generate + Copy Prompt buttons work — but Save / Drafts tab fail with a toast error.

## Verification outcomes

- ✅ `npx tsc --noEmit` — clean
- ✅ `npx next lint` — no warnings or errors
- ✅ `npx next build` — clean compile, new routes registered (`/admin/transits` 12.7 kB / 171 kB First Load JS, `/api/transit-draft`, `/api/transit-horoscope`)
- ⏳ Browser smoke-test (filter → click transit on Timeline → drawer → draft → save → reload → delete; switch to Calendar → click day → popover → drawer; horoscope flow E2E) — gated on Lewis running the two SQL files. The Bedrock calls themselves should work without DB.
- ⏳ Regression check on Inspiration / Repurpose / Engagement — gated on Vercel preview or local dev server. Build passes for all of them, no shared imports were modified.

## Deviations from the original session prompt

1. **Path conventions.** Session prompt used `src/app/...` and `src/components/...`; repo has no `src/` dir. All paths above are correct for the actual layout.
2. **File layout split.** Session prompt colocated everything under `src/app/admin/transits/`. The actual codebase splits server pages (`app/admin/<tool>/page.tsx`) from client components (`components/admin/<Tool>Client.tsx`). New code follows the split convention and matches Inspiration/Repurpose/Engagement.
3. **Visual aesthetic.** Session prompt described "dark cosmic" admin (bg-midnight, text-cream, gold accents). Actual admin is the opposite — light/neutral white cards with `bg-deep` (#0f4e77) primary and `text-[#1a1a18]` body. New tool matches the existing admin exactly so it doesn't look orphaned.
4. **RLS wording.** Session prompt used `to authenticated using (true)`; existing tables use `FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (...)`. Both new tables use the existing wording for consistency.

## New patterns introduced (worth reusing)

- **Shared client+server prompt builders** at `lib/transits/buildDraftPrompt.ts` + `lib/transits/buildHoroscopePrompt.ts`. Pure functions, no server-only imports. The Copy Prompt button calls the same builder the API route does, so the fallback prompt (paste into Claude.ai) is byte-identical to what Bedrock would have received. First time this pattern's been used in the repo — could be applied to Inspiration / Repurpose later.
- **Right slide-in drawer** at `components/admin/transits/DetailDrawer.tsx`. Backdrop click + Escape close, body scroll lock, `translate-x` transition. Local for now — promote to `components/admin/ui/Drawer.tsx` if a second tool needs it.
- **Mon-first month grid** in `lib/transits/utils.ts:buildMonthGrid()` + `CalendarView.tsx`. Pure utility (no calendar library). Returns 42 cells with `{ date, inMonth }`. Reusable for any future calendar UI.
- **Bedrock JSON validation + retry** in `app/api/transit-horoscope/route.ts`. The existing `invokeModelJSON` helper strips fences but doesn't validate shape; this route adds a validator (length, all 24 unique sign+placement pairs, min content length) plus one stricter-prompt retry. If horoscope JSON proves stable in practice, the validator can stay; if not, this is the obvious place to harden.

## Outstanding TODOs

1. Run `supabase/transit_drafts.sql` and `supabase/transit_horoscopes.sql` in Supabase SQL editor.
2. Smoke-test E2E in dev / Vercel preview: filter → click transit (Timeline + Calendar) → drawer → draft → save → reload; switch to Calendar → click day → popover → drawer; click "Generate sign-by-sign read" on a major transit → verify all 24 reads come back, language toggle works → save bundle. Capture latency + JSON-validation reliability data for Phase 2 planning.
3. (Phase 2) Wire real birth data into `lib/transits/natal-chart.ts` and start replacing the hardcoded personal hits with live Swiss Ephemeris calculations.

---

## 2026-06-01 — Cal.com + Stripe booking (replaced Calendly)

**What changed**
- Mixed booking: 3 Cal popups (Blend/Stellar/Alliance) via `@calcom/embed-react` + 2 Stripe Payment Links (Quick Hit/Travel). Single `SERVICES` config in `lib/booking.ts`; `BookAction` dispatches by `kind` (cal → popup button, stripe → new-tab link).
- Payment handled inside Cal (Stripe app) / Stripe links. Site handles no money. **No Supabase changes.**

**Confirmed config**
- Cal username: `theastropsychelab`
- Cal events: `astro-psyche-blend` (45m/€65), `stellar-insights` (60m/€120), `cosmic-alliance` (90m/€180)
- Stripe links: Quick Hit €25 (…wI01), Travel €75 (…wI02)
- Stripe app on Cal events: **UNVERIFIED (human pre-flight)** | GCal connected: **UNVERIFIED** | test booking verified: **UNVERIFIED**

**Product decisions (asked, not in brief)**
- Homepage final CTA ("Book Your Session") → **scrolls to #tarot** (pick a reading), no longer a generic Calendly link.
- `/book` page → **grid of all 5 services** (Cal popups + Stripe), rendered from `SERVICES` (dropped the Supabase fetch; page is now static).

**Actual files touched**
- create: `lib/booking.ts`, `components/booking/CalBookButton.tsx`, `components/booking/BookAction.tsx`, `components/booking/BookingGrid.tsx`, `components/analytics/BookingConversionListener.tsx`
- modify: `components/TarotDeck.tsx` (v4 cards live — detail "Book Now" → `BookAction` by slug; removed per-card `calendly` fields), `components/MagazineDetail.tsx` (Order → Stripe travel; dropped `magazineCalendlyUrl` prop), `components/MagazinePreviewModal.tsx` (`calendlyUrl` prop → `orderUrl`, Stripe), `components/HomeCTA.tsx`, `app/(public)/book/page.tsx`, `components/ServiceCard.tsx` (mapped slugs → `BookAction`, else `/services/[slug]`), `app/(public)/page.tsx`, `app/(public)/layout.tsx`, `types/index.ts` (`calendly_click` → `booking_click`), `supabase/migrations/010_analytics_rpcs.sql` (funnel event name), `.env.local` (+`NEXT_PUBLIC_CAL_USERNAME`), `package.json` + lockfile (+`@calcom/embed-react`)
- delete: `components/CalendlyBooking.tsx`, `components/analytics/CalendlyConversionListener.tsx`
- **NOT touched:** `components/admin/ServiceEditForm.tsx` + `Service.calendly_url` (admin off-limits; DB column kept, just unused by public booking). No `react-calendly` dep and no `NEXT_PUBLIC_CALENDLY_*` vars ever existed.

**Lessons / gotchas**
- `@calcom/embed-react` **1.5.3**: uses the modern `cssVarsPerTheme` UI shape, and its `Record<Theme,…>` type requires **both `light` AND `dark`** keys (tsc errors with only `light`). Confirmed bookings captured via `cal("on", { action: "bookingSuccessful" })` — Cal does NOT use Calendly's `event_scheduled` postMessage.
- This same session had just shipped a first-party analytics layer that tracked a `calendly_click` conversion + a Calendly `event_scheduled` listener. Renamed the conversion to tool-agnostic `booking_click` (type union + funnel RPC + CTA `data-*`) and repointed the confirmed-booking listener to Cal's event, so the analytics funnel keeps working.
- `BookAction`/`CalBookButton` were widened beyond the brief (`label: ReactNode`, plus `style` and analytics `data-*` passthrough) to preserve each CTA's existing copy/inline styling and keep conversion tracking intact. Cal button gets `border:none; cursor:pointer` so the `<button>` looks identical to the old `<a>`.
- The "Supabase" MCP in this environment points at unrelated projects (CFO Prod/Staging), not astrolab — confirmed no DB work was needed or done.

**Verification**
- ✅ `tsc --noEmit` clean · ✅ `next lint` clean (only pre-existing photoshop/video-editor warnings) · ✅ `next build` clean (`/book` now static)
- ✅ dev smoke: `/` and `/book` → 200; homepage active card → `data-cal-link="theastropsychelab/stellar-insights"` + Stripe travel link; `/book` → all 3 Cal links + both Stripe links; **0** `calendly.com` on public pages; no console errors
- ⏳ Human pre-flight (NOT done here — needs Cal/Stripe dashboards): Stripe app + payment required on the 3 Cal events; GCal connected; birth-data booking questions (Alliance/synastry needs TWO people); Stripe links' birth-data fields + after-payment redirect + receipts; delete/hide old `cosmic-quick-hit` & `soul-guided-travel-magazine` Cal event types; verify public links in incognito.
- ⏳ Vercel: add `NEXT_PUBLIC_CAL_USERNAME=theastropsychelab` (Production + Preview); verify on a preview deploy before promoting.

**Still open**
- Star-Crossed (€95) — create Cal event + add `starCrossed` to `SERVICES` when ready.
- Cosmic Check-In (€45/mo) — recurring Stripe Payment Link + `checkIn` entry.
- Cal.com branding removal (Teams plan); Phase 2: Cal/Stripe webhooks → Supabase booking log.
