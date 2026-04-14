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
