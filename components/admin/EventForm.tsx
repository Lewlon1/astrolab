"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Event } from "@/types";
import AdminInput from "@/components/admin/ui/AdminInput";
import AdminTextarea from "@/components/admin/ui/AdminTextarea";
import AdminSelect from "@/components/admin/ui/AdminSelect";
import AdminToggle from "@/components/admin/ui/AdminToggle";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import Toast from "@/components/admin/ui/Toast";

const EVENT_TYPE_OPTIONS = [
  { value: "workshop", label: "Workshop" },
  { value: "cosmic_tasters", label: "Cosmic Tasters" },
  { value: "collab", label: "Collab" },
  { value: "popup", label: "Pop-up" },
];

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function EventForm({
  initialData,
}: {
  initialData?: Event;
}) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [eventType, setEventType] = useState(initialData?.event_type ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [date, setDate] = useState(initialData?.date ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [price, setPrice] = useState<string>(
    initialData?.price != null ? String(initialData.price) : ""
  );
  const [priceLabel, setPriceLabel] = useState(
    initialData?.price_label ?? ""
  );
  const [capacity, setCapacity] = useState<string>(
    initialData?.capacity != null ? String(initialData.capacity) : ""
  );
  const [eventbriteUrl, setEventbriteUrl] = useState(
    initialData?.eventbrite_url ?? ""
  );
  const [isPublished, setIsPublished] = useState(
    initialData?.is_published ?? false
  );

  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();

    const payload = {
      title,
      event_type: eventType || null,
      description: description || null,
      date: date || null,
      location: location || null,
      price: price ? Number(price) : null,
      price_label: priceLabel || null,
      capacity: capacity ? Number(capacity) : null,
      eventbrite_url: eventbriteUrl || null,
      is_published: isPublished,
    };

    let error;

    if (isEditing) {
      ({ error } = await supabase
        .from("events")
        .update(payload)
        .eq("id", initialData.id));
    } else {
      ({ error } = await supabase
        .from("events")
        .insert({ ...payload, slug: slugify(title) }));
    }

    setSaving(false);

    if (error) {
      setToast({ message: error.message, type: "error" });
    } else {
      router.push("/admin/events");
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!initialData) return;
    setDeleteLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", initialData.id);

    setDeleteLoading(false);
    setDeleteModal(false);

    if (error) {
      setToast({ message: "Failed to delete event", type: "error" });
    } else {
      router.push("/admin/events");
      router.refresh();
    }
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

      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-[#e8e5df] rounded-xl p-6 space-y-5">
          <AdminInput
            label="Title"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <AdminSelect
            label="Event type"
            id="event_type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            options={EVENT_TYPE_OPTIONS}
            placeholder="Select type"
            required
          />

          <AdminTextarea
            label="Description"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
          />

          <AdminInput
            label="Date"
            id="date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <AdminInput
            label="Location"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <AdminInput
              label="Price"
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <AdminInput
              label="Price label"
              id="price_label"
              value={priceLabel}
              onChange={(e) => setPriceLabel(e.target.value)}
              placeholder="e.g. Early bird"
            />
          </div>

          <AdminInput
            label="Capacity"
            id="capacity"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />

          <AdminInput
            label="Eventbrite URL"
            id="eventbrite_url"
            value={eventbriteUrl}
            onChange={(e) => setEventbriteUrl(e.target.value)}
            placeholder="https://..."
          />

          <AdminToggle
            label="Published"
            checked={isPublished}
            onChange={setIsPublished}
          />
        </div>

        <div className="flex items-center justify-between mt-6">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={() => setDeleteModal(true)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete event
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="text-sm font-medium bg-deep text-white px-6 py-2.5 rounded-lg hover:bg-deep/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : isEditing ? "Update event" : "Create event"}
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={deleteModal}
        title="Delete event"
        message={`Are you sure you want to delete "${initialData?.title}"? This cannot be undone.`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
      />
    </>
  );
}
