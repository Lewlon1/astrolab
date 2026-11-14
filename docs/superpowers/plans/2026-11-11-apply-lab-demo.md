# Plan: the Lab Draw as an interactive "how the Lab works" section on /apply (variant A)

Status: built 2026-11-11 (see SESSION_NOTES, "Lab demo in variant A").

## Decisions (Lewis, 2026-11-11)

- **Where:** variant A only, mid-page. The demo replaces A's static "How it works" block. B stays as built (draw first, then the offer).
- **Email:** asked after step 3 (Read). Email unlocks step 4 (Test) and the rest of the page's personal touches.
- **Friction:** card + birth date + place (time optional), like the Lab today.
- **Base:** build on the Lab report-card reading, so it has to reach `main` first and then be merged into `feat/apply-lp`.

## What it is

Variant A's sales page keeps its order, but the "How it works" section becomes a walk-through of the Lab method that the visitor does with their own card and chart:

| Step | Visitor does | Method note ("In the Lab…") | Programme note ("In the programme…") |
|---|---|---|---|
| 1 Draw | picks one of six cards | Choosing an image without thinking shows what's on your mind. | Each month opens with a draw. |
| 2 Map | birth date + place (time optional) | The chart is the map. Here: Sun and Moon. | Your whole chart, plus the year's transits. |
| 3 Read | sees the Lab report: card line, Card/Sun/Moon rows, astrological lens and psychological lens | Every reading keeps astrology and psychology side by side, labelled. | A full reading each month with Gabs. |
| — | **email + consent** to see step 4 | | |
| 4 Test | gets the "Put it into practice" prompt | Each reading ends in a small experiment for the week. | Gabs reviews your experiments with you each month. |

Then a bridge line ties it to the offer, followed by the inclusions, proof, FAQ and the application. If the email was already given in the demo, application step 1 is skipped (the same mechanism B uses).

## Page order, variant A after the change

1. Hero (concept-matched, price, "Apply for a place"), plus a second, quieter link: "Or try the method first ↓"
2. Video slot
3. Who it's for / not for
4. **Lab demo (new)**: Draw → Map → Read → [email] → Test
5. What you get (inclusions + price)
6. Proof
7. About Gabs
8. FAQ
9. Application (step 1 skipped if the email came from the demo)

## Build outline

1. **Prerequisite:** get the report-card work onto `main` (see Q1), then merge `main` into `feat/apply-lp`.
2. `content/apply/demo.ts` (DRAFT): step titles, method notes, programme notes, gate copy and the bridge line.
3. `components/apply/LabDemo.tsx`: a progress rail ("Draw · Map · Read · Test", `aria-current` on the active step) and four stages. It reuses `LabDeck`, `BirthForm`, `/api/lab/compute`, and the report-card `Reading` / `LabNote` / `PracticeCallout`. Before the gate, step 4 is hidden by rendering `Reading` without its practice test and `PracticeCallout` after the gate. That may need one optional prop on `Reading` (see Q3).
4. `EmailCapture` is reused for the gate, with `placement: "demo"`. `VariantA` lifts the `captured` state so `ApplicationForm` skips step 1.
5. Events: `lp_demo_step` with `{ step: 1–4 }`, plus the existing `lp_draw_started`, `lp_reading_viewed` and `lp_email_captured` (`placement: "demo"`). The readout gets a demo drop-off cut for A.
6. Mobile: each method note is one line, with "more" opening the programme note. Notes can't push the cards below the first view of the step.
7. Tests: content banned-word check covers `demo.ts`, the gate unlocks step 4, step 1 is skipped after the demo email, and the events fire once each.
8. QA in the browser at 375 px and on desktop, with placeholder env and stubbed writes, as before.

## Effect on the split test (read this before approving)

Both variants now contain the draw, so the test no longer asks "Lab draw vs no Lab draw". It asks:

- **A:** sales page first, with the draw as an optional mid-page demo (email after the reading).
- **B:** draw first, then the offer (email after the reading).

So the question becomes "does leading with the experience beat leading with the offer?" The primary metric (email rate per visitor) and the decision rule still work. Write the new question into the session notes before launch, so the readout is judged against it.

## Answers (Lewis, 2026-11-11)

- **Report card → main:** the 7 uncommitted edits on `claude/determined-galileo-hix9nz` belong to the report card. Commit them there, open their own PR, and Lewis reviews and merges it. Then merge `main` into `feat/apply-lp`.
- **Demo is optional.** The hero's "Apply for a place" still goes straight to the application. The demo is a mid-page section with an "Or try the method first" link.
- **Lab code:** one optional, additive prop on `components/lab/Reading.tsx` to hold back the practice callout is fine. With the default, `/lab` renders exactly as before.
- **Variant B** picks up the report-card reading automatically after the merge (same component), with the practice callout shown as on `/lab`.

## Order of work

1. Review the 7 edits, run the Lab tests on that branch, commit, push, and open the report-card PR. **Stop for Lewis to merge.**
2. Merge `main` into `feat/apply-lp` (a merge, not a rebase, so PR #21 needs no force-push), then re-run everything.
3. Build steps 2–8 of the outline above, committing once per step group.
4. Session notes: the new test question (experience first vs offer first) and the decision rule.
