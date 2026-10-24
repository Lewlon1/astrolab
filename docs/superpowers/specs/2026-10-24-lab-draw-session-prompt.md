# SESSION_PROMPT_lab_draw.md

Build "The Lab Draw" on the Astropsyche Lab website. It is a free-profile funnel at `/lab`:

1. The visitor draws one of three face-down tarot cards.
2. They enter their birth data.
3. They get an instant card-and-chart reading.
4. An email gate asks for their email and birth time.
5. After signing in by magic link, they see a saved profile with their full natal chart and a transit tracker.

The approved prototype is `docs/prototypes/the-lab-draw.html`. Copy it into the repo before starting. Match its flow, copy structure and visual treatment.

---

## Hard rules (read first, never break)

1. **Never write migrations to Supabase production.**
   - Do not run `supabase db push`, `apply_migration`, `execute_sql` or any equivalent against the production project.
   - All schema changes go in one raw SQL file, `supabase/sql/lab_profiles.sql`, inside a fenced block. Lewis runs it by hand in the Supabase dashboard.
   - Write the code against that schema. Stop and tell Lewis when the SQL needs running before you can test.
2. **Do not touch the existing service tarot cards** on the homepage or their booking links. They are the paid booking path. The Lab Draw uses its own component and its own deck.
3. **No GPL or AGPL dependencies.** Do not use Swiss Ephemeris or wrappers around it (`swisseph`, `pyswisseph`, `kerykeion`). Charts are computed in TypeScript with permissively licensed libraries. Verify each new dependency's licence in Step 0 and list it in the notes.
4. **All interpretive copy is draft.**
   - Put it in `content/lab/*`, never inline in components.
   - Mark each file with `// DRAFT — Gabs to rewrite in her voice`.
   - Spanish strings are out of scope for v1.
5. **Commit in small steps**, one per phase, with a clear message. Do not push to `main` without Lewis's go-ahead.
6. **Finish by appending lessons learned** to `SESSION_NOTES_astro_psyche_lab.md` (see Phase 8). Never recreate that file. Only append to it.

---

## Step 0 — Discovery pass (report back before editing anything)

The website lives in a separate repo from the Lambda (`Lewlon1/Astro-psychelab` contains only the FastAPI `/health` skeleton). Every path below is **expected / unconfirmed** until you have mapped the actual repo.

Find and report:

- **App structure**
  - Next.js version and router. App Router is expected.
  - Root layout and font loading. Note which brand fonts are already loaded. Fraunces, Cormorant Garamond, Syne and DM Mono are expected.
  - Tailwind or CSS modules, and where the palette tokens live.
- **Supabase client setup**
  - Server and browser clients. Expected at `lib/supabase/server.ts` and `lib/supabase/client.ts`.
  - Whether Supabase Auth is already in use.
  - Whether an auth callback route exists. Expected at `app/auth/callback/route.ts`.
- **`lead_events`**
  - Its actual columns.
  - The existing helper that writes to it. Expected at `lib/events.ts` or similar.
- **Existing integrations**
  - The MailerLite integration (expected `lib/mailerlite.ts`) and how it adds subscribers to a group.
  - The Meta Pixel component, and whether a cookie-consent gate exists yet.
- **Homepage**
  - The homepage file. Expected at `app/page.tsx`.
  - The service tarot card component, so you know what not to touch.
- **Environment**
  - Env var names already in use.
  - Which new ones this build needs: MailerLite group ID for Lab leads, Nominatim user agent, site URL.
- **Tests**
  - Existing test setup (Vitest or Jest). If there is none, propose Vitest and wait for a yes.

Output a short table: expected path → actual path → exists / needs creating. **Then stop and wait for Lewis to confirm** before Phase 1.

---

## Decisions already made

| Topic | Decision |
|---|---|
| Placement | Dedicated `/lab` page. Add a small homepage teaser linking to it. Do not embed the draw on the homepage. |
| Scope | Full build: draw, instant reading, gate, magic-link profile with full natal chart, rising sign when time is known, and transit tracker. |
| Ephemeris | TypeScript. Use `astronomy-engine` for planetary positions; verify it is MIT-licensed in Step 0. Compute the ascendant and houses from sidereal time and obliquity (Placidus default, Whole Sign fallback above ±66° latitude). Use the mean lunar node. No paid API. |
| Reading generation | Deterministic composition from the content library, exactly as in the prototype. No LLM in v1. |
| Birth time unknown | No rising sign and no houses. Show every position whose sign is ambiguous across the day as "X or Y". Never guess. |
| Geocoding | Server-side only. Use OpenStreetMap Nominatim, one search on submit, not autocomplete, which Nominatim's policy forbids. Send a proper User-Agent, cache results in `lab_geocode_cache`, and show OSM attribution in the UI. |
| Time zone | Convert coordinates to an IANA zone with a coordinate-to-timezone library such as `tz-lookup` or `geo-tz`; check its licence and bundle size. Convert to UTC with Luxon using the zone's historical rules for the birth date. Flag pre-1970 births as "time zone may be approximate". |
| Auth | Supabase Auth magic link. The gate submission creates the profile and sends the link. |
| Email list | On gate submit, add the subscriber to a new MailerLite group, "Lab Profiles", with custom fields `lab_card`, `sun_sign`, `moon_sign`. Add `next_transit` and `transit_peak_date` in Phase 6. |
| Booking CTA | Link to Cal.com `theastropsychelab`. Cosmic Check-In is not wired yet, so do not link to it. |
| Payments / membership | Out of scope. No Stripe work in this session. |

