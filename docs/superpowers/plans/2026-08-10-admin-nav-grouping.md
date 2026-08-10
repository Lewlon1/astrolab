# Admin Nav Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat 14-link admin header with one standalone Dashboard link plus three purpose-based dropdown menus (Website / Insights / Social).

**Architecture:** A single client component, `components/admin/AdminNav.tsx`, is rewritten in place. Link data moves from one flat `navLinks` array into a `dashboardLink` constant plus a `navGroups` array; desktop and mobile both render from those same constants so they cannot drift. Menu open/close is local `useState`, dismissal uses `document` listeners, and the active-page indicator derives from `usePathname()`. No routes, pages, or layouts change.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS. No component library — menus are hand-rolled, matching the existing codebase (there is no Radix/Headless UI dependency).

**Spec:** `docs/superpowers/specs/2026-08-10-admin-nav-grouping-design.md`

**Branch:** `admin-nav-grouping`

---

## Testing note — read before starting

This repo has **no test framework**. `package.json` defines only `dev`, `build`,
`start`, and `lint`; there are no test files, and no Vitest/Jest/Playwright
config. Adding one solely for this change would be scope creep, so this plan
does not write unit tests.

Every task instead gates on the same three commands, which are the project's real
existing checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Task 3 then verifies actual behaviour in a browser. Do not claim the work is
complete until Task 3's checks have genuinely been run and observed.

---

## File Structure

| File | Change | Responsibility |
| --- | --- | --- |
| `components/admin/AdminNav.tsx` | Modify (full rewrite, ~88 → ~210 lines) | The entire admin header nav: link data, desktop grouped menus, mobile panel |

Nothing else is created or modified. `app/admin/layout.tsx` already renders
`<AdminNav />` at line 26 and needs no change.

The component stays a single file. It is the only consumer of this link data, the
desktop and mobile renderers must share it, and at ~210 lines it remains
comfortably readable — splitting it would spread one cohesive widget across
three files for no benefit.

---

## Reference: the complete final component

Tasks 1 and 2 together produce exactly this file. It is reproduced in full here so
you can check your work at any point: Task 1 writes everything above the
`export default` line, and Task 2 writes the component itself.

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { label: string; href: string };

type NavGroup = {
  label: string;
  items: NavItem[];
  /** href of the item that should be preceded by a divider */
  dividerBefore?: string;
};

const dashboardLink: NavItem = { label: "Dashboard", href: "/admin" };

