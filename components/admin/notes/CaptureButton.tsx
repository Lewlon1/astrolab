"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { shrinkImage } from "@/lib/notes/shrink";

const MAX_PAGES = 6;
const BUCKET = "note-photos";

type Page = { file: File; url: string };

function localDate(): string {
  return new Date().toLocaleDateString("en-CA"); // yyyy-mm-dd, the phone's own day
}

async function postJson(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json: unknown = null;
  let isJson = true;
  try {
    json = await res.json();
  } catch {
    isJson = false;
  }
  if (typeof json !== "object" || json === null) {
    isJson = false;
    json = {};
  }
  return { res, isJson, json: json as { capture_id?: string; ok?: boolean; error?: string } };
}

/**
 * "Snap a page": collect up to six photos, shrink them, upload straight to
 * storage, then ask the API to read them. Photos never pass through the API body.
 */
export default function CaptureButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Free preview URLs when the component goes away.
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  useEffect(() => () => pagesRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    setNotice(null);
    const files = Array.from(list);
    const images = files.filter((f) => f.type.startsWith("image/"));
    const room = MAX_PAGES - pages.length;
    const taken = images.slice(0, Math.max(0, room));
    const notes: string[] = [];
    if (images.length < files.length) notes.push("Only photos can be added.");
    if (images.length > taken.length) notes.push(`Up to ${MAX_PAGES} pages at a time.`);
    if (notes.length) setNotice(notes.join(" "));
    setPages((prev) => [...prev, ...taken.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  }

  function removePage(i: number) {
    setPages((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, j) => j !== i);
    });
    setNotice(null);
  }

  function clearPages() {
    pages.forEach((p) => URL.revokeObjectURL(p.url));
    setPages([]);
  }

  async function send() {
    if (!pages.length || sending) return;
    setSending(true);
    setError(null);
    setNotice(null);

    // 1. Shrink and upload. If this fails nothing exists yet — keep the pages.
    let paths: string[];
    try {
      const supabase = createClient();
      const day = localDate();
      const id = crypto.randomUUID();
      paths = [];
      for (let n = 0; n < pages.length; n++) {
        const blob = await shrinkImage(pages[n].file);
        const path = `captures/${day}/${id}-${n + 1}.jpg`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (upErr) throw new Error(upErr.message);
        paths.push(path);
      }
    } catch (err) {
      setError(
        `Couldn't upload the photos: ${err instanceof Error ? err.message : "unknown error"}. Your pages are still here — try Send again.`
      );
      setSending(false);
      return;
    }

    // 2. Ask the API to read them. From here the photos are safe in storage.
    // Never invite a re-send once a capture may exist — that would duplicate it.
    const mayStillBeReading =
      "It may still be reading — check below in a few minutes. If it says it couldn't read the page, tap Try again.";
    try {
      const { res, json, isJson } = await postJson("/api/admin/notes/captures", { photo_paths: paths });
      if (json.capture_id) {
        // The capture exists: success, or a failed capture with Try again below.
        clearPages();
        if (!json.ok) setError(`Couldn't read the page: ${json.error ?? "unknown error"}. Your photos are saved — tap Try again below.`);
      } else if (!isJson || res.status === 502 || res.status === 504) {
        // A gateway timeout or platform error page: the capture may well exist.
        clearPages();
        setNotice(mayStillBeReading);
      } else {
        // Our own JSON error before the capture was created: safe to send again.
        setError(json.error ?? `Something went wrong (${res.status}). Try Send again.`);
      }
    } catch {
      // The connection dropped mid-request: the server may still be reading.
      clearPages();
      setNotice(mayStillBeReading);
    } finally {
      setSending(false);
      router.refresh();
    }
  }

  return (
    <section className="bg-white border border-[#e8e5df] rounded-xl p-4 sm:p-5 space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = ""; // let the same photo be picked again
        }}
      />

      {pages.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white text-base font-medium py-4 rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:opacity-60"
        >
          <CameraIcon />
          Snap a page
        </button>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            {pages.map((p, i) => (
              <div key={p.url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img
                  src={p.url}
                  alt={`Page ${i + 1}`}
                  className="w-20 h-28 object-cover rounded-lg border border-[#e8e5df]"
                />
                {!sending && (
                  <button
                    type="button"
                    onClick={() => removePage(i)}
                    aria-label={`Remove page ${i + 1}`}
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border border-[#e8e5df] text-[#6b6560] text-sm shadow-sm"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
            {pages.length < MAX_PAGES && !sending && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-20 h-28 rounded-lg border border-dashed border-[#d6d1c8] text-[#6b6560] text-xs flex flex-col items-center justify-center gap-1"
              >
                <span className="text-xl leading-none">+</span>
                Add page
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={send}
              disabled={sending}
              className="flex-1 bg-emerald-600 text-white text-base font-medium py-3.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {sending ? "Reading your page…" : `Send ${pages.length === 1 ? "page" : `${pages.length} pages`}`}
            </button>
            {!sending && (
              <button
                type="button"
                onClick={() => {
                  clearPages();
                  setNotice(null);
                  setError(null);
                }}
                className="text-sm text-[#6b6560] px-3 py-3.5"
              >
                Cancel
              </button>
            )}
          </div>
          {sending && (
            <p className="text-sm text-[#6b6560]">This can take up to a minute. Keep this page open.</p>
          )}
        </>
      )}

      {notice && <p className="text-sm text-[#6b6560]">{notice}</p>}
      {error && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </section>
  );
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}

/** Captures still being read, or that failed (with Try again). */
export function PendingCaptures({
  captures,
}: {
  captures: { id: string; status: "processing" | "failed"; error: string | null; created_at: string; pages: number }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!captures.length) return null;

  async function retry(id: string) {
    setBusy(id);
    setError(null);
    try {
      const { res, json } = await postJson(`/api/admin/notes/captures/${id}/retry`);
      if (res.status === 409) setError("That page is already being read.");
      else if (!res.ok || !json.ok) setError(`Still couldn't read it: ${json.error ?? `error ${res.status}`}`);
    } catch {
      setError("Lost the connection. Check again in a minute.");
    } finally {
      setBusy(null);
      router.refresh();
    }
  }

  return (
    <section className="space-y-2">
      {captures.map((c) => {
        const when = new Date(c.created_at).toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });
        const label = `${c.pages} ${c.pages === 1 ? "page" : "pages"} · ${when}`;
        const reading = busy === c.id || c.status === "processing";
        return (
          <div
            key={c.id}
            className={`rounded-xl border p-4 flex items-center justify-between gap-3 ${
              c.status === "failed" && busy !== c.id ? "bg-red-50/60 border-red-200" : "bg-[#f5f3ef] border-[#e8e5df]"
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1a1a18]">
                {reading ? "Reading your page…" : "Couldn't read this page"}
              </p>
              <p className="text-xs text-[#6b6560] truncate">
                {label}
                {!reading && c.error ? ` · ${c.error}` : ""}
              </p>
            </div>
            {busy === c.id ? null : c.status === "failed" ? (
              <button
                type="button"
                onClick={() => retry(c.id)}
                disabled={busy !== null}
                className="shrink-0 text-sm font-medium bg-white border border-[#e8e5df] text-[#1a1a18] px-3 py-2 rounded-lg disabled:opacity-60"
              >
                Try again
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.refresh()}
                className="shrink-0 text-sm text-[#6b6560] px-3 py-2"
              >
                Check
              </button>
            )}
          </div>
        );
      })}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </section>
  );
}
