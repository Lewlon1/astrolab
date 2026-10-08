"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeGroup, activeItem, visibleNavGroups } from "./navConfig";

const groups = visibleNavGroups();

/** Desktop top bar: branding + one dropdown per group. Mobile uses AdminTabBar. */
export default function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const current = activeGroup(pathname, groups);
  const currentItem = activeItem(pathname, groups);

  // Close on navigation, outside click, and Escape.
  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="flex items-center gap-6" ref={ref}>
      {/* Branding */}
      <Link href="/admin" className="flex items-center gap-2.5">
        <span className="font-heading text-lg tracking-wide">ASTRO LAB</span>
        <span className="text-[10px] font-medium uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
          Admin
        </span>
      </Link>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-1">
        {groups.map((group) => {
          const isActive = current === group.label;
          const base = `text-sm px-3 py-1.5 rounded-lg transition-colors ${
            isActive
              ? "text-[#1a1a18] bg-[#f5f3ef] font-medium"
              : "text-[#6b6560] hover:text-[#1a1a18] hover:bg-[#f5f3ef]"
          }`;

          if (group.items.length === 1) {
            return (
              <Link key={group.label} href={group.items[0].href} className={base}>
                {group.label}
              </Link>
            );
          }

          const isOpen = open === group.label;
          return (
            <div key={group.label} className="relative">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : group.label)}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                className={`${base} inline-flex items-center gap-1`}
              >
                {group.label}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
                  <path d="M2 3.5l3 3 3-3" />
                </svg>
              </button>
              {isOpen && (
                <div role="menu" className="absolute left-0 top-full mt-1 min-w-[180px] bg-white border border-[#e8e5df] rounded-xl shadow-sm py-1.5 z-50">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      className={`block text-sm px-3.5 py-2 transition-colors ${
                        currentItem?.href === item.href
                          ? "text-[#1a1a18] font-medium bg-[#f5f3ef]"
                          : "text-[#6b6560] hover:text-[#1a1a18] hover:bg-[#f5f3ef]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
