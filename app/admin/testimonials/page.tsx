import { createClient } from "@/lib/supabase/server";
import { Testimonial } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import TestimonialsClient from "@/components/admin/TestimonialsClient";

export default async function TestimonialsPage() {
  const supabase = await createClient();

  const [{ data: testimonials }, { data: services }] = await Promise.all([
    supabase
      .from("testimonials")
      .select("*")
      .order("sort_order")
      .returns<Testimonial[]>(),
    supabase
      .from("services")
      .select("name")
      .eq("is_active", true)
      .returns<{ name: string }[]>(),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Testimonials" />
      <TestimonialsClient
        testimonials={testimonials ?? []}
        services={services ?? []}
      />
    </div>
  );
}