---

## Phase 1 — Astro engine (`lib/astro/`, expected)

**Files:**
- `lib/astro/positions.ts`: ecliptic longitudes for the Sun, Moon, Mercury through Pluto and the mean node, at a UTC instant.
- `lib/astro/houses.ts`: ascendant, MC and house cusps.
- `lib/astro/signs.ts`: longitude to sign and degree; ambiguity detection over a time window.
- `lib/astro/aspects.ts`: conjunction, sextile, square, trine and opposition, with configurable orbs.
- `lib/astro/transits.ts`: exact-hit dates of outer-planet transits to natal points over a date range (Phase 6 uses this).
- `lib/astro/time.ts`: local birth time plus IANA zone to a UTC instant.
- `lib/astro/__tests__/*`

**Tests (must pass before moving on):**
- **Sun and Moon at the 2024-04-08 total eclipse, 18:21 UTC.** Both are about 19.2° Aries and within 0.1° of each other.
- **Sun and Moon at the 2000-01-06 new moon, 18:14 UTC.** Both are about 285.8°.
- **Gabs's own chart, as a fixture.**
  - Lewis supplies her birth data in `lib/astro/__tests__/fixtures.local.json`. That file is gitignored, so never commit it.
  - Expected result: Pisces Sun, Sagittarius Moon, Taurus Rising.
  - The test is skipped when the fixture is absent.
- **Ambiguity.** A date when the Moon changes sign during the day returns two signs when no birth time is given.
- **High latitude.** A latitude above 66° falls back to Whole Sign houses without throwing.

---

## Phase 2 — Content library (`content/lab/`, expected)

Port the prototype's content and extend it:

- `cards.ts`: the 22 major arcana with numeral, name, Golden Dawn attribution, element, theme key and "now" line. Copy these from the prototype.
- `signs.ts`: 12 signs with element, Sun "baseline" line and Moon "settle" line. Copy these from the prototype.
- `themes.ts`: the 8 themes, each with three layers (astrology says / psychology studies / test it this month). Copy these from the prototype.
- `placements.ts`: **new.** One short draft paragraph for each sign for six placements: Sun, Moon, Rising, Venus, Saturn and North Node. That is 72 entries, each in the same three-layer format. Other planets show their sign and degree with a one-line keyword only.
- `transits.ts`: **new.** Templates keyed by transiting planet (Jupiter, Saturn, Uranus, Neptune, Pluto) × aspect (conjunction, square, opposition, trine) × natal point (Sun, Moon, Rising, Venus, Saturn). Write it as a template plus planet and point phrases. Do not write every combination out by hand.

Every file gets the DRAFT header. Keep the "chart is a prompt, not a cause" stance throughout. No causal language such as "Saturn will make you…".

---

## Phase 3 — The `/lab` page UI

**Files (expected):**
- `app/lab/page.tsx`: server component with metadata, title "The Lab · Astropsyche Lab" and an OG image placeholder.
- `components/lab/LabDraw.tsx`: client component that runs the step state machine.
- `components/lab/TarotDeck.tsx`
- `components/lab/BirthForm.tsx`
- `components/lab/Reading.tsx`
- `components/lab/LabNote.tsx`
- `components/lab/Gate.tsx`

**Requirements:**
- Follow the prototype's flow and states one to one.
- Use the brand's existing site tokens and fonts from Step 0. Use the prototype's card treatment: deep forest back, golden sun border, original SVG sun and star motifs.
- Show the instant reading without any network call except the geocode/compute request. The reading appears before the email gate.
- The birth time field says "only if you know it".
- Show a cusp note when the Sun is ambiguous. Show the "X or Y" Moon wording when the Moon is ambiguous.
- Mobile first: three cards in a row at 375px wide, no horizontal scroll.
- Accessibility:
  - Cards are buttons with labels and a visible focus state.
  - Respect `prefers-reduced-motion`.
  - Form errors say what to fix.
- Add a homepage teaser to the homepage file (expected `app/page.tsx`): one line plus a link to `/lab`. Place it below the service cards, not inside them.
- Accept a `?src=` query param (`manychat`, `bio`, `ad`, `lora`) and record it in events.

---

## Phase 4 — Data, API routes, events

**Schema:** write `supabase/sql/lab_profiles.sql` as raw SQL only. Lewis runs it manually.

| Table | Columns |
|---|---|
| `lab_profiles` | id, user_id (nullable until magic link confirmed), email, card_drawn, birth_date, birth_time (nullable), birth_place_text, lat, lon, tz, birth_utc, positions jsonb, src, consent_at, consent_text_version, created_at, deleted_at |
| `lab_geocode_cache` | query, lat, lon, display_name, tz, created_at |

