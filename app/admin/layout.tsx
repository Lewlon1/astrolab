import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth/admin";
import SignOutButton from "@/components/admin/SignOutButton";
import AdminNav from "@/components/admin/AdminNav";
import AdminTabBar from "@/components/admin/AdminTabBar";
import type { Metadata, Viewport } from "next";

// Gabs runs admin from her iPhone home screen. These make it open full-screen like an
// app (after re-adding it to the home screen) and let the tab bar read the
// home-indicator safe area (env(safe-area-inset-*) is 0 without viewport-fit=cover).
// The manifest is not under /admin: middleware would redirect the (cookie-less)
// manifest fetch to the login page.
export const metadata: Metadata = {
  title: "Lab Admin",
  manifest: "/lab-admin.webmanifest",
  appleWebApp: { capable: true, title: "Lab Admin", statusBarStyle: "default" },
  icons: { apple: "/admin-icons/icon-180.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fafaf8",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { isAdmin } = await getAdminUser(supabase);

  // Non-admin (or no user) = login page (middleware allows /admin/login through)
  if (!isAdmin) {
    return <div className="admin-theme min-h-screen">{children}</div>;
  }

  return (
    <div className="admin-theme min-h-screen">
      {/* Top bar */}
      <header className="relative bg-white border-b border-[#e8e5df]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          {/* Left: branding + nav */}
          <AdminNav />

          {/* Right: sign out */}
          <SignOutButton />
        </div>
      </header>

      {/* Content — extra bottom padding on mobile so the tab bar never covers it */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-8 pb-28 md:pb-8">{children}</div>

      <AdminTabBar />
    </div>
  );
}
