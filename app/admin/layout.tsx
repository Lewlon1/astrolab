import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/admin/SignOutButton";
import Link from "next/link";

const navLinks = [
  { label: "Dashboard", href: "/admin" },
  { label: "Services", href: "/admin/services" },
  { label: "Blog", href: "/admin/blog" },
  { label: "Testimonials", href: "/admin/testimonials" },
  { label: "Events", href: "/admin/events" },
  { label: "Leads", href: "/admin/leads" },
  { label: "Repurpose", href: "/admin/repurpose" },
  { label: "Engagement", href: "/admin/engagement" },
  { label: "Inspiration", href: "/admin/inspiration" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No user = login page (middleware allows /admin/login through)
  if (!user) {
    return <div className="admin-theme min-h-screen">{children}</div>;
  }

  return (
    <div className="admin-theme min-h-screen">
      {/* Top bar */}
      <header className="bg-white border-b border-[#e8e5df]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left: branding + nav */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <span className="font-heading text-lg tracking-wide">
                ASTRO LAB
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                Admin
              </span>
            </div>

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
          </div>

          {/* Right: sign out */}
          <SignOutButton />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
