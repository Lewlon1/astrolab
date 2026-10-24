import { notFound } from "next/navigation";
import { isAdminFeatureOn } from "@/lib/admin/features";

export default function VideoEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAdminFeatureOn("videoEditor")) notFound();

  return (
    <div className="premiere-dark fixed left-0 right-0 top-14 bottom-0 overflow-hidden">
      {children}
    </div>
  );
}
