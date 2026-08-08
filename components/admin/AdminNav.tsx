"use client";

import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { label: "Dashboard", href: "/admin" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Services", href: "/admin/services" },
  { label: "Blog", href: "/admin/blog" },
  { label: "Testimonials", href: "/admin/testimonials" },
  { label: "Events", href: "/admin/events" },
  { label: "Leads", href: "/admin/leads" },
  { label: "Lead Queue", href: "/admin/lead-queue" },
  { label: "Repurpose", href: "/admin/repurpose" },
  { label: "Engagement", href: "/admin/engagement" },
  { label: "Inspiration", href: "/admin/inspiration" },
  { label: "Transits", href: "/admin/transits" },
  { label: "Video Editor", href: "/admin/video-editor" },
  { label: "Photoshop", href: "/admin/photoshop" },
];

export default function AdminNav() {
  const [open, setOpen] = useState(false);

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
      <nav className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-[#6b6560] hover:text-[#1a1a18] hover:bg-[#f5f3ef] px-3 py-1.5 rounded-lg transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="md:hidden p-1.5 rounded-lg hover:bg-[#f5f3ef] transition-colors"
        aria-label="Toggle navigation"
      >
        {open ? (
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
      {open && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-white border-b border-[#e8e5df] shadow-sm z-50">
          <nav className="max-w-7xl mx-auto px-6 py-3 flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm text-[#6b6560] hover:text-[#1a1a18] hover:bg-[#f5f3ef] px-3 py-2 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
