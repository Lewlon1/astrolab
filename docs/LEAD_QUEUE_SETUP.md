# Lead Queue + Daily Actions — setup guide

Everything you need to do by hand before `/admin/lead-queue` does anything useful.
Two tasks to do, in order, plus one that is parked. Task 0 is required; task 1 unlocks
the behavioural data the queue ranks on.

| # | Task | Time | Blocks what |
|---|---|---|---|
| 0 | Run migration 013 | 2 min | **Everything** |
| 1 | MailerLite API key | 10 min | Email-side scoring, the Sync button |
| 2 | Instagram leads | — | **Parked** — ManyChat has no export (see below) |

---

## Why this exists at all

The tool answers one question every morning: **who is closest to booking, and what is
the single next thing to do about it?**

It can only answer that if it can see behaviour. A name on a list tells you nothing.
"Opened three emails, clicked the pricing link four days ago, never booked" tells you
everything — that person should get a voice note today, not next month.

**MailerLite** is the source that makes this work. It holds the email list and, more
importantly, knows what people *did* — opens, clicks, unsubscribes. Task 1 pulls that in.

Instagram (ManyChat) was meant to be the second source, but it cannot export contacts at
all — see Task 2. That is parked, and the cost is smaller than it sounds.

### Which scoring signals are actually live

Worth knowing before you judge the rankings. The scoring engine understands seven
behavioural signals, but only some are populated by anything today:

| Signal | Weight | Populated by |
|---|---|---|
| Email link click | 12 | ✅ MailerLite sync |
| Email open | 4 | ✅ MailerLite sync |
| Opt-in / subscribed | 10 | ✅ MailerLite sync |
| Pricing click | **30** | ❌ nothing yet — see below |
| Story reply | 25 | ❌ nothing yet |
| Love code delivered | 20 | ❌ nothing yet |
| Attended an event | 18 | ❌ nothing yet |

The four dormant ones are the highest-weighted, so until something writes them the queue
ranks mostly on email engagement plus pipeline stage. Concretely, that means the Tier 1
actions which fire today are **voice notes** (a `new` lead with any email engagement) and
**follow-ups** (a voice note sent 14+ days ago with no reply). Booking nudges, story-reply
answers and code follow-ups stay dormant because their trigger events are never written.

**The good news:** `pricing_click` — the single highest weight — can be derived from data
the site already collects. The public analytics already record a `booking_click` conversion
on every service card, tarot card and booking grid, and `leads.session_key` links a lead to
their analytics session. Wiring `analytics_events` → `lead_events` would light up the most
valuable signal in the rubric for free, with no new integration. That is not built yet.

---

## Task 0 — Run migration 013

**Purpose:** creates the tables everything else writes to. Until this runs, the page
loads but the queue is empty and the scoring panel shows a warning.

