"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  /** Render a divider immediately before this item. */
  dividerBefore?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
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
      { label: "Video Editor", href: "/admin/video-editor", dividerBefore: true },
      { label: "Photoshop", href: "/admin/photoshop" },
    ],
  },
];

/** Sub-routes count as being "on" a section: /admin/blog/new highlights Blog. */
function matchesItem(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const tone = (active: boolean) =>
  active
    ? "text-[#1a1a18] font-medium"
    : "text-[#6b6560] hover:text-[#1a1a18]";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1a18]/25";

export default function AdminNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const pathname = usePathname();
  const desktopNavRef = useRef<HTMLElement | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const mobileToggleRef = useRef<HTMLButtonElement | null>(null);
  const mobilePanelRef = useRef<HTMLDivElement | null>(null);

  // Close everything on navigation.
  useEffect(() => {
    setOpenGroup(null);
    setMobileOpen(false);
  }, [pathname]);

  // Dismiss the desktop panel on outside pointer/focus, and either panel on
  // Escape. Pointer/focus dismissal only serves the desktop dropdown — the
  // mobile panel has no outside-tap dismissal, unchanged from before.
  useEffect(() => {
    if (!openGroup && !mobileOpen) return;

    const closeIfOutside = (target: Node | null) => {
      if (
        target &&
        desktopNavRef.current &&
        !desktopNavRef.current.contains(target)
      ) {
        setOpenGroup(null);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      closeIfOutside(event.target as Node);
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as Node | null;
      // Focus falling to <body> is not a deliberate exit — Safari/Firefox do
      // this on mousedown over elements they don't focus on click, and
      // closing here would unmount the link before its click dispatches.
      if (!target || target === document.body) return;
      closeIfOutside(target);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (openGroup) {
        const nav = desktopNavRef.current;
        const focusWasInside = !!nav && nav.contains(document.activeElement);
        const trigger = triggerRefs.current[openGroup];
        setOpenGroup(null);
        if (focusWasInside) trigger?.focus();
      }

      if (mobileOpen) {
        const active = document.activeElement;
        const focusWasInside =
          mobileToggleRef.current === active ||
          !!mobilePanelRef.current?.contains(active);
        setMobileOpen(false);
        if (focusWasInside) mobileToggleRef.current?.focus();
      }
    };

    if (openGroup) {
      document.addEventListener("pointerdown", handlePointerDown);
      document.addEventListener("focusin", handleFocusIn);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openGroup, mobileOpen]);

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
        aria-label="Admin"
        className="hidden md:flex items-center gap-1"
      >
        <Link
          href={dashboardLink.href}
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors hover:bg-[#f5f3ef] ${focusRing} ${tone(
            dashboardActive
          )}`}
        >
          {dashboardLink.label}
        </Link>

        {navGroups.map((group) => {
          const isOpen = openGroup === group.label;
          const isActive = group.items.some((item) =>
            matchesItem(pathname, item.href)
          );
          const panelId = `admin-nav-${group.label.toLowerCase()}`;

          return (
            <div key={group.label} className="relative">
              <button
                ref={(el) => {
                  triggerRefs.current[group.label] = el;
                }}
                type="button"
                onClick={() => setOpenGroup(isOpen ? null : group.label)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors hover:bg-[#f5f3ef] ${focusRing} ${tone(
                  isActive || isOpen
                )}`}
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
                  className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                >
                  <path d="M2.5 4L5 6.5L7.5 4" />
                </svg>
              </button>

              {isOpen && (
                <ul
                  id={panelId}
                  className="absolute left-0 top-full mt-1.5 min-w-[184px] bg-white border border-[#e8e5df] rounded-xl shadow-sm py-1.5 z-50"
                >
                  {group.items.map((item) => {
                    const itemActive = matchesItem(pathname, item.href);

                    return (
                      <Fragment key={item.href}>
                        {item.dividerBefore && (
                          <li
                            aria-hidden="true"
                            className="my-1.5 border-t border-[#f0ede8]"
                          />
                        )}
                        <li>
                          <Link
                            href={item.href}
                            onClick={() => setOpenGroup(null)}
                            aria-current={itemActive ? "page" : undefined}
                            className={`block text-sm px-3 py-2 mx-1.5 rounded-lg transition-colors hover:bg-[#f5f3ef] ${focusRing} ${tone(
                              itemActive
                            )}${itemActive ? " bg-[#f5f3ef]" : ""}`}
                          >
                            {item.label}
                          </Link>
                        </li>
                      </Fragment>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Mobile hamburger */}
      <button
        ref={mobileToggleRef}
        onClick={() => setMobileOpen((v) => !v)}
        className={`md:hidden p-1.5 rounded-lg hover:bg-[#f5f3ef] transition-colors ${focusRing}`}
        aria-label="Toggle navigation"
        aria-expanded={mobileOpen}
        aria-controls="admin-nav-mobile-panel"
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
        <div
          ref={mobilePanelRef}
          id="admin-nav-mobile-panel"
          className="md:hidden absolute top-14 left-0 right-0 bg-white border-b border-[#e8e5df] shadow-sm z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto"
        >
          <nav
            aria-label="Admin"
            className="max-w-7xl mx-auto px-6 py-3 flex flex-col gap-0.5"
          >
            <Link
              href={dashboardLink.href}
              onClick={() => setMobileOpen(false)}
              className={`text-sm px-3 py-2 rounded-lg transition-colors hover:bg-[#f5f3ef] ${focusRing} ${tone(
                dashboardActive
              )}`}
            >
              {dashboardLink.label}
            </Link>

            {navGroups.map((group) => {
              const headingId = `admin-nav-mobile-${group.label.toLowerCase()}`;

              return (
                <div
                  key={group.label}
                  className="mt-2"
                  role="group"
                  aria-labelledby={headingId}
                >
                  <p
                    id={headingId}
                    className="text-[10px] font-medium uppercase tracking-wider text-[#b8b0a4] px-3 pb-1"
                  >
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
                        className={`block text-sm px-3 py-2 rounded-lg transition-colors hover:bg-[#f5f3ef] ${focusRing} ${tone(
                          itemActive
                        )}${itemActive ? " bg-[#f5f3ef]" : ""}`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
