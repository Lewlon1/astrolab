# Notes capture — design

**Date:** 2026-11-18 · **Branch:** `claude/admin-note-capture-c57de8` · **Status:** draft for approval

## Why

Gabs writes things down on paper — all sorts: client thoughts, content ideas, to-dos,
money, plans. Paper is how she thinks, and that should not change. The problem is that
nothing written down is tracked, findable or acted on, and she needs help being more
organised. The business also needs a structured record of what she is thinking and
committing to, because the longer-term plan is an agentic team (probably a Grok bot)
that will read and act on this material.

So this feature turns a photo of a paper page into organised, searchable, digital
notes and a to-do list, inside the existing admin portal, with as little effort from
Gabs as possible.

## Goals

1. Capturing a page takes one action on her phone: open Notes, take photo(s), done.
2. The system does the organising: it types up the handwriting, splits a mixed page
   into separate notes, files each into a fixed area, and pulls out tasks.
3. She can check and correct quickly: new notes arrive in an inbox; confirming or
   moving a note is one tap; the typed text is editable.
4. Open to-dos are visible where she already looks every day (the Today screen).
5. The data is structured well enough that a future agent can query it without
   re-reading photos ("money notes this month", "overdue to-dos", "notes about X").

## Non-goals (this release)

- The Grok bot / agent team itself, or any external API for it.
- Linking notes to lead, booking or client records (free-text client name only).
- Calendar sync, reminders/notifications, recurring tasks.
- Typing notes straight in without a photo (may come later; the schema allows it).
- Offline capture.
- Sharing notes with anyone other than admins.

## Anti-goals (would make this a failure even if it works)

- Capturing becomes slower or fussier than taking a photo — she will stop using it.
- A page is ever lost: if transcription fails, the photo must still be stored and the
  capture retryable.
- Private client material becomes reachable by anyone other than an admin.
- Inbox becomes a second pile of unsorted paper — sorting must be right often enough
  that review is a glance, not a chore.

## Constraints (from the codebase)

- Next.js app router + Supabase. Admin API routes guard with `requireAdminApi()`
  (`lib/auth/admin.ts`); RLS uses `public.is_admin()` from migration 015.
- Migrations are run **manually** in the Supabase SQL editor, never from an agent
  session. Storage policies go in a separate `b` file (pattern: `015b`), because
  storage policy changes can fail on ownership and roll back the main script.
- Claude is called through AWS Bedrock (`lib/bedrock.ts`, `eu.` model IDs, Converse
  API). Converse accepts image blocks, so handwriting reading uses the same path.
- Vercel request bodies are capped at ~4.5 MB; phone photos are often larger.
- Admin is used heavily on a phone: mobile bottom tab bar (`AdminTabBar`) driven by
  `components/admin/navConfig.ts`.
- Merge order: this goes into `main` **before** the `/apply` landing page (PR 21).
  PR 21 touches `middleware.ts`, `app/layout.tsx` and `SESSION_NOTES_astro_psyche_lab.md`
  and no admin files; this feature must not touch those three files.

## Approaches considered

| | Approach | Trade-off |
|---|---|---|
| **A (chosen)** | Photo → Claude transcribes, splits into notes, auto-files into fixed areas, extracts to-dos; inbox to confirm | Most to build; sorting will sometimes be wrong (the inbox catches it). Only option that actually does the organising, and gives an agent clean structure. |
| B | Photo → transcription only; Gabs tags manually | Quicker to build, but leaves the organising to her — the thing she needs help with. |
| C | Push to Notion / Google Drive | Familiar tool, but data lives outside the business database, a future agent needs a second integration, and less control over client privacy. |

Chosen by Lewis: **A**.

## Design

### Areas (fixed list)

`clients`, `content`, `todo`, `money`, `business`, `personal`, plus `unsorted` for
anything the model cannot place. A fixed list (not free tags) keeps filtering simple and
makes the data predictable for an agent. A note has exactly one area; tasks are a
separate thing (a client note can still produce a task).

*Builder's call within reason:* display labels (e.g. "Content ideas").

### Data model — migration `019_notes.sql` (+ `019b_notes_storage.sql`)

- **`note_captures`** — one row per capture (a photo session, possibly several pages).
  `id`, `photo_paths text[]`, `status` (`processing` | `done` | `failed`), `error`,
  `raw_transcript text` (full verbatim transcript from the model), `model text`,
  `created_at`, `processed_at`.
- **`notes`** — one row per distinct note found on the page(s).
  `id`, `capture_id` (nullable FK, so typed-in notes are possible later), `area`
  (check constraint on the list above), `title`, `body` (cleaned transcription,
  editable), `client_name text null`, `written_on date null` (if a date is written on
  the page), `status` (`inbox` | `filed` | `archived`), `ai_area` (what the model
  chose, kept so we can measure how often she corrects it), `created_at`, `updated_at`.
  Full-text search index on `title || body`.
