import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import InspirationClient from "@/components/admin/InspirationClient";

export default function InspirationPage() {
  return (
    <>
      <AdminPageHeader
        title="Inspiration Generator"
        description="Discover trending topics and generate content ideas for your brand"
      />
      <InspirationClient />
    </>
  );
}
