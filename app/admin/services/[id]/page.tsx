import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Service } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import ServiceForm from "@/components/admin/ServiceForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminServiceEditPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single<Service>();

  if (!service) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Edit Service" />
      <ServiceForm initialData={service} />
    </div>
  );
}
