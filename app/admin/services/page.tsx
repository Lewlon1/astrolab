import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Service } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import ToggleActiveButton from "@/components/admin/ToggleActiveButton";

export default async function AdminServicesPage() {
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .order("sort_order")
    .returns<Service[]>();

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Services" />

      <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
        {services && services.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8e5df] text-left">
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Tag
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Active
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ede8]">
              {services.map((service) => (
                <tr
                  key={service.id}
                  className="group hover:bg-[#f5f3ef] transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/services/${service.id}`}
                      className="text-sm font-medium text-[#1a1a18] hover:underline"
                    >
                      {service.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6b6560]">
                    {service.price_label ?? (service.price != null ? `£${service.price}` : "—")}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6b6560]">
                    {service.duration ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    {service.tag ? (
                      <span className="inline-block text-xs px-2.5 py-0.5 rounded-full bg-deep/10 text-deep font-medium">
                        {service.tag}
                      </span>
                    ) : (
                      <span className="text-sm text-[#b8b0a4]">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <ToggleActiveButton
                      table="services"
                      id={service.id}
                      field="is_active"
                      initialValue={service.is_active}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-[#b8b0a4]">
              No services found. Add your first service to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
