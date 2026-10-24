"use client";

// Inline form on the profile: add a birth time so rising and houses can be computed.
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PROFILE, PROFILE_EXTRA } from "@/content/lab/ui";
import { BTN_LIGHT, ERROR_LIGHT, INPUT_LIGHT, LABEL } from "./classes";

export default function AddBirthTime() {
  const router = useRouter();
  const [time, setTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/lab/birth-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? PROFILE_EXTRA.timeSaveError);
        return;
      }
      router.refresh();
    } catch {
      setError(PROFILE_EXTRA.timeSaveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-2" noValidate>
      <label htmlFor="lab-add-time" className={LABEL}>
        {PROFILE_EXTRA.timeLabel}
      </label>
      <div className="flex flex-wrap items-start gap-3">
        <input
          id="lab-add-time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "lab-add-time-err" : "lab-add-time-hint"}
          className={`${INPUT_LIGHT} !w-auto min-w-[9rem]`}
        />
        <button type="submit" disabled={saving} className={BTN_LIGHT}>
          {saving ? PROFILE_EXTRA.timeSaving : PROFILE.addTime}
        </button>
      </div>
      <p id="lab-add-time-hint" className="m-0 text-[14px] text-midBrown">
        {PROFILE.risingNoTime} {PROFILE_EXTRA.timeHint}.
      </p>
      {error && (
        <p id="lab-add-time-err" role="alert" className={ERROR_LIGHT}>
          {error}
        </p>
      )}
    </form>
  );
}