- **`note_tasks`** — `id`, `note_id` FK (cascade), `text`, `due_on date null`,
  `done_at timestamptz null`, `created_at`.
- RLS on all three: admins only (`public.is_admin()`), same style as 015/018.
- **Storage:** new **private** bucket `note-photos` (not the public `service-images`
  bucket). Admin-only insert/select/delete policies in `019b`. Photos are shown via
  short-lived signed URLs.

### Capture flow

1. On `/admin/notes`, a prominent **Snap a page** button opens the phone camera
   (`<input type="file" accept="image/*" capture="environment" multiple>`); she can add
   several pages before sending.
2. The browser shrinks each photo (long edge ~2000 px, JPEG) — enough for handwriting,
   small enough to move quickly.
3. The browser uploads photos straight to the `note-photos` bucket with the admin's
   Supabase session (avoids the Vercel body limit), then calls
   `POST /api/admin/notes/captures` with the storage paths.
4. The route creates the `note_captures` row (`processing`), fetches the images,
   and calls Claude (Sonnet, via Bedrock Converse with image blocks) once for the whole
   capture. The model returns JSON: verbatim transcript, plus a list of notes, each
   with area, title, body, optional client name, optional written date, and tasks
   (text + optional due date). Output is validated; anything invalid falls back to a
   single `unsorted` note containing the transcript rather than failing.
5. Notes are inserted with `status = inbox`; the capture is marked `done`. On any
   error the capture is marked `failed` with the photos kept, and the UI offers
   **Try again** (re-runs step 4 on the stored photos).
6. The UI shows a "reading your page…" state, then the new notes.

The system prompt tells the model about the business (astrology + psychology
practice) so it can recognise jargon, to never invent content it cannot read (mark
illegible bits as `[?]`), and how to decide areas. Relative dates ("Friday") resolve
against the capture date.

### Screens

**`/admin/notes`** — the main page:
- *Snap a page* button at the top.
- *Inbox* section (if any): new notes as cards — area chip (tap to change), title,
  first lines, tasks found. One tap **Looks right** files it; changing the area also
  files it.
- *All notes*: area filter chips + search box; newest first.
- Captures that failed or are processing appear at the top with their state.

**`/admin/notes/[id]`** — a note: original photo (tap to zoom) beside/above the typed
text; edit title/body/area/client name; its tasks (tick, edit, delete, add); archive.

**To-dos** — a tab on the notes page listing open tasks across all notes, overdue and
due-soon first, each linking back to its note; tick to complete.

**Today (`/admin`)** — a small "From your notes" section: overdue and due-today
tasks, plus a count of notes waiting in the inbox, linking to Notes.

**Navigation** — Notes becomes its own top-level item (desktop top bar and a sixth
mobile tab), because it is the capture entry point and must be one tap away. Adding it
to an existing group would make it two taps, or turn Today into a menu.

### Agent readiness

No API in this release. The structure is the preparation: fixed areas, tasks as rows
with due dates, timestamps, `ai_area` vs `area` for correction rate, verbatim
transcripts kept. A later agent can read these tables directly or through a small
API added then.

## Decided by Lewis

- Approach A (auto-sort + to-dos, inbox review).
- Notes cover "all sorts"; the system should do the organising.
- Ship to `main` before the `/apply` landing page.
- **Notes are a shared business record:** every admin sees every note (including
  `personal` and `money`). No owner column; RLS is `public.is_admin()` only.

## My calls (correct me)

- The six areas + `unsorted` listed above.
- Private bucket and signed URLs, because client notes are sensitive.
- Notes as its own nav tab rather than inside an existing group.
- To-dos surfaced on Today in their own small section, kept separate from the daily
  action engine (`action_items`), whose items are generated per day and expire.
- One Claude call per capture, using the existing Sonnet model ID in `lib/bedrock.ts`.
- **Language:** notes stay in the language she wrote them in (never translated);
  "cleaned" means tidied layout and spelling only. Full-text search uses the `simple`
  dictionary so English, Spanish or a mix all search correctly.
- **Tasks show immediately:** tasks from notes still in the inbox appear on To-dos and
  Today straight away (with an "unchecked" marker), so a page she hasn't reviewed never
  hides a to-do. The inbox card lets her fix or delete a task before filing.
- **Time limits:** at most 6 photos per capture; the capture route sets
  `maxDuration = 300` (as the existing cron route does). A capture still `processing`
  after 5 minutes is shown, and treated, as `failed`, so **Try again** always appears.

## Left to the builder

- Exact component structure, styling (follow existing admin look), image-shrinking
  method, signed URL lifetime, JSON validation approach, test layout (vitest, as
  elsewhere), the wording of the model prompt within the rules above.
