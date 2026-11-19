# Notes Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gabs photographs paper notes in the admin; Claude transcribes, splits, files them into fixed areas and extracts to-dos; she reviews in an inbox; open to-dos show on Today.

**Architecture:** Browser shrinks photos and uploads them to a private Supabase bucket with the admin session, then calls an admin API route that runs one Bedrock (Claude Sonnet, Converse with image blocks) call per capture and writes `notes` + `note_tasks`. All parsing, sorting and status logic lives in pure `lib/notes/*` modules with vitest tests; pages are thin.

**Tech Stack:** Next.js app router, Supabase (Postgres + RLS + Storage), AWS Bedrock Converse (`@aws-sdk/client-bedrock-runtime`), Tailwind, vitest.

**Spec:** `docs/superpowers/specs/2026-11-18-notes-capture-design.md`

## Global Constraints

- Do NOT modify `middleware.ts`, `app/layout.tsx`, `SESSION_NOTES_astro_psyche_lab.md` (PR 21 owns them; this merges first).
- Migrations are written, never applied from a session: `supabase/migrations/019_notes.sql`, `019b_notes_storage.sql`, header comments in the style of 018 ("Run this MANUALLY…").
- RLS on every new table: admins only via `public.is_admin()`; no owner column (shared business record).
- Bucket `note-photos`, **private**; photos shown only via signed URLs.
- Areas, exactly: `clients`, `content`, `todo`, `money`, `business`, `personal`, `unsorted`. Labels: Clients, Content ideas, To-dos, Money, Business, Personal, Unsorted.
- Max 6 photos per capture. Capture route `maxDuration = 300`. `processing` older than 5 minutes counts as `failed`.
- Notes keep the language written; never translate. Full-text search config `simple`.
- Illegible text is written as `[?]`; the model must not invent content.
- "Today" dates use `todayInMadrid()` from `lib/dailyActions.ts`.
- Model: `MODELS.SONNET` from `lib/bedrock.ts`.
- Tooling: the repo is iCloud-synced; run `npm ci`, tests and builds in a scratchpad `git worktree` of this branch if commands hang.

## Review Focus

1. Model returns non-JSON, a JSON fence, or JSON with unknown areas / missing fields → capture still yields notes (unknown area → `unsorted`; total failure → one `unsorted` note holding the raw text), never a lost page. Tests in Task 2.
2. Function times out mid-call → row stays `processing`; after 5 min UI shows Failed + Try again, and retry works on stored photos. Tests in Task 3 (`effectiveStatus`) and Task 4 (retry route reuses `photo_paths`).
3. Phone photo is HEIC or >10 MB → shrink step outputs JPEG ≤ ~2000px long edge; non-images rejected client-side. Test in Task 5 (`targetSize`).
4. Model gives relative/odd dates ("Friday", "31/2") → only valid ISO `YYYY-MM-DD` kept, else `null`. Tests in Task 2.
5. A task's note is deleted or archived → task disappears from To-dos/Today (cascade on delete; archived notes' tasks excluded). Test in Task 3 (`openTodos`).

---

### Task 1: Database migration and shared types

**Files:**
- Create: `supabase/migrations/019_notes.sql`, `supabase/migrations/019b_notes_storage.sql`, `types/notes.ts`

**Interfaces:**
- Produces (`types/notes.ts`):
  - `NOTE_AREAS = ["clients","content","todo","money","business","personal","unsorted"] as const`; `type NoteArea = typeof NOTE_AREAS[number]`; `AREA_LABELS: Record<NoteArea,string>`
  - `type CaptureStatus = "processing" | "done" | "failed"`; `type NoteStatus = "inbox" | "filed" | "archived"`
  - `interface NoteCapture { id; photo_paths: string[]; status: CaptureStatus; error: string|null; raw_transcript: string|null; model: string|null; created_at: string; processed_at: string|null }`
  - `interface Note { id; capture_id: string|null; area: NoteArea; ai_area: NoteArea|null; title: string; body: string; client_name: string|null; written_on: string|null; status: NoteStatus; created_at; updated_at }`
  - `interface NoteTask { id; note_id: string; text: string; due_on: string|null; done_at: string|null; created_at: string }`