1. Open the [Supabase dashboard](https://supabase.com/dashboard) → your project →
   **SQL Editor** → **New query**.
2. *(Optional but recommended, see below)* run the duplicate check first.
3. Paste the entire contents of `supabase/migrations/013_lead_queue_daily_actions.sql`.
4. Click **Run**.

Every statement is idempotent (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`), so running it
twice is harmless.

**What it does:**
- Adds queue columns to the existing `leads` table (`ig_handle`, `language`,
  `mailerlite_id`, `tags`, `unsubscribed`, activity timestamps).
- **Widens the `leads.source` CHECK constraint** to allow `'mailerlite'` and
  `'csv_import'`. Without this every synced row is rejected — this is the one statement
  that will break the sync if you skip it.
- Merges duplicate-email leads and makes `leads.email` unique (see above).
- Creates `lead_events` (the behavioural timeline), `lead_scoring_config` (the weights),
  `action_items` (the daily batch), `ritual_calendar` (weekly fixtures).
- Adds `last_engaged_at` to `engagement_accounts` so Tier 3 can rotate properly.
- Seeds 15 scoring weights and 2 ritual fixtures.
- Applies RLS policies matching migration 007. **Without these the tool reads empty even
  though the data is there** — so don't run a partial selection of the file.

### It merges duplicate leads — look before you run

`leads` has never had a unique constraint on email, and the newsletter form did a plain
`INSERT`, so **repeat signups created duplicate rows**. Email is the merge key for both
MailerLite and the CSV upload, so it has to become unique — which means the existing
duplicates get collapsed. Section 7 of the migration does that, and it **deletes rows**.

It is not destructive of information. For each duplicated address one row survives and
absorbs everything the others had first:

- The survivor is the one furthest along the pipeline, so a `booked` row is never dropped
  in favour of a `new` one.
- Its `created_at` is pulled back to the earliest in the group, preserving the real signup date.
- Any `name`, `source`, or UTM/attribution value the survivor was missing is filled in from
  the others.
- **Notes are concatenated, not overwritten** — a note you hand-wrote on a discarded row is
  kept, joined with `---`.

To see exactly which addresses are affected before running anything:

```sql
select
  lower(email)               as email,
  count(*)                   as copies,
  min(created_at)::date      as first_seen,
  max(created_at)::date      as last_seen,
  array_agg(distinct status) as stages,
  array_agg(distinct source) as sources
from leads
where email is not null
group by lower(email)
having count(*) > 1
order by count(*) desc;
```

The migration also lower-cases every stored email, so `Gabs@x.com` and `gabs@x.com` stop
being two different leads.

One knock-on change outside the admin tool: `app/api/leads/route.ts` (the public newsletter
form) now does an `upsert` instead of an `insert`. Without that, the new unique constraint
would make a returning subscriber see an error on the public site. Nothing else about the
form changed.

**Verify:** run this in the SQL editor. All five should return a row.

```sql
select table_name from information_schema.tables
where table_name in ('lead_events','lead_scoring_config','action_items','ritual_calendar')
union all
select 'weights: ' || count(*)::text from lead_scoring_config;
```

Then load `/admin/lead-queue` → **Queue** tab. The scoring panel should list 15 editable
weights rather than the "No config rows found" warning.

---

## Task 1 — MailerLite API key

**Purpose:** lets the Sync button pull the email list and, crucially, **what each
subscriber did with the campaigns**. Opens and clicks are what separate "on the list"
from "actually interested". A pricing-link click is the single strongest buying signal
the scoring engine has — it is weighted highest by default (30 points).

Without this, the queue only ever contains people who came in through the website form,
and no one has a behavioural score.

### Get the key

1. Log in to [MailerLite](https://dashboard.mailerlite.com/).
2. Click your **profile icon** (top right) → **Integrations**.
3. Find **MailerLite API** in the list → **Use**.
4. Click **Generate new token**.
5. Name it something you'll recognise later — e.g. `astropsyche-lab-admin`.
6. **Copy the token now.** MailerLite shows it exactly once. If you lose it, generate
   a new one; there is no way to view it again.

> Make sure you are in the **new** MailerLite (dashboard.mailerlite.com), not Classic
> (app.mailerlite.com). The two have different APIs and a Classic key will fail with a
> 401. If your dashboard URL says `app.mailerlite.com`, you're on Classic.

### Add it to Vercel

1. [Vercel dashboard](https://vercel.com/dashboard) → the **astrolab** project →
   **Settings** → **Environment Variables**.
2. Check whether **`MAILERLITE_API_KEY`** already exists — it probably does, because the
   public newsletter form at `app/api/leads/route.ts` already uses it.
   - **If it exists:** you're done. The new tool deliberately reuses the same variable
     rather than adding a second one for the same credential. Skip to *Add it locally*.
   - **If it doesn't exist:** add it.
3. Name: `MAILERLITE_API_KEY` — exactly this, no `NEXT_PUBLIC_` prefix. That prefix would
   ship the key to the browser and expose it publicly.
4. Value: the token you copied.
5. Environments: tick **Production**, **Preview**, and **Development**.
6. **Save**, then **redeploy** — Vercel only picks up env var changes on a new build.

### Add it locally (optional, for dev)

Create or edit `.env.local` in the project root:

```
MAILERLITE_API_KEY=your_token_here
```

It's already gitignored via the `.env*.local` rule, so it will not be committed.

### Verify

`/admin/lead-queue` → **Queue** tab → **Sync MailerLite**. You should get a toast like
"Synced 214 subscribers — 189 new, 25 updated", and the table fills with scored leads.

**If it fails:**

| Message | Cause | Fix |
|---|---|---|
| "MailerLite rejected the API key (401/403)" | Wrong or Classic key | Regenerate on dashboard.mailerlite.com |
| "MAILERLITE_API_KEY is not set" | Not in Vercel, or not redeployed | Add it, then redeploy |
| "rate limit hit (120 req/min)" | Large list | Wait a minute and re-run; already-synced leads are kept |
| Sync succeeds, `leads_source_check` errors listed | Migration 013 not run | Run Task 0 |

### One caveat worth knowing

The MailerLite client was written from their published API docs — the build environment
had no network access to `connect.mailerlite.com`, so **the response shapes have never
been confirmed against the real API**. Everything is defensive (missing fields become
null rather than crashing), but the first sync is a genuine test.

If the sync returns 0 subscribers when you know the list isn't empty, that's the
pagination format differing from the docs. Tell me and it's a quick fix — the relevant
code is `fetchAllSubscribers()` in `lib/mailerlite.ts`.

**On rate limits:** MailerLite allows 120 requests/minute. The sync pages subscribers
100 at a time, then fetches detailed activity only for subscribers who have actually
opened or clicked something, capped at 40. So a 2,000-person list costs about 60
requests, comfortably inside the limit.

---

## Task 2 — Instagram leads: not currently possible

**Status: parked.** Nothing to do here. This section exists to record why, so the
question doesn't get re-opened from scratch.

### ManyChat cannot export contacts

An earlier version of this guide said to click **Export** in ManyChat's Audience view.
**That button does not exist** — not on Free, not on any paid tier. ManyChat's own help
doc lists exactly two ways to get contact data out, and neither is a CSV download:

- **Google Sheets integration** — an automation writes contact fields into a sheet
  (rate-limited to roughly 250 contacts per 100 seconds, so it needs batching).
- **External Request** — ManyChat POSTs `Full Contact Data` as JSON to a server you own.

Both are paid-tier features. "Export contacts to CSV" remains an open feature request on
their community board.

ManyChat also overhauled its pricing on **2 March 2026** into Free / Essential / Pro /
Business, and the new **Free tier caps at 25 contacts**. This account is on that tier, so
there is no bulk Instagram audience worth engineering a pipeline for right now.

### What this costs

Less than it sounds:

- **The queue still works.** MailerLite is the richer behavioural source anyway — it knows
  opens and clicks, which is what scoring actually ranks on.
- **`ig_handle` stays empty**, so Tier 1 action cards deep-link to the generic Instagram
  inbox or a `mailto:` rather than straight to a DM thread. One extra click, not a
  blocker.
- **Instagram-only people (no email) never enter the queue.** At a 25-contact cap this is
  a handful of people at most.
- **The `w_manychat_optin` scoring weight never fires.** Harmless — it just never
  contributes.

### If Instagram leads matter later

In rough order of value for money:

1. **Capture at source (free).** End the love-code flow by sending people to the site's
   signup. They then arrive through `/api/leads` with full attribution and land in the
   queue automatically — and in MailerLite too. Only catches new people, not the back
   catalogue, but it removes the export problem permanently.
2. **Paste-in entry (free, needs a small build).** A textarea on the Queue tab accepting
   `email, handle, name` lines, reusing the CSV merge logic and merge report. Right answer
   for a warm list of tens of people.
3. **External Request webhook (needs a paid tier).** If the account ever upgrades, spend it
   here rather than on spreadsheets: ManyChat POSTs contact JSON to an endpoint and leads
   arrive in real time, with no export step at all.

### The CSV uploader is not wasted

The **Upload CSV** button on the Queue tab is **not ManyChat-specific**. It is a generic
merger — it detects columns by alias, merges on email then IG handle, and reports every
column it ignored. Any CSV with an email or handle column works: a Google Sheet export, a
spreadsheet typed by hand, an export from some future tool. Only the ManyChat *source* is
blocked, not the feature.

---

## After all three

Open the **Daily actions** tab. The first load of the day generates batch 1.

Expect it to look thin at first, and that's correct behaviour rather than a bug: Tier 1
conversion actions only exist once there's behavioural history to rank on. On day one you
will likely see the ritual fixture (if it's a Tuesday or Sunday), up to 3 engagement
actions, and some maintenance — with a banner saying so plainly.

The banner is the honest part of the tool. When it says *"The high-value work is done for
today. Stopping here is the right call"*, it means it. It will return a batch of 4 rather
than pad to 10.

### Worth doing in week one

- **Retune the weights.** `/admin/lead-queue` → Queue → *Scoring weights*. The starting
  numbers are an educated guess and are expected to be wrong. Changes take effect on the
  next page load — no redeploy, no re-sync.
- **Confirm the ritual calendar.** Two fixtures are seeded (Tuesday story ritual 20 min,
  Sunday batch prep 20 min) but the specs they were meant to come from aren't in the repo,
  so the timings are provisional.
- **Check whether the 45-minute budget feels right.** Note that Tier 1 conversion work is
  deliberately allowed to exceed it — conversion work is never trimmed to make room for
  filler, so a heavy backlog day can run long. If that reads wrong in practice, it's a
  one-line change.
