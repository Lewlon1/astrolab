# Admin nav: group tabs by purpose

**Date:** 2026-08-10
**Status:** Approved

## Problem

`components/admin/AdminNav.tsx` renders a flat list of 14 links in a single
56px-tall header row (`h-14`). At that count the header is cramped, the links are
undifferentiated, and nothing indicates which page you are currently on. There is
no signal about what any given page is *for* — "Repurpose", "Transits" and
"Services" sit side by side as peers despite serving unrelated jobs.

## Goal

Group the existing admin pages by the job they do, so the header communicates
purpose instead of listing destinations.

## Scope

**In scope:** `components/admin/AdminNav.tsx` only.

**Out of scope:** the dashboard page (`app/admin/page.tsx`), the admin layout
(`app/admin/layout.tsx`), and all 14 destination pages. No routes are added,
removed, or renamed — every existing `/admin/*` URL keeps working unchanged.

This was an explicit decision: an earlier option to also restructure the
dashboard homepage into matching sections was considered and rejected in favour
of the smaller change.

## Structure

One standalone link plus three grouped menus:

| Menu        | Items                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| `Dashboard` | standalone link to `/admin` — not a group                              |
| `Website`   | Services, Blog, Testimonials, Events                                   |
| `Insights`  | Analytics, Leads, Lead Queue                                           |
| `Social`    | Inspiration, Transits, Repurpose, Engagement · Video Editor, Photoshop |

Menu labels are the short forms (`Website`, `Insights`, `Social`) rather than the
full phrasings ("Update the website", "Gather insights", "Grow social media") —
the long forms do not fit a header row.

Ordering within each group is by expected frequency of use, not alphabetical.

Within `Social`, a thin divider separates Video Editor and Photoshop from the
first four items, so the two production tools read as tools rather than as
further workflow steps.

## Data shape

The current `navLinks: { label, href }[]` constant is replaced by:

- `dashboardLink: { label, href }` — the standalone `/admin` link
- `navGroups: { label, items: { label, href }[] }[]` — the three groups

Desktop and mobile both render from these same two constants, so the two
presentations cannot drift out of sync.

## Desktop behaviour

- **Open on click, not hover.** Hover menus are error-prone on trackpads and
  unusable on touch devices.
- Clicking a second group's trigger switches directly to that group.
- The open menu closes on: clicking outside, pressing `Escape`, or navigating to
  a new route.
- Close-on-navigate uses the `usePathname` + `useEffect` pattern already
  established in `components/SiteHeader.tsx:62-65`.

## Accessibility

This is a **disclosure**, not an ARIA `menu`.

An earlier draft of this spec mandated `role="menu"` / `role="menuitem"`. That was
wrong and is superseded. The ARIA `menu` role carries an interaction contract —
`ArrowUp`/`ArrowDown`/`Home`/`End` roving focus, and focus moving into the panel
on open — that this component does not implement. Worse, `role="menuitem"`
*overrides* the native link role, so the destinations stop being announced as
links and drop out of screen-reader link lists. Claiming the role while behaving
like a plain list of links is worse for assistive-technology users than not
claiming it.

The component is a button that shows and hides a list of links. That is a
disclosure, and Tab-through is the expected interaction for one.

- Each trigger is a real `<button>` carrying `aria-expanded` and `aria-controls`
  pointing at its panel. No `aria-haspopup`.
- The panel is a `<ul>` of `<li>` items containing ordinary `Link`s — no `menu`
  or `menuitem` roles.
- The current page's link carries `aria-current="page"`.
- `Escape` closes the open panel and returns focus to its trigger — but only when
  focus was inside the nav, so it cannot steal focus from elsewhere on the page.
- Moving focus out of the nav closes the open panel.
- On mobile, each group is a `role="group"` labelled by its heading via
  `aria-labelledby`, so the grouping is conveyed programmatically and not only
  visually.
- Both `<nav>` landmarks are labelled.

## Active state

`usePathname` is already required for close-on-navigate, so the current-location
indicator comes essentially free:

- The group containing the current page gets the darker foreground treatment
  (`text-[#1a1a18]`) that links currently only get on hover.
- Inside an open panel, the link matching the current path is highlighted.
Matching rule:

- The Dashboard link uses **exact** match (`pathname === "/admin"`), so it does
  not light up on every admin page.
- Group items use **prefix** match
  (`pathname === href || pathname.startsWith(href + "/")`), so sub-routes such as
  `/admin/blog/new` and `/admin/events/new` — both linked from the dashboard's
  own quick actions — correctly highlight Blog and Events.

Exact matching everywhere was considered first and rejected: it leaves the nav
showing no active state at all while writing a blog post or creating an event.

Today there is no active indicator at all, so this is a net addition.

## Mobile

The existing hamburger button and dropdown panel are kept. Items are rendered
under small uppercase group headings.

No accordions: 14 items in a scrolling panel is acceptable, and static headings
convey the grouping without costing an extra tap per group.

## Styling

Reuse the existing token values already present in the component — `#6b6560`
(idle text), `#1a1a18` (active/hover text), `#f5f3ef` (hover background),
`#e8e5df` (borders), `rounded-lg`, `text-sm`. No new colours are introduced.

## Verification

Run the Next.js dev server and confirm:

1. Each of the three menus opens and closes on click.
2. Clicking outside, pressing `Escape`, and navigating each close the open menu.
3. All 14 destinations resolve to the same pages as before.
4. The active-state indicator marks the correct group on each page.
5. The mobile panel lists all 14 items under the correct headings.

## Known trade-offs

- **`Social` carries six of the fourteen items** — more than the other two groups
  combined. Transits is arguably website/content work as much as social. This is
  the group most likely to need splitting as the admin grows.
- **Two clicks instead of one.** Every page is currently reachable in a single
  click. Afterwards, everything except Dashboard takes two. This is the accepted
  cost of a legible header at 14 items.
