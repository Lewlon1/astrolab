# Editorial Cosmic homepage — port notes

Port of "Direction C · Editorial Cosmic" (the third design exported from
`claude.ai/design`) into the live Next.js repo. Replaces the prior "Sunset
Refined" V1 homepage end-to-end. All Supabase wiring, EN/ES `<LangText>`
i18n, admin routes, and API handlers are untouched.

## What changed

### Foundation

- `app/globals.css` — added an `--ed-*` palette block under the existing
  sunset palette. Existing tokens retained for `/admin`, `/services`,
  `/blog/*`, `/about` which still use them. Added utilities:
  `.editorial-page` (paper bg + Spectral default), `.ed-perspective`,
  `.ed-3d`, `.ed-backface-hidden`, `.ed-dropcap` (drop-cap on body para),
  `.ed-newsletter` (re-styles the existing `LeadCaptureForm` to match the
  dark editorial newsletter row).
- `tailwind.config.ts` — added `colors.ed.*` namespace and four font
  families (`fraunces`, `instrument`, `spectral`, `dm-mono`).
- `app/layout.tsx` — registered Fraunces / Instrument Serif / Spectral /
  DM Mono via `next/font/google`. Existing fonts (Cormorant, Outfit, Syne)
  remain loaded for non-editorial pages.

### New files

- `lib/editorialDate.ts` — pure helper that computes
  `{ issueNum, monthEn, monthEs, year }`. Issue 1 = April 2025, so May 2026
  = Issue 14. Computed server-side in the public layout to avoid hydration
  mismatch.
- `components/Loupe.tsx` — TS port of the prototype's `editorial-loupe.jsx`.
  Brass bezel with three cycling stages: Deck (5 tarot cards drifting),
  Map (astrocartography rotating), Wheel (natal chart rotating). Captions
  are bilingual via `<LangText>`. Indicators are clickable; clicking restarts
  the 4400 ms auto-cycle.
- `public/images/astrocartography.png` and `public/images/natal_chart.png`
  — copied from the design package.

### Component rewrites

All existing prop signatures preserved; only presentation changed. New
optional `editorialDate?: EditorialDate` props added to SiteHeader, Hero,
Founder, MagazineDetail, SiteFooter — all fall back to `getEditorialDate()`
when the prop is omitted, so the legacy `astrolab/` scaffold dir and the
`/about` page (which renders `<Founder />` standalone) continue to compile.

| Component | What it now looks like |
|-----------|------------------------|
| `SiteHeader` | Three-zone masthead (Issue date · centered logo with italic rust "Psyche" · EN/ES + Book), DM Mono nav row underneath. Mobile collapses to compact masthead + hamburger. |
| `Hero` | Asymmetric grid: cover-story headline left (Fraunces 124px clamp), Loupe + Jung pull-quote + two CTAs right. Below: 4-cell feature strip (Pp. 04 Founder, Pp. 12 Five Sessions, Pp. 28 Travel Charted, Pp. 40 The Practice). |
| `JungRibbon` | Paper-deep section. Giant Fraunces italic open-quote in rust + 56px italic quote in rust-deep + DM Mono attribution. |
| `Founder` | Magazine spread: figure photo with FIG. 01 caption + grayscale filter on left; "A *psychotherapist's* astrology." h2, drop-cap body, 3-stat row, "Big Three" callout on right. Pp. 04 / FEATURE section marker. |
| `TarotDeck` | Horseshoe spread (lift map [40, 20, 0, 20, 40] applied desktop-only). One card flipped at a time (Star centered by default). Front: image + ochre index + italic name. Back: tier, name, price, duration, essence quote, booking CTA. Per-card "Past / Approach / Present / Path / Future" role label below. ServiceDetail panel renders below the spread when a card is active. |
| `MagazineDetail` | Pp. 28 / NEW · DIGITAL ISSUE marker. Two-column: text + I/II/III/IV feature list on left, ink-bg cover with ochre astrolabe SVG + multi-line "Soul *Guided* Travel Magazine" title on right. |
| `Testimonials` | Pp. 40 / LETTERS marker. 3-column grid (was horizontal scroll). Each card: oversized rust open-quote, Fraunces 22px quote, ink hairline, DM Mono name + Spectral italic detail. Existing bilingual DEMO fallback retained. |
| `LeadCaptureSection` | "The *new moon* letter." dark-ink section. Wraps the existing `<LeadCaptureForm>` in an `.ed-newsletter` div that overrides input/button styling — form logic untouched, still POSTs to `/api/leads`. |
| `BlogPreview` | Pp. 56 / RECENT ENTRIES marker. 3-column grid divided by hairlines (was dark-bg sunset card grid). Each post: pillar tag in rust DM Mono, Fraunces 28px title, Spectral excerpt, DM Mono date + reading time (formatted per locale). |
| `HomeCTA` | "Ready to read / *your map?*" Fraunces 120px clamp on paper-deep, Spectral subtitle, ink-bg `Book Your Session →` button. |
| `SiteFooter` | Single DM Mono line: `© {year} The Astro Psyche Lab · Barcelona · Made in Spanglish · Issue {n}`. Year + issue auto-derived. |

