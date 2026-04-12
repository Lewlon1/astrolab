"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Service } from "@/types";
import AdminInput from "@/components/admin/ui/AdminInput";
import AdminTextarea from "@/components/admin/ui/AdminTextarea";
import AdminToggle from "@/components/admin/ui/AdminToggle";
import Toast from "@/components/admin/ui/Toast";
import ServiceCard from "@/components/ServiceCard";

interface ServiceEditFormProps {
  initialData: Service;
}

export default function ServiceEditForm({ initialData }: ServiceEditFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(initialData.name);
  const [price, setPrice] = useState<string>(
    initialData.price != null ? String(initialData.price) : ""
  );
  const [priceLabel, setPriceLabel] = useState(initialData.price_label ?? "");
  const [duration, setDuration] = useState(initialData.duration ?? "");
  const [description, setDescription] = useState(
    initialData.description ?? ""
  );
  const [shortDescription, setShortDescription] = useState(
    initialData.short_description ?? ""
  );
  const [tag, setTag] = useState(initialData.tag ?? "");
  const [calendlyUrl, setCalendlyUrl] = useState(
    initialData.calendly_url ?? ""
  );
  const [sortOrder, setSortOrder] = useState<string>(
    String(initialData.sort_order)
  );
  const [isActive, setIsActive] = useState(initialData.is_active);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const previewService: Service = {
    ...initialData,
    name,
    price: price !== "" ? Number(price) : null,
    price_label: priceLabel || null,
    duration: duration || null,
    description: description || null,
    short_description: shortDescription || null,
    tag: tag || null,
    calendly_url: calendlyUrl || null,
    sort_order: Number(sortOrder) || 0,
    is_active: isActive,
  };

  async function handleSave() {
    setSaving(true);

    const { error } = await supabase
      .from("services")
      .update({
        name,
        price: price !== "" ? Number(price) : null,
        price_label: priceLabel || null,
        duration: duration || null,
        description: description || null,
        short_description: shortDescription || null,
        tag: tag || null,
        calendly_url: calendlyUrl || null,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
      })
      .eq("id", initialData.id);

    setSaving(false);

    if (error) {
      setToast({ message: "Failed to save service", type: "error" });
      return;
    }

    setToast({ message: "Service updated", type: "success" });
    setTimeout(() => router.push("/admin/services"), 600);
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="grid lg:grid-cols-[1fr,380px] gap-8">
        {/* Left column — form */}
        <div className="bg-white border border-[#e8e5df] rounded-xl p-6 space-y-5">
          <AdminInput
            label="Name"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid sm:grid-cols-2 gap-5">
            <AdminInput
              label="Price"
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
            />
            <AdminInput
              label="Price label"
              id="price_label"
              value={priceLabel}
              onChange={(e) => setPriceLabel(e.target.value)}
              placeholder="e.g. £85"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <AdminInput
              label="Duration"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 60 mins"
            />
            <AdminInput
              label="Tag"
              id="tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. Most popular"
            />
          </div>

          <AdminTextarea
            label="Description"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />

          <AdminTextarea
            label="Short description"
            id="short_description"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            rows={3}
          />

          <AdminInput
            label="Calendly URL"
            id="calendly_url"
            value={calendlyUrl}
            onChange={(e) => setCalendlyUrl(e.target.value)}
            placeholder="https://calendly.com/..."
          />

          <div className="grid sm:grid-cols-2 gap-5 items-end">
            <AdminInput
              label="Sort order"
              id="sort_order"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
            <AdminToggle
              label="Active"
              checked={isActive}
              onChange={setIsActive}
            />
          </div>

          <div className="pt-4 border-t border-[#e8e5df]">
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="bg-deep text-white px-6 py-2.5 rounded-lg hover:bg-deep/90 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        {/* Right column — preview */}
        <div className="lg:sticky lg:top-8 self-start space-y-3">
          <p className="text-sm font-medium text-[#6b6560]">Preview</p>
          <div className="bg-midnight rounded-xl p-8">
            <ServiceCard service={previewService} />
          </div>
        </div>
      </div>
    </>
  );
}
