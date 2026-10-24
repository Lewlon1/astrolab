import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth/admin";
import SignOutButton from "@/components/admin/SignOutButton";
import AdminNav from "@/components/admin/AdminNav";

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
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left: branding + nav */}
          <AdminNav />

          {/* Right: sign out */}
          <SignOutButton />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