### Layout wiring

- `app/(public)/layout.tsx` — wraps content in `<div className="editorial-page min-h-screen">` so the editorial paper bg + Spectral default propagate to all public pages. Passes `editorialDate` to header and footer.
- `app/(public)/page.tsx` — passes `editorialDate` to `<Hero>`, `<Founder>`, and `<MagazineDetail>`. Supabase queries unchanged.

## Verification (run May 2026, branch `astrolab-V1`)

- ✅ `npm run build` — 30 routes compile, zero TS errors.
- ✅ Dev server smoke at viewport 1280×800: hero + Loupe + Jung quote + CTAs + feature strip render. Below the fold: founder spread, tarot horseshoe, magazine spread, letters grid, newsletter, blog masthead, CTA, footer all present (verified via accessibility snapshot since the preview tool's screenshot capture is flaky after scroll).
- ✅ EN ↔ ES toggle: header issue label flips ("Issue 14 · May 2026" ↔ "Número 14 · Mayo 2026"), nav swaps to "Sobre Mí / Sesiones / Revista de Viaje / Reseñas / Blog", hero h1 swaps to "Tu carta es un mapa.", `document.documentElement.lang` updates.
- ✅ Tarot interaction: default state has The Star (i=2) flipped. Clicking The Fool flips Fool, unflips Star, ServiceDetail re-renders to "The Fool / Cosmic Quick Hit". Clicking The Fool again unflips it and the ServiceDetail panel disappears.
- ✅ Loupe: auto-cycles. Stage indicators (3 dots) — active dot is 22px rust, inactive 6px tan. Clicking Stage 1 jumps to that stage and resets the cycle timer.
- ✅ Mobile breakpoint at 375×812: desktop masthead grid hidden, mobile masthead + hamburger visible. Hero h1 scales down to 56px (clamp). Layout stacks correctly.

## What was punted / known compromises

- **Hero Jung pull-quote duplication.** Per the prototype, the Jung
  quote appears both inline in the hero's right column and as the
  dedicated `<JungRibbon />` section that follows. Kept as the
  prototype shipped — they read differently (small flourish vs.
  full-bleed pull-quote spread) and removing one would diverge from
  Direction C. Easy to drop the inline hero version later if it reads
  as repetitive.
- **Per-card sunset theme classes.** `.tc-sun / .tc-star / .tc-empress
  / .tc-wheel / .tc-fool` rules in `globals.css` are unused on the
  homepage now. Left in place because they may still be referenced from
  `/services/[slug]` or other pages — confirm with a grep before
  removing in a follow-up.
- **DEMO testimonial copy.** Existing repo's bilingual DEMO array
  (María C., Laura S., Ana P.) was kept rather than swapping in the
  prototype's English-only Marina/Sofía/Helen mocks. The prototype's
  data was placeholder; the repo's is the production fallback when no
  DB testimonials are returned.
- **`<Reveal>` scroll-in animations dropped from homepage.** Editorial
  design is meant to feel laid-out, not animated in. The `Reveal`
  component file is untouched and still used elsewhere.
- **Stale `astrolab/` directory at repo root.** Pre-existing legacy copy
  of an earlier app version. Not removed (out of scope). New props were
  made optional with `getEditorialDate()` fallback so the legacy dir
  still compiles. Worth deleting in a follow-up.
- **Lighthouse comparison** not run because there's no captured V1
  baseline checked in. Build output (`First Load JS` 109 kB on `/`) is
  in the same ballpark as the prior implementation. No new
  dependencies added — fonts via `next/font/google`, all animation via
  CSS + RAF, no framer-motion.

## Intentional visual diffs from the prototype

- **Mobile.** Prototype was desktop-only (1280px artboard). Added
  responsive breakpoints throughout: hero stacks 1.4fr/1fr → 1fr,
  Founder/Magazine grids stack, tarot drops the lift map and goes 2-up
  rather than 5-across, magazine cover stacks above text, testimonials
  / blog go single-column. Type sizes scale via `clamp()`.
- **Asset filenames.** Prototype expected lowercase `.jpg` extensions
  and `Gabriela_real.jpg`. Repo uses uppercase `.JPG` / `.jpg` mix and
  `Website_profile.png`. Image src paths in components use the existing
  repo filenames; new images (`astrocartography.png`,
  `natal_chart.png`) added per spec.
- **Issue chrome auto-derives.** Prototype hard-coded "Issue 14 · May
  2026". Repo computes from `getEditorialDate()`, so it stays current
  without manual edits. Epoch is April 2025 = Issue 1.

## Outside-the-port follow-ups (not done here)

- Delete the stale `astrolab/` subdirectory if confirmed unused.
- Audit `.tc-*` per-card theme classes; remove if no live page references
  them.
- Replace the placeholder `dropcap` paragraph in the Founder ES locale
  if Gabs wants the Spanish version's first letter different from "P".
- Run a Lighthouse audit on production build vs. the previous deploy.
