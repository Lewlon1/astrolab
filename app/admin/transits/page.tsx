import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import TransitsClient from "@/components/admin/transits/TransitsClient";

export default function TransitsPage() {
  return (
    <>
      <AdminPageHeader
        title="Transit Planner"
        description="Browse upcoming transits, draft single posts, and generate sign-by-sign horoscope bundles"
      />
      <TransitsClient />
    </>
  );
}
