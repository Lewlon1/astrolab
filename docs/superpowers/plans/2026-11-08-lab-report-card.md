# Lab report card + flow trims — plan for approval (2026-11-08)

Status: **awaiting Lewis's approval**. Items A–D are agreed; E and F need a decision.
No SQL, no migrations. Copy marked "draft" goes to Gabs for her voice pass.

## A. Instant reading as a Lab report card (agreed)

New order, top to bottom:

1. Title (unchanged): "{card} meets your {sun} Sun", with the card image beside it.
2. **Headline comment from Gabs**: the card's existing `now` line, set as a quote and signed "— Gabs".
3. **Lab report table** (one bordered card, "LAB REPORT · {card}" header, DM Mono labels):
   Card · Sun · Moon (replacing the three chips), then the astrological lens and the psychological lens.
4. **Remaining text**: the tradition paragraph, the Moon paragraph, then the cusp and time-zone notes if they apply.
5. **Put it into practice**: pulled out of the table into its own standout block (gold border, large italic, filled background).
6. Thumbs vote and place confirm (unchanged).

The profile's "Layer three · The test" uses the same table + standout block (lenses only: its Sun/Moon/Rising are already shown above).

Files:
- `components/lab/LabNote.tsx`: optional `specimen` rows; `test` moves out into a new `PracticeCallout`
- `components/lab/PracticeCallout.tsx` (new)
- `components/lab/Reading.tsx`: new order; chips are rendered as table rows
- `app/(public)/lab/profile/ProfileContent.tsx`: test section uses the same table + callout
- `content/lab/ui.ts`: `REPORT` labels ("Lab report", "— Gabs") (draft)
- `lib/lab/reading.ts` unchanged (`composeReading` already returns every part)

## B. Remove the draw intro (agreed)

Delete the paragraph "Six of the 22 major arcana… what's on your mind." The phone spread hints stay.
Files: `content/lab/ui.ts` (`DRAW.intro`), `components/lab/LabDraw.tsx`.

## C. Slim the gate (agreed, item 5)

Drop the "Step 04 · Keep going" eyebrow. The three tiles become one line ("Free: your card read against your chart, your rising sign and your next two seasons"). Email, birth time and consent stay; consent waits on the legal review.
Files: `components/lab/Gate.tsx`, `content/lab/ui.ts` (`GATE`).

## D. Positive tone: astrology through a psychotherapist's lens (agreed)

Replace all four defensive lines with positive fusion wording (drafts for Gabs):

| Where | Now | Draft |
|---|---|---|
| `STANCE` (/lab footer, profile foot), `content/lab/ui.ts` | "astrology has no proven power to predict events…" | "The Lab reads your chart the way a psychotherapist reads a pattern: astrology names it, psychology helps you work with it." |
| `STANCE_LINE` (under every reading), `content/lab/reading.ts` | "the chart is a prompt, not a cause" | "astrology, read through a therapist's eyes" |
| `PROFILE_FLOW.chartLine`, `content/lab/ui.ts` | "…a map of patterns, not a forecast…" | "Your chart is a map of your patterns. Here we read it through your card." |
| `PROFILE_FLOW.upcomingLine`, `content/lab/ui.ts` | "…a prompt to notice, not a forecast…" | "Each transit opens a season for a theme in your chart. These are your next two." |

`content/lab/reading.ts` is marked GABS VOICE, so `STANCE_LINE` changes only with her OK.
Code comments that say "prompt, not a cause" are internal and stay.

## E. Decision needed: where the stance line appears (item 6)

Today the stance shows in three places: the /lab footer, under every reading, and at the foot of the profile.
- E1: once, in the /lab footer only
- E2: footer + profile foot (the reading drops it)
- E3: keep all three, since it's now positive brand copy rather than a disclaimer

## F. Decision needed: the profile's booking buttons and order (item 7)

Today the profile has up to five booking buttons: one after the chart, one after the seasons, and three in the offer ladder.
The order is card → chart → test → seasons → offers, so "Your next two seasons" (the hook for P3 Crossroads Planners) sits fourth.
- F1: keep only the ladder (three buttons, at the end); move seasons above the test
- F2: one button after the chart + the ladder; move seasons above the test
- F3: change nothing on the profile for now

## Verify

`npm run build`, `npx vitest run`, and a Playwright pass at 390×844 and 1280×800 over draw → reading → gate → profile preview (`/lab/preview`).
