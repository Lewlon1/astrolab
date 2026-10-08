import { notFound } from "next/navigation";
import { isAdminFeatureOn } from "@/lib/admin/features";

export default function PhotoshopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAdminFeatureOn("photoshop")) notFound();

  return (
    <div className="photoshop-dark fixed left-0 right-0 top-14 bottom-0 overflow-hidden">
      {children}
    </div>
  );
}
