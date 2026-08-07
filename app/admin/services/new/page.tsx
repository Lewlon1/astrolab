import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import ServiceForm from "@/components/admin/ServiceForm";

export default function NewServicePage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader title="New Service" />
      <ServiceForm />
    </div>
  );
}