- [ ] **Step 1:** Write `019_notes.sql`: three tables per spec "Data model" (check constraints on `area`, `ai_area`, both status columns; `note_tasks.note_id` FK `ON DELETE CASCADE`; `notes.capture_id` FK `ON DELETE SET NULL`); `updated_at` trigger on `notes` (reuse existing trigger function if 0xx migrations define one, else define `notes_set_updated_at`); generated column `search tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title,'')||' '||coalesce(body,''))) STORED` with a GIN index; indexes on `notes(status, created_at desc)`, `notes(area)`, `note_tasks(done_at, due_on)`; RLS enabled with one `FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())` policy per table; `IF NOT EXISTS` / `DROP POLICY IF EXISTS` so it's re-runnable.
- [ ] **Step 2:** Write `019b_notes_storage.sql`: `INSERT INTO storage.buckets (id, name, public) VALUES ('note-photos','note-photos', false) ON CONFLICT DO NOTHING`; admin INSERT/SELECT/DELETE policies on `storage.objects` for that bucket, same shape as `015b`, with the dashboard fallback note.
- [ ] **Step 3:** Write `types/notes.ts` with exactly the interfaces above.
- [ ] **Step 4:** Run `npx tsc --noEmit` → no new errors.
- [ ] **Step 5:** Commit `feat(notes): migration 019 and note types`.

### Task 2: Parse and validate model output

**Files:**
- Create: `lib/notes/parse.ts`, `lib/notes/parse.test.ts`

**Interfaces:**
- Consumes: `NoteArea`, `NOTE_AREAS` (Task 1)
- Produces:
  - `interface ParsedTask { text: string; due_on: string|null }`
  - `interface ParsedNote { area: NoteArea; title: string; body: string; client_name: string|null; written_on: string|null; tasks: ParsedTask[] }`
  - `interface ParsedCapture { transcript: string; notes: ParsedNote[] }`
  - `parseCaptureResponse(raw: string): ParsedCapture` — never throws.

- [ ] **Step 1: Write failing tests** in `parse.test.ts`:
  - `parses a clean JSON response` → 2 notes, areas, tasks preserved.
  - `strips json code fences` → same as clean.
  - `maps unknown area to unsorted` (`"area":"ideas"` → `"unsorted"`).
  - `keeps only valid ISO dates` (`"2026-11-20"` kept; `"Friday"`, `"2026-02-31"`, `""` → `null`) for both `written_on` and `due_on`.
  - `drops empty tasks and trims text` (`" "` task removed).
  - `fills a missing title from the first line of body, max 80 chars`.
  - `falls back to one unsorted note on non-JSON` → `parseCaptureResponse("I can't read this")` gives `{ transcript: "I can't read this", notes: [{ area: "unsorted", title: "Unreadable page", body: "I can't read this", tasks: [], client_name: null, written_on: null }] }`.
  - `falls back when notes array is empty but transcript exists` → one unsorted note with the transcript as body, title `"Untitled page"`.
- [ ] **Step 2:** `npx vitest run lib/notes/parse.test.ts` → FAIL (module missing).
- [ ] **Step 3:** Implement `parseCaptureResponse` in `lib/notes/parse.ts` (expected JSON shape: `{ transcript: string, notes: [{ area, title, body, client_name, written_on, tasks: [{ text, due_on }] }] }`). Date validity: regex `^\d{4}-\d{2}-\d{2}$` AND `new Date(s+"T00:00:00Z").toISOString().slice(0,10) === s`.
- [ ] **Step 4:** Run tests → PASS.
- [ ] **Step 5:** Commit `feat(notes): parse and validate transcription output`.

### Task 3: Status and to-do helpers

**Files:**
- Create: `lib/notes/status.ts`, `lib/notes/status.test.ts`

**Interfaces:**
- Consumes: types from Task 1
- Produces:
  - `STALE_MS = 5 * 60 * 1000`
  - `effectiveStatus(c: Pick<NoteCapture,"status"|"created_at">, now?: Date): CaptureStatus`
  - `type TodoWithNote = NoteTask & { note: Pick<Note,"id"|"title"|"area"|"status"> }`
  - `openTodos(tasks: TodoWithNote[]): TodoWithNote[]` — not done, note not archived; sorted: overdue/dated by `due_on` asc, then undated by `created_at` desc.
  - `todayTodos(tasks: TodoWithNote[], today: string): TodoWithNote[]` — open tasks with `due_on <= today`.

