/**
 * Admin navigation, grouped by funnel stage (closest to money first).
 * See docs/superpowers/plans/2026-10-08-admin-simplification.md.
 *
 * Desktop renders these as top-bar dropdowns (AdminNav); mobile as a bottom tab
 * bar (AdminTabBar). Keep labels short — they sit under an icon on a phone.
 */
import { isAdminFeatureOn, type AdminFeature } from "@/lib/admin/features";

export type NavIcon = "today" | "notes" | "clients" | "content" | "website" | "insights";

export interface NavItem {
  label: string;
  href: string;
  feature?: AdminFeature;
  /** Other routes that count as this item (e.g. Notes pages live under Today). */
  also?: string[];
}

export interface NavGroup {
  label: string;
  icon: NavIcon;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  // Notes is reached from the top of Today (snap / review buttons), not its own tab.
  { label: "Today", icon: "today", items: [{ label: "Today", href: "/admin", also: ["/admin/notes"] }] },
  {
    label: "Clients",
    icon: "clients",
    items: [
      { label: "Lead Queue", href: "/admin/lead-queue" },
      { label: "Bookings", href: "/admin/bookings" },
      { label: "Leads", href: "/admin/leads" },
    ],
  },
  {
    label: "Content",
    icon: "content",
    items: [
      { label: "Engagement", href: "/admin/engagement" },
      { label: "Transits", href: "/admin/transits" },
      { label: "Inspiration", href: "/admin/inspiration" },
      { label: "Repurpose", href: "/admin/repurpose" },
      { label: "Video Editor", href: "/admin/video-editor", feature: "videoEditor" },
      { label: "Photoshop", href: "/admin/photoshop", feature: "photoshop" },
    ],
  },
  {
    label: "Website",
    icon: "website",
    items: [
      { label: "Services & prices", href: "/admin/services" },
      { label: "Blog", href: "/admin/blog" },
      { label: "Events", href: "/admin/events" },
      { label: "Testimonials", href: "/admin/testimonials" },
    ],
  },
  {
    label: "Insights",
    icon: "insights",
    items: [
      { label: "Analytics", href: "/admin/analytics" },
      { label: "Lab signal", href: "/admin/lab-signal" },
    ],
  },
];

/** Groups with flag-gated items removed; groups left empty are dropped. */
export function visibleNavGroups(
  labsFlag: string | undefined = process.env.NEXT_PUBLIC_ADMIN_LABS
): NavGroup[] {
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.feature || isAdminFeatureOn(i.feature, labsFlag)),
  })).filter((g) => g.items.length > 0);
}

function matchesHref(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function matches(pathname: string, item: NavItem): boolean {
  return [item.href, ...(item.also ?? [])].some((h) => matchesHref(pathname, h));
}

/** The item for the current path (e.g. /admin/blog/123 → Blog), or null. */
export function activeItem(pathname: string, groups: NavGroup[]): NavItem | null {
  for (const g of groups) {
    const item = g.items.find((i) => matches(pathname, i));
    if (item) return item;
  }
  return null;
}

/** The group label for the current path, or null. */
export function activeGroup(pathname: string, groups: NavGroup[]): string | null {
  for (const g of groups) {
    if (g.items.some((i) => matches(pathname, i))) return g.label;
  }
  return null;
}