const navGroups: NavGroup[] = [
  {
    label: "Website",
    items: [
      { label: "Services", href: "/admin/services" },
      { label: "Blog", href: "/admin/blog" },
      { label: "Testimonials", href: "/admin/testimonials" },
      { label: "Events", href: "/admin/events" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", href: "/admin/analytics" },
      { label: "Leads", href: "/admin/leads" },
      { label: "Lead Queue", href: "/admin/lead-queue" },
    ],
  },
  {
    label: "Social",
    items: [
      { label: "Inspiration", href: "/admin/inspiration" },
      { label: "Transits", href: "/admin/transits" },
      { label: "Repurpose", href: "/admin/repurpose" },
      { label: "Engagement", href: "/admin/engagement" },
      { label: "Video Editor", href: "/admin/video-editor" },
      { label: "Photoshop", href: "/admin/photoshop" },
    ],
    dividerBefore: "/admin/video-editor",
  },
];

/** Sub-routes count as being "on" a section: /admin/blog/new highlights Blog. */
function matchesItem(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const pathname = usePathname();
  const desktopNavRef = useRef<HTMLElement | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Close everything on navigation.
  useEffect(() => {
    setOpenGroup(null);
    setMobileOpen(false);
  }, [pathname]);

  // Dismiss the open menu on outside click or Escape.
  useEffect(() => {
    if (!openGroup) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        desktopNavRef.current &&
        !desktopNavRef.current.contains(event.target as Node)
      ) {
        setOpenGroup(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const trigger = triggerRefs.current[openGroup];
      setOpenGroup(null);
      trigger?.focus();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openGroup]);

  // Dashboard is an exact match so it doesn't light up on every admin page.
  const dashboardActive = pathname === dashboardLink.href;

  return (
    <div className="flex items-center gap-6">
      {/* Branding */}
      <div className="flex items-center gap-2.5">
        <span className="font-heading text-lg tracking-wide">ASTRO LAB</span>
        <span className="text-[10px] font-medium uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
          Admin
        </span>
      </div>

      {/* Desktop nav */}
      <nav
        ref={desktopNavRef}
        className="hidden md:flex items-center gap-1"
      >
        <Link
          href={dashboardLink.href}
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors hover:bg-[#f5f3ef] ${
            dashboardActive
              ? "text-[#1a1a18] font-medium"
              : "text-[#6b6560] hover:text-[#1a1a18]"
          }`}
        >
          {dashboardLink.label}
        </Link>

        {navGroups.map((group) => {
          const isOpen = openGroup === group.label;
          const isActive = group.items.some((item) =>
            matchesItem(pathname, item.href)
          );

          return (
            <div key={group.label} className="relative">
              <button
                ref={(el) => {
                  triggerRefs.current[group.label] = el;
                }}
                type="button"
                onClick={() => setOpenGroup(isOpen ? null : group.label)}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors hover:bg-[#f5f3ef] ${
                  isActive || isOpen
                    ? "text-[#1a1a18] font-medium"
                    : "text-[#6b6560] hover:text-[#1a1a18]"
                }`}
              >
                {group.label}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                >
                  <path d="M2.5 4L5 6.5L7.5 4" />
                </svg>
              </button>

              {isOpen && (
                <div
                  role="menu"
                  aria-label={group.label}
                  className="absolute left-0 top-full mt-1.5 min-w-[184px] bg-white border border-[#e8e5df] rounded-xl shadow-sm py-1.5 z-50"
                >
                  {group.items.map((item) => {
                    const itemActive = matchesItem(pathname, item.href);

                    return (
                      <div key={item.href}>
                        {group.dividerBefore === item.href && (
                          <div
                            role="separator"
                            className="my-1.5 border-t border-[#f0ede8]"
                          />
                        )}
                        <Link
                          role="menuitem"
                          href={item.href}
                          aria-current={itemActive ? "page" : undefined}
                          className={`block text-sm px-3 py-2 mx-1.5 rounded-lg transition-colors hover:bg-[#f5f3ef] ${
                            itemActive
                              ? "text-[#1a1a18] font-medium bg-[#f5f3ef]"
                              : "text-[#6b6560] hover:text-[#1a1a18]"
                          }`}
                        >
                          {item.label}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen((v) => !v)}
        className="md:hidden p-1.5 rounded-lg hover:bg-[#f5f3ef] transition-colors"
        aria-label="Toggle navigation"
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <line x1="3" y1="3" x2="15" y2="15" />
            <line x1="15" y1="3" x2="3" y2="15" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <line x1="3" y1="5" x2="15" y2="5" />
            <line x1="3" y1="9" x2="15" y2="9" />
            <line x1="3" y1="13" x2="15" y2="13" />
          </svg>
        )}
      </button>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-white border-b border-[#e8e5df] shadow-sm z-50 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <nav className="max-w-7xl mx-auto px-6 py-3 flex flex-col gap-0.5">
            <Link
              href={dashboardLink.href}
              onClick={() => setMobileOpen(false)}
              className={`text-sm px-3 py-2 rounded-lg transition-colors hover:bg-[#f5f3ef] ${
                dashboardActive
                  ? "text-[#1a1a18] font-medium"
                  : "text-[#6b6560] hover:text-[#1a1a18]"
              }`}
            >
              {dashboardLink.label}
            </Link>

            {navGroups.map((group) => (
              <div key={group.label} className="mt-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#b8b0a4] px-3 pb-1">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const itemActive = matchesItem(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={itemActive ? "page" : undefined}
                      className={`block text-sm px-3 py-2 rounded-lg transition-colors hover:bg-[#f5f3ef] ${
                        itemActive
                          ? "text-[#1a1a18] font-medium bg-[#f5f3ef]"
                          : "text-[#6b6560] hover:text-[#1a1a18]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
```

---

### Task 1: Replace the flat link list with grouped data

**Files:**
- Modify: `components/admin/AdminNav.tsx:1-21`

- [ ] **Step 1: Confirm you are on the right branch with a clean tree**

Run:

```bash
cd /Users/lewislonsdale/Documents/GitHub/astropsyche-lab && git status --porcelain && git branch --show-current
```

Expected: no output from `git status --porcelain` (clean tree), and `admin-nav-grouping` printed.

If the branch is missing, create it: `git checkout -b admin-nav-grouping`.

- [ ] **Step 2: Replace the imports and the `navLinks` constant**

Replace lines 1–21 of `components/admin/AdminNav.tsx` (everything from `"use client";` down to and including the closing `];` of `navLinks`) with:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { label: string; href: string };

type NavGroup = {
  label: string;
  items: NavItem[];
  /** href of the item that should be preceded by a divider */
  dividerBefore?: string;
};

const dashboardLink: NavItem = { label: "Dashboard", href: "/admin" };

const navGroups: NavGroup[] = [
  {
    label: "Website",
    items: [
      { label: "Services", href: "/admin/services" },
      { label: "Blog", href: "/admin/blog" },
      { label: "Testimonials", href: "/admin/testimonials" },
      { label: "Events", href: "/admin/events" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", href: "/admin/analytics" },
      { label: "Leads", href: "/admin/leads" },
      { label: "Lead Queue", href: "/admin/lead-queue" },
    ],
  },
  {
    label: "Social",
    items: [
      { label: "Inspiration", href: "/admin/inspiration" },
      { label: "Transits", href: "/admin/transits" },
      { label: "Repurpose", href: "/admin/repurpose" },
      { label: "Engagement", href: "/admin/engagement" },
      { label: "Video Editor", href: "/admin/video-editor" },
      { label: "Photoshop", href: "/admin/photoshop" },
    ],
    dividerBefore: "/admin/video-editor",
  },
];

/** Sub-routes count as being "on" a section: /admin/blog/new highlights Blog. */
function matchesItem(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
```

- [ ] **Step 3: Verify the link inventory is complete**

Every one of the 14 original links must still be present exactly once. Run:

```bash
cd /Users/lewislonsdale/Documents/GitHub/astropsyche-lab && grep -c 'href: "/admin' components/admin/AdminNav.tsx
```

Expected: `14`

Then confirm none were lost or renamed against the original:

```bash
cd /Users/lewislonsdale/Documents/GitHub/astropsyche-lab && diff <(git show HEAD:components/admin/AdminNav.tsx | grep -o 'href: "[^"]*"' | sort) <(grep -o 'href: "[^"]*"' components/admin/AdminNav.tsx | sort)
```

Expected: no output (the two sets of hrefs are identical).

- [ ] **Step 4: Verify it does not yet compile**

Run:

```bash
cd /Users/lewislonsdale/Documents/GitHub/astropsyche-lab && npx tsc --noEmit
```

Expected: FAIL. The old JSX body below still references `navLinks`, which no
longer exists — expect `Cannot find name 'navLinks'`. This is correct at this
point; Task 2 replaces that JSX. Do not commit yet.

---

### Task 2: Build the desktop grouped menus

**Files:**
- Modify: `components/admin/AdminNav.tsx` (the `AdminNav` function body)

- [ ] **Step 1: Replace the component body**

Replace the entire `export default function AdminNav() { ... }` function with the
version from the **"Reference: the complete final component"** section above,
starting at `export default function AdminNav() {` and running to the final
closing `}` of the file.

That reference version contains everything the component needs — the state and
refs, the dismissal effects, the active-state classes, and the grouped mobile
panel. Copy it verbatim; it is the complete, final body.

- [ ] **Step 2: Verify the file matches the reference exactly**

Run:

```bash
cd /Users/lewislonsdale/Documents/GitHub/astropsyche-lab && npx tsc --noEmit
```

Expected: PASS — no output, exit code 0.

If you see `Type '(el: HTMLButtonElement | null) => ... ' is not assignable`, the
`ref` callback is returning a value. It must use a block body:
`ref={(el) => { triggerRefs.current[group.label] = el; }}` — not
`ref={(el) => (triggerRefs.current[group.label] = el)}`.

- [ ] **Step 3: Run the linter**

Run:

```bash
cd /Users/lewislonsdale/Documents/GitHub/astropsyche-lab && npm run lint
```

Expected: `✔ No ESLint warnings or errors`

If `react-hooks/exhaustive-deps` warns about the dismissal effect, do **not** add
`triggerRefs` to the dependency array — refs are stable and including them is
unnecessary. The effect's real dependency is `openGroup`, which is already listed.

- [ ] **Step 4: Verify the production build compiles**

Run:

```bash
cd /Users/lewislonsdale/Documents/GitHub/astropsyche-lab && npm run build
```

Expected: build completes with `✓ Compiled successfully` and the route list
printed. All `/admin/*` routes must still appear.

- [ ] **Step 5: Commit**

```bash
cd /Users/lewislonsdale/Documents/GitHub/astropsyche-lab
git add components/admin/AdminNav.tsx
git commit -m "$(cat <<'EOF'
feat(admin): group nav links by purpose

Replaces the flat 14-link header with a Dashboard link plus
Website / Insights / Social dropdown menus. Adds an active-page
indicator and keeps the mobile panel in sync via shared constants.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Verify menu behaviour in a real browser

**Files:** none modified — this task is verification only.

Tasks 1 and 2 prove the code compiles. They prove nothing about whether the menus
actually open, close, or route. This task does.

- [ ] **Step 1: Start the dev server**

Use the `preview_start` tool with `{name: "Next.js Dev Server"}` — the config
already exists at `.claude/launch.json`. Do **not** run `npm run dev` via a shell.

Expected: a preview tab opens and returns a `tabId`.

- [ ] **Step 2: Sign in and reach the admin area**

Navigate to `/admin`. The admin layout redirects to `/admin/login` when there is
no Supabase session (`app/admin/layout.tsx:15-18`).

If you land on the login page, **stop and ask the user to sign in** — do not
enter credentials yourself. Once signed in, continue.

- [ ] **Step 3: Confirm the header renders three groups**

Use `read_page` on the admin page.

Expected: a `Dashboard` link plus three buttons labelled `Website`, `Insights`,
and `Social`. The 13 grouped links must **not** be visible in the page while all
menus are closed.

- [ ] **Step 4: Open each menu and check its contents**

Click each of the three triggers in turn and `read_page` after each.

Expected contents:
- `Website` → Services, Blog, Testimonials, Events
- `Insights` → Analytics, Leads, Lead Queue
- `Social` → Inspiration, Transits, Repurpose, Engagement, Video Editor, Photoshop

Also confirm the open trigger reports `aria-expanded="true"` and the panel has
`role="menu"`.

- [ ] **Step 5: Check the three dismissal paths**

With a menu open, verify each of these closes it (re-open the menu between each):

1. Click a blank area of the page body → menu closes.
2. Press `Escape` → menu closes.
3. Click a link inside the menu → the route changes **and** the menu closes.

Expected: all three close the menu. Path 3 is the one most likely to regress — it
depends on the `pathname` effect, not on the click handler.

- [ ] **Step 6: Verify all 14 destinations still resolve**

Visit each route and confirm it renders its page (not a 404 or error overlay):

```
/admin                  /admin/services      /admin/blog
/admin/testimonials     /admin/events        /admin/analytics
/admin/leads            /admin/lead-queue    /admin/inspiration
/admin/transits         /admin/repurpose     /admin/engagement
/admin/video-editor     /admin/photoshop
```

Then check the browser console with `read_console_messages`.

Expected: every route renders; no React errors in the console.

- [ ] **Step 7: Verify the active-state indicator**

On `/admin/blog`, confirm the `Website` trigger is rendered in the darker
`#1a1a18` treatment while `Insights` and `Social` are not.

Then navigate to `/admin/blog/new` and confirm `Website` is **still** marked
active. This is the prefix-matching rule from the spec; if it fails here, the
`matchesItem` helper is wrong.

Finally, on `/admin`, confirm `Dashboard` is active and no group is.

- [ ] **Step 8: Verify the mobile panel**

Use `resize_window` with `{preset: "mobile"}` and reload.

Expected: the hamburger button appears, the desktop nav is hidden, and opening
the panel shows all 14 links under the three uppercase headings. Tapping a link
navigates and closes the panel.

- [ ] **Step 9: Capture proof and restore the viewport**

Take a screenshot of the desktop header with the `Social` menu open, to share
with the user. Then `resize_window` back to `{preset: "desktop"}`.

- [ ] **Step 10: Report results honestly**

If any check in Steps 3–8 failed, fix it, re-run `npm run lint`,
`npx tsc --noEmit`, `npm run build`, and repeat the failed check before
continuing. Do not report the work as complete with a known failing check.

If a fix was needed, commit it:

```bash
cd /Users/lewislonsdale/Documents/GitHub/astropsyche-lab
git add components/admin/AdminNav.tsx
git commit -m "$(cat <<'EOF'
fix(admin): correct nav grouping behaviour found in browser testing

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Definition of done

- [ ] `components/admin/AdminNav.tsx` renders one Dashboard link and three group menus
- [ ] All 14 original `/admin/*` hrefs are present and resolve to their original pages
- [ ] Menus close on outside click, `Escape`, and navigation
- [ ] The active group is indicated, including on sub-routes like `/admin/blog/new`
- [ ] The mobile panel shows all 14 links under three headings
- [ ] `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass
- [ ] No files outside `components/admin/AdminNav.tsx` were modified

Confirm the last point with:

```bash
cd /Users/lewislonsdale/Documents/GitHub/astropsyche-lab && git diff --name-only main...HEAD
```

Expected: only `components/admin/AdminNav.tsx` and the two `docs/superpowers/`
markdown files.