- [ ] **Step 1: Write failing tests**: `processing under 5 min stays processing`; `processing over 5 min is failed`; `done/failed unchanged`; `openTodos excludes done tasks and archived notes`; `openTodos includes inbox notes' tasks` (spec: tasks show immediately); `openTodos orders dated before undated, earliest first`; `todayTodos keeps overdue and due today, drops future and undated` (today `"2026-11-18"`).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement in `lib/notes/status.ts`.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(notes): capture status and to-do helpers`.

### Task 4: Transcription pipeline and API routes

**Files:**
- Modify: `lib/bedrock.ts` (add image invoke)
- Create: `lib/notes/prompt.ts`, `lib/notes/process.ts`, `lib/notes/process.test.ts`
- Create: `app/api/admin/notes/captures/route.ts` (POST), `app/api/admin/notes/captures/[id]/retry/route.ts` (POST), `app/api/admin/notes/[id]/route.ts` (PATCH, DELETE), `app/api/admin/notes/tasks/route.ts` (POST), `app/api/admin/notes/tasks/[id]/route.ts` (PATCH, DELETE)

**Interfaces:**
- Consumes: `parseCaptureResponse` (Task 2), `requireAdminApi` (`lib/auth/admin.ts`), `todayInMadrid` (`lib/dailyActions.ts`)
- Produces:
  - `lib/bedrock.ts`: `invokeModelWithImages(modelId: ModelId, systemPrompt: string, userPrompt: string, images: { bytes: Uint8Array; format: "jpeg"|"png"|"webp" }[], maxTokens?: number): Promise<string>` — Converse message content = image blocks then the text block; temperature 0.
  - `lib/notes/prompt.ts`: `buildSystemPrompt(): string`, `buildUserPrompt(captureDate: string): string`. System prompt states: astrology + psychology practice (birth charts, transits, tarot, therapy-informed sessions) in Barcelona; areas with one-line definitions; split distinct topics into separate notes; keep original language; never translate or invent; `[?]` for illegible; resolve relative dates against capture date; tasks = things Gabs must do; output JSON only, in the Task 2 shape.
  - `lib/notes/process.ts`: `processCapture(deps: ProcessDeps, captureId: string): Promise<{ ok: true; noteIds: string[] } | { ok: false; error: string }>` where `interface ProcessDeps { supabase: SupabaseClient; transcribe: (images: {bytes: Uint8Array; format:"jpeg"}[], captureDate: string) => Promise<string>; today: () => string }`. Loads capture, downloads each `photo_paths` from `note-photos`, calls `transcribe`, parses, deletes any notes already linked to this capture (retry idempotence), inserts notes (`status:"inbox"`, `ai_area` = `area`) and tasks, sets capture `done` + `raw_transcript` + `model` + `processed_at`; on any throw sets `failed` + `error` and returns `ok:false`.
  - Routes (all start with `requireAdminApi()`):
    - `POST /api/admin/notes/captures` body `{ photo_paths: string[] }` → 400 if 0 or >6 paths or any path not starting `captures/`; inserts capture, runs `processCapture`, returns `{ capture_id, ok, error? }`. `export const maxDuration = 300`.
    - `POST /api/admin/notes/captures/[id]/retry` → sets `processing`, re-runs, same response. `maxDuration = 300`.
    - `PATCH /api/admin/notes/[id]` body subset of `{ area, title, body, client_name, status }` (validate area/status against constants) → updated note. Changing `area` while `status==="inbox"` also sets `status:"filed"`. `DELETE` → 204.
    - `POST /api/admin/notes/tasks` `{ note_id, text, due_on? }`; `PATCH /api/admin/notes/tasks/[id]` `{ text?, due_on?, done?: boolean }` (`done` → `done_at` now / null); `DELETE`.

- [ ] **Step 1: Write failing tests** in `process.test.ts` with a fake supabase (in-memory tables, `storage.from().download()` returning a Blob) and fake `transcribe`:
  - `writes notes and tasks and marks capture done`.
  - `retry replaces earlier notes for the same capture` (run twice → note count equals single run).
  - `marks capture failed and keeps photo_paths when transcribe throws`.
  - `marks failed when a photo cannot be downloaded`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement `invokeModelWithImages`, `prompt.ts`, `process.ts`.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Implement the five route files.
- [ ] **Step 6:** `npx tsc --noEmit` and `npx vitest run` → clean.
- [ ] **Step 7:** Commit `feat(notes): transcription pipeline and admin note APIs`.

### Task 5: Notes page — capture, inbox, list, to-dos

**Files:**
- Create: `lib/notes/shrink.ts`, `lib/notes/shrink.test.ts`, `app/admin/notes/page.tsx`, `components/admin/notes/CaptureButton.tsx`, `components/admin/notes/InboxCard.tsx`, `components/admin/notes/NotesList.tsx`, `components/admin/notes/TodoList.tsx`, `components/admin/notes/AreaChip.tsx`

**Interfaces:**
- Consumes: Task 1 types, Task 3 `effectiveStatus`/`openTodos`, Task 4 routes
- Produces:
  - `targetSize(w: number, h: number, maxEdge = 2000): { width: number; height: number }` (pure, tested) and `shrinkImage(file: File): Promise<Blob>` (browser: `createImageBitmap` → canvas → `image/jpeg` q 0.85).
  - `AreaChip({ area, onChange? })` — reused by Task 6.

- [ ] **Step 1: Failing tests** for `targetSize`: `4032x3024 → 2000x1500`; `3024x4032 → 1500x2000`; `800x600 unchanged`.
- [ ] **Step 2:** Run → FAIL; implement; run → PASS.
- [ ] **Step 3:** `CaptureButton` (client): hidden `<input type="file" accept="image/*" capture="environment" multiple>`; lets her add pages (thumbnails, remove, max 6, non-image files rejected); **Send** shrinks each, uploads to `note-photos` at `captures/{yyyy-mm-dd}/{uuid}-{n}.jpg` via `createClient()` from `lib/supabase/client.ts`, POSTs paths, shows "Reading your page…", then `router.refresh()`. On failure shows the error and leaves the capture for Try again.
- [ ] **Step 4:** `page.tsx` (server, `dynamic = "force-dynamic"`): tabs via `?view=notes|todos` (default notes). Notes view: CaptureButton; captures where `effectiveStatus` is `processing` or `failed` (failed shows **Try again** → retry route); Inbox (`status='inbox'`) as `InboxCard`s (area chip changes area → files it; **Looks right** → PATCH `status:"filed"`; tasks listed with tick/delete); All notes: area filter chips (`?area=`), search box (`?q=` → `.textSearch("search", q, { config: "simple", type: "websearch" })`), newest first, 50 per page, archived hidden unless `?area=archived`. To-dos view: `TodoList` over `openTodos`, each linking to its note, tick → PATCH `done:true`, inbox-note tasks marked "unchecked".
- [ ] **Step 5:** `npx tsc --noEmit`, `npx vitest run` → clean.
- [ ] **Step 6:** Commit `feat(notes): notes page with capture, inbox and to-dos`.

### Task 6: Note detail page

**Files:**
- Create: `app/admin/notes/[id]/page.tsx`, `components/admin/notes/NoteEditor.tsx`

**Interfaces:**
- Consumes: Task 4 routes, `AreaChip` (Task 5)

- [ ] **Step 1:** Server page loads note, its tasks, its capture; makes signed URLs (`createSignedUrls(paths, 3600)`) for the photos; 404 via `notFound()` if missing.
- [ ] **Step 2:** `NoteEditor` (client): photos (tap opens full size in new tab), editable title/body/client name (save button → PATCH), `AreaChip`, tasks (tick, edit text/due date, delete, add), **Archive** and **Delete** (confirm dialog) buttons.
- [ ] **Step 3:** `npx tsc --noEmit` → clean.
- [ ] **Step 4:** Commit `feat(notes): note detail with photo, editing and tasks`.

### Task 7: Navigation and Today

**Files:**
- Modify: `components/admin/navConfig.ts`, `components/admin/navConfig.test.ts`, `components/admin/NavIcons.tsx`, `app/admin/page.tsx`
- Create: `components/admin/today/NotesCard.tsx`

**Interfaces:**
- Consumes: `todayTodos` (Task 3), `todayInMadrid`

- [ ] **Step 1: Update tests first**: `has six groups` → `["Today","Notes","Clients","Content","Website","Insights"]`; `activeGroup("/admin/notes/abc", groups)` → `"Notes"`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Add `"notes"` to `NavIcon`; group `{ label: "Notes", icon: "notes", items: [{ label: "Notes", href: "/admin/notes" }] }` after Today; add a notebook icon path in `NavIcons.tsx`. Check the mobile bar still fits six tabs at 375px (adjust grid columns in `AdminTabBar` if it hard-codes 5).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** `NotesCard` on Today, placed after `GetPaidCard`: "From your notes" — `todayTodos` list (tick inline) and "N notes in your inbox" link; hidden when both empty; queries wrapped so a missing table (migration not yet run) hides the card instead of breaking Today.
- [ ] **Step 6:** `npx tsc --noEmit`, `npx vitest run`, `npm run build` → clean.
- [ ] **Step 7:** Commit `feat(notes): Notes tab and Today card`.

### Task 8: Verify and hand off

- [ ] **Step 1:** Preview the admin locally; with migrations not applied in prod, check pages render without crashing (Today hides the card; Notes shows a clear "run migration 019" message if the tables are missing).
- [ ] **Step 2:** `git merge-tree --write-tree origin/main HEAD` and the same against `origin/feat/apply-lp` merged after → no conflicts.
- [ ] **Step 3:** Push, open PR to `main` describing the two SQL files Lewis must run (019 then 019b) and that PR 21 merges after this.
