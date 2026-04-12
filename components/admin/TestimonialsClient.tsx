"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Testimonial } from "@/types";
import ToggleActiveButton from "@/components/admin/ToggleActiveButton";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import Toast from "@/components/admin/ui/Toast";
import TestimonialFormModal from "@/components/admin/TestimonialFormModal";

interface TestimonialsClientProps {
  testimonials: Testimonial[];
  services: { name: string }[];
}

export default function TestimonialsClient({
  testimonials,
  services,
}: TestimonialsClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  function handleAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function handleEdit(testimonial: Testimonial) {
    setEditing(testimonial);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditing(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", deleteTarget.id);
    setDeleteLoading(false);
    setDeleteTarget(null);
    if (error) {
      setToast({ message: "Failed to delete testimonial.", type: "error" });
    } else {
      setToast({ message: "Testimonial deleted.", type: "success" });
      router.refresh();
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 text-sm font-medium bg-deep text-white px-4 py-2.5 rounded-lg hover:bg-deep/90 transition-colors"
        >
          Add testimonial
        </button>
      </div>

      <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8e5df] text-left text-[#6b6560]">
              <th className="px-4 py-3 font-medium">Client Name</th>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Quote</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {testimonials.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-[#6b6560]"
                >
                  No testimonials yet.
                </td>
              </tr>
            )}
            {testimonials.map((t) => (
              <tr
                key={t.id}
                className="border-b border-[#e8e5df] last:border-0"
              >
                <td className="px-4 py-3 text-[#1a1a18]">{t.client_name}</td>
                <td className="px-4 py-3 text-[#6b6560]">
                  {t.service_name ?? "—"}
                </td>
                <td className="px-4 py-3 text-[#6b6560]">
                  {t.quote.length > 60
                    ? t.quote.slice(0, 60) + "..."
                    : t.quote}
                </td>
                <td className="px-4 py-3">
                  <ToggleActiveButton
                    table="testimonials"
                    id={t.id}
                    field="is_featured"
                    initialValue={t.is_featured}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(t)}
                      className="text-sm text-deep hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(t)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <TestimonialFormModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          testimonial={editing ?? undefined}
          services={services}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete testimonial"
        message={`Are you sure you want to delete the testimonial from "${deleteTarget?.client_name}"? This cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
