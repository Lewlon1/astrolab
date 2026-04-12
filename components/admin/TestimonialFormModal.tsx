"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Testimonial } from "@/types";
import AdminInput from "@/components/admin/ui/AdminInput";
import AdminTextarea from "@/components/admin/ui/AdminTextarea";
import AdminSelect from "@/components/admin/ui/AdminSelect";
import AdminToggle from "@/components/admin/ui/AdminToggle";

interface TestimonialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  testimonial?: Testimonial;
  services: { name: string }[];
}

export default function TestimonialFormModal({
  isOpen,
  onClose,
  testimonial,
  services,
}: TestimonialFormModalProps) {
  const [clientName, setClientName] = useState(testimonial?.client_name ?? "");
  const [serviceName, setServiceName] = useState(
    testimonial?.service_name ?? ""
  );
  const [quote, setQuote] = useState(testimonial?.quote ?? "");
  const [isFeatured, setIsFeatured] = useState(
    testimonial?.is_featured ?? false
  );
  const [saving, setSaving] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  const isEditing = !!testimonial;

  if (!isOpen) return null;

  const serviceOptions = [
    { value: "", label: "None" },
    ...services.map((s) => ({ value: s.name, label: s.name })),
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      client_name: clientName,
      service_name: serviceName || null,
      quote,
      is_featured: isFeatured,
    };

    const { error } = isEditing
      ? await supabase
          .from("testimonials")
          .update(payload)
          .eq("id", testimonial!.id)
      : await supabase.from("testimonials").insert(payload);

    setSaving(false);

    if (!error) {
      onClose();
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white border border-[#e8e5df] rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl">
        <h3 className="font-heading text-lg text-[#1a1a18]">
          {isEditing ? "Edit testimonial" : "Add testimonial"}
        </h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <AdminInput
            id="client_name"
            label="Client name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />

          <AdminSelect
            id="service_name"
            label="Service"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            options={serviceOptions}
          />

          <AdminTextarea
            id="quote"
            label="Quote"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            required
            rows={5}
          />

          <AdminToggle
            label="Featured"
            checked={isFeatured}
            onChange={setIsFeatured}
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="text-sm px-4 py-2 rounded-lg border border-[#e8e5df] text-[#1a1a18] hover:bg-[#f5f3ef] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-sm px-4 py-2 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : isEditing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
