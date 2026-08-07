"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Lang } from "@/context/LangContext";
import type { Service } from "@/types";
import { bookingForSlug } from "@/lib/booking";
import {
  localizeService,
  SERVICE_CARD_LABELS,
} from "@/lib/services";
import AdminInput from "@/components/admin/ui/AdminInput";
import AdminTextarea from "@/components/admin/ui/AdminTextarea";
import AdminToggle from "@/components/admin/ui/AdminToggle";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import Toast from "@/components/admin/ui/Toast";
import ImageUploadField from "@/components/admin/ImageUploadField";
import ServiceRowCard from "@/components/services/ServiceRowCard";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const ES_PLACEHOLDER = "Leave empty to reuse English";

export default function ServiceForm({
  initialData,
}: {
  initialData?: Service;
}) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [name, setName] = useState(initialData?.name ?? "");
  const [nameEs, setNameEs] = useState(initialData?.name_es ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [tag, setTag] = useState(initialData?.tag ?? "");
  const [tagEs, setTagEs] = useState(initialData?.tag_es ?? "");
  const [price, setPrice] = useState<string>(
    initialData?.price != null ? String(initialData.price) : ""
  );
  const [priceLabel, setPriceLabel] = useState(initialData?.price_label ?? "");
  const [priceLabelEs, setPriceLabelEs] = useState(
    initialData?.price_label_es ?? ""
  );
  const [duration, setDuration] = useState(initialData?.duration ?? "");
  const [durationEs, setDurationEs] = useState(initialData?.duration_es ?? "");
  const [shortDescription, setShortDescription] = useState(
    initialData?.short_description ?? ""
  );
  const [shortDescriptionEs, setShortDescriptionEs] = useState(
    initialData?.short_description_es ?? ""
  );
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [descriptionEs, setDescriptionEs] = useState(
    initialData?.description_es ?? ""
  );
  const [bookingUrl, setBookingUrl] = useState(initialData?.booking_url ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialData?.image_url ?? null
  );
  const [sortOrder, setSortOrder] = useState<string>(
    String(initialData?.sort_order ?? 0)
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  const [slugEdited, setSlugEdited] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewLang, setPreviewLang] = useState<Lang>("en");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Auto-generate slug from name until manually edited (create mode only)
  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name));
  }, [name, slugEdited]);

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSlugEdited(true);
      setSlug(e.target.value);
    },
    []
  );

  const hasBuiltInBooking = !!bookingForSlug(slug);

  const previewService: Service = {
    id: initialData?.id ?? "preview",
    name: name || "Service name",
    slug,
    price: price !== "" ? Number(price) : null,
    price_label: priceLabel || null,
    duration: duration || null,
    description: description || null,
    short_description: shortDescription || null,
    tag: tag || null,
    calendly_url: initialData?.calendly_url ?? null,
    sort_order: Number(sortOrder) || 0,
    is_active: isActive,
    created_at: initialData?.created_at ?? "",
    updated_at: initialData?.updated_at ?? "",
    booking_url: bookingUrl || null,
    image_url: imageUrl,
    name_es: nameEs || null,
    tag_es: tagEs || null,
    short_description_es: shortDescriptionEs || null,
    description_es: descriptionEs || null,
    price_label_es: priceLabelEs || null,
    duration_es: durationEs || null,
  };

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    const payload = {
      name,
      slug,
      price: price !== "" ? Number(price) : null,
      price_label: priceLabel || null,
      duration: duration || null,
      description: description || null,
      short_description: shortDescription || null,
      tag: tag || null,
      sort_order: Number(sortOrder) || 0,
      is_active: isActive,
      booking_url: bookingUrl.trim() || null,
      image_url: imageUrl,
      name_es: nameEs || null,
      tag_es: tagEs || null,
      short_description_es: shortDescriptionEs || null,
      description_es: descriptionEs || null,
      price_label_es: priceLabelEs || null,
      duration_es: durationEs || null,
    };

    if (isEditing) {
      const { error } = await supabase
        .from("services")
        .update(payload)
        .eq("id", initialData.id);

      setSaving(false);
      if (error) {
        setToast({ message: error.message, type: "error" });
        return;
      }
      setToast({ message: "Service updated", type: "success" });
      setTimeout(() => {
        router.push("/admin/services");
        router.refresh();
      }, 600);
    } else {
      const { data, error } = await supabase
        .from("services")
        .insert(payload)
        .select("id")
        .single();

      setSaving(false);
      if (error) {
        setToast({ message: error.message, type: "error" });
        return;
      }
      setToast({ message: "Service created", type: "success" });
      setTimeout(() => {
        router.replace(`/admin/services/${data.id}`);
        router.refresh();
      }, 600);
    }
  }

  async function handleDelete() {
    if (!initialData) return;
    setDeleteLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", initialData.id);

    setDeleteLoading(false);
    setDeleteModal(false);

    if (error) {
      setToast({ message: error.message, type: "error" });
      return;
    }
    router.push("/admin/services");
    router.refresh();
  }

  const labels = SERVICE_CARD_LABELS[previewLang];

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmModal
        isOpen={deleteModal}
        title="Delete service"
        message={`Are you sure you want to delete "${name}"? This cannot be undone.${
          isEditing && bookingForSlug(initialData.slug)
            ? " This is one of the original bookable services."
            : ""
        }`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
      />

      <div className="grid lg:grid-cols-[1fr,380px] gap-8">
        {/* Left column — form */}
        <div className="space-y-6">
          {/* Identity */}
          <div className="bg-white border border-[#e8e5df] rounded-xl p-6 space-y-5">
            <h2 className="font-heading text-lg text-[#1a1a18]">Identity</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <AdminInput
                label="Name"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <AdminInput
                label="Name (ES)"
                id="name_es"
                value={nameEs}
                onChange={(e) => setNameEs(e.target.value)}
                placeholder={ES_PLACEHOLDER}
              />
            </div>
            <div>
              <AdminInput
                label="Slug"
                id="slug"
                value={slug}
                onChange={handleSlugChange}
                required
              />
              <p className="text-xs text-[#b8b0a4] mt-1.5">
                Used in links and analytics.
                {isEditing && bookingForSlug(initialData.slug)
                  ? " Changing the slug of one of the five original services disconnects its built-in booking button."
                  : ""}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <AdminInput
                label="Tag"
                id="tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. Most popular"
              />
              <AdminInput
                label="Tag (ES)"
                id="tag_es"
                value={tagEs}
                onChange={(e) => setTagEs(e.target.value)}
                placeholder={ES_PLACEHOLDER}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white border border-[#e8e5df] rounded-xl p-6 space-y-5">
            <h2 className="font-heading text-lg text-[#1a1a18]">Pricing</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <AdminInput
                label="Price"
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <AdminInput
                label="Price label"
                id="price_label"
                value={priceLabel}
                onChange={(e) => setPriceLabel(e.target.value)}
                placeholder="e.g. €65"
              />
              <AdminInput
                label="Price label (ES)"
                id="price_label_es"
                value={priceLabelEs}
                onChange={(e) => setPriceLabelEs(e.target.value)}
                placeholder={ES_PLACEHOLDER}
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
                label="Duration (ES)"
                id="duration_es"
                value={durationEs}
                onChange={(e) => setDurationEs(e.target.value)}
                placeholder={ES_PLACEHOLDER}
              />
            </div>
          </div>

          {/* Copy */}
          <div className="bg-white border border-[#e8e5df] rounded-xl p-6 space-y-5">
            <h2 className="font-heading text-lg text-[#1a1a18]">Copy</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <AdminTextarea
                label="Short description"
                id="short_description"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={3}
              />
              <AdminTextarea
                label="Short description (ES)"
                id="short_description_es"
                value={shortDescriptionEs}
                onChange={(e) => setShortDescriptionEs(e.target.value)}
                rows={3}
                placeholder={ES_PLACEHOLDER}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <AdminTextarea
                label="Description"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
              <AdminTextarea
                label="Description (ES)"
                id="description_es"
                value={descriptionEs}
                onChange={(e) => setDescriptionEs(e.target.value)}
                rows={5}
                placeholder={ES_PLACEHOLDER}
              />
            </div>
          </div>

          {/* Booking */}
          <div className="bg-white border border-[#e8e5df] rounded-xl p-6 space-y-5">
            <h2 className="font-heading text-lg text-[#1a1a18]">Booking</h2>
            <div>
              <AdminInput
                label="Booking link"
                id="booking_url"
                value={bookingUrl}
                onChange={(e) => setBookingUrl(e.target.value)}
                placeholder="https://cal.com/... or https://book.stripe.com/..."
              />
              <p className="text-xs text-[#b8b0a4] mt-1.5">
                Paste a Cal.com event link or Stripe Payment Link — the public
                Book button opens it in a new tab. If empty and no built-in
                booking exists, the button is hidden.
              </p>
              {hasBuiltInBooking && (
                <p className="text-xs text-green-700 mt-1.5">
                  ✓ This slug has built-in Cal.com/Stripe booking configured in
                  the site code; it takes precedence over the link above.
                </p>
              )}
            </div>
          </div>

          {/* Photo */}
          <div className="bg-white border border-[#e8e5df] rounded-xl p-6 space-y-5">
            <h2 className="font-heading text-lg text-[#1a1a18]">Photo</h2>
            <ImageUploadField value={imageUrl} onChange={setImageUrl} />
          </div>

          {/* Settings */}
          <div className="bg-white border border-[#e8e5df] rounded-xl p-6 space-y-5">
            <h2 className="font-heading text-lg text-[#1a1a18]">Settings</h2>
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
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !name.trim() || !slug.trim()}
              className="bg-deep text-white px-6 py-2.5 rounded-lg hover:bg-deep/90 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Create service"}
            </button>
            {isEditing && (
              <button
                onClick={() => setDeleteModal(true)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete service
              </button>
            )}
          </div>
        </div>

        {/* Right column — live preview */}
        <div className="lg:sticky lg:top-8 self-start space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#6b6560]">Preview</p>
            <div className="flex rounded-lg border border-[#e8e5df] overflow-hidden">
              {(["en", "es"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setPreviewLang(lang)}
                  className={`px-3 py-1 text-xs font-medium uppercase transition-colors ${
                    previewLang === lang
                      ? "bg-deep text-white"
                      : "bg-white text-[#6b6560] hover:bg-[#f5f3ef]"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div
            className="rounded-xl p-6 pointer-events-none select-none"
            style={{ background: "var(--ed-paper)" }}
          >
            <ServiceRowCard
              item={localizeService(previewService, previewLang)}
              index={1}
              labels={labels}
            />
          </div>
        </div>
      </div>
    </>
  );
}
