import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/admin/SignOutButton";
import AdminNav from "@/components/admin/AdminNav";
import AdminTabBar from "@/components/admin/AdminTabBar";

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
      <header className="relative bg-white border-b border-[#e8e5df]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left: branding + nav */}
          <AdminNav />

          {/* Right: sign out */}
          <SignOutButton />
        </div>
      </header>

      {/* Content — extra bottom padding on mobile so the tab bar never covers it */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-28 md:pb-8">{children}</div>

      <AdminTabBar />
    </div>
  );
}
