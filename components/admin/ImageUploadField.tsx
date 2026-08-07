"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "service-images";
const FOLDER = "services";
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ImageUploadFieldProps {
  label?: string;
  value: string | null;
  onChange: (url: string | null) => void;
}

/** Storage object path encoded in a public URL, or null if not from our bucket. */
function storagePath(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export default function ImageUploadField({
  label,
  value,
  onChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function removeObject(url: string) {
    // Best-effort cleanup — a stale object in the bucket is harmless.
    const path = storagePath(url);
    if (!path) return;
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([path]);
  }

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please choose a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${FOLDER}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    if (value) await removeObject(value);
    setUploading(false);
    onChange(data.publicUrl);
  }

  async function handleRemove() {
    if (!value) return;
    await removeObject(value);
    onChange(null);
  }

  return (
    <div>
      {label && (
        <span className="block text-sm font-medium text-[#1a1a18] mb-1.5">
          {label}
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {value && (
        // eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail, no optimization needed
        <img
          src={value}
          alt="Service photo"
          className="w-full max-w-[240px] rounded-lg border border-[#e8e5df] object-cover mb-3"
        />
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-sm px-4 py-2 rounded-lg border border-[#e8e5df] text-[#1a1a18] hover:bg-[#f5f3ef] transition-colors disabled:opacity-50"
        >
          {uploading
            ? "Uploading..."
            : value
              ? "Replace photo"
              : "Upload photo"}
        </button>
        {value && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm text-red-600 hover:underline"
          >
            Remove
          </button>
        )}
      </div>

      <p className="text-xs text-[#b8b0a4] mt-1.5">
        JPEG, PNG or WebP, up to 5 MB.
      </p>
      {error && <p className="text-sm text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}