RLS rules:
- A user can select and update only their own profile.
- Inserts go only through the service role, in the API route.
- No public reads.

**API routes (expected paths):**
- `app/api/lab/compute/route.ts` (POST): takes date, place and optional time.
  1. Geocode, using the cache first.
  2. Resolve the time zone and compute positions.
  3. Return the reading payload.
  4. Rate-limit by IP, keeping Nominatim's 1 request per second in mind.
- `app/api/lab/gate/route.ts` (POST): takes email, birth time, consent and the reading payload.
  1. Validate the input.
  2. Upsert `lab_profiles`.
  3. Send the Supabase magic link.
  4. Add the subscriber to the MailerLite "Lab Profiles" group.
  5. Write the event.
- `app/api/lab/delete/route.ts` (POST, authenticated): soft-delete the profile. Then delete the MailerLite subscriber or move them to an unsubscribed state; choose whichever the existing integration supports.

**Events:** write through the existing `lead_events` helper found in Step 0. Use these event names:
- `lab_card_drawn`
- `lab_birth_submitted`
- `lab_result_viewed`
- `lab_email_submitted`
- `lab_profile_opened`
- `lab_booking_clicked`

Each event carries `src`, the card name, and `has_time`. If `lead_events` cannot hold this payload, stop and propose a column change as SQL. Do not alter the table yourself.

**Meta Pixel:** fire `Lead` on email submit only if cookie consent exists. The consent banner is still outstanding, so if no consent gate exists, do not fire the Pixel at all, and say so in the notes.

---

## Phase 5 — Profile page

- `app/lab/profile/page.tsx` (expected): authenticated server component. Redirect to `/lab` if there is no session or no profile.
- If Step 0 found no auth callback, create `app/auth/callback/route.ts`, then link the profile to `user_id` on first login.

**Page sections:**
1. **Header:** the drawn card, plus Sun, Moon and Rising. Rising shows only if a birth time exists; otherwise show an "Add your birth time" inline form that recomputes.
2. **Core placements:** Sun, Moon, Rising, Venus, Saturn and North Node, each as a LabNote with three layers.
3. **All positions:** a compact table with planet, sign, degree and house (house only with a birth time).
4. **Transit tracker:** see Phase 6.
5. **Booking CTA:** a soft prompt linking to Cal.com.
6. **Footer actions:** "Delete my profile" with an in-page confirmation step (no `confirm()` dialogs), and the privacy notice link.

---

## Phase 6 — Transit tracker

- **Calculation:**
  - Find exact hits of Jupiter through Pluto to natal Sun, Moon, Rising, Venus and Saturn over the next 12 months, using a 1° orb.
  - Handle retrogrades: one transit can hit the same point three times. Group those passes into one "season" with every exact date listed.
  - Use conjunction, square, opposition and trine.
- **Display:**
  - Show the next significant transit prominently, with its peak date and copy from `content/lab/transits.ts`.
  - List the following four transits below it.
- **Refresh:** add a monthly Vercel cron at `app/api/cron/lab-transits/route.ts` (expected), secured with a `CRON_SECRET` header. It recomputes `next_transit` and `transit_peak_date` for each active profile and syncs both fields to MailerLite, so a MailerLite automation can send the monthly Lab note. Building that email itself is out of scope.

---

## Phase 7 — Privacy and QA

**Privacy:**
- Add a consent checkbox with versioned text. Store `consent_at` and `consent_text_version`.
- Add a privacy notice section covering what is stored, why, and how to delete. Draft it, and flag in the notes that Gabs or a lawyer should review it.
- Store no free-text reflections or journaling.
- Log no birth data to the console or to Vercel logs.

**QA checklist (report each item pass or fail):**
- Full flow on mobile Safari and desktop Chrome: draw → compute → reading → gate → magic link → profile.
- Unknown birth time: no rising and no houses anywhere, and ambiguity wording shown.
- An unknown place returns a clear error ("We couldn't find that place. Try city and country."), not a crash.
- Delete removes the profile from view and from MailerLite.
- `?src=manychat` appears in `lead_events`.
- The homepage service cards are unchanged; confirm this with the git diff.
- Lighthouse on `/lab`: report Performance and Accessibility scores.

---

## Phase 8 — Session notes

Append a dated entry to `SESSION_NOTES_astro_psyche_lab.md`, creating the file only if it doesn't exist. Include:

- Files created and changed, with real paths.
- Dependencies added, with their licences.
- The SQL Lewis still needs to run, and whether he has run it.
- New env vars, and where they are set.
- Lessons learned: what broke, what took longer than expected, and anything the next session should know.
- Open items:
  - Gabs's voice pass on `content/lab/*`.
  - Legal review of the privacy text.
  - Cookie banner status.
  - The monthly Lab note email in MailerLite.
  - The Spanish version for Eteria Circle.

---

## Out of scope for this session

- Stripe subscriptions and membership gating.
- The Spanish locale.
- LLM-generated readings.
- Synastry and Star-Crossed.
- Any change to the existing booking flow or service cards.
