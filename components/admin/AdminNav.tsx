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
