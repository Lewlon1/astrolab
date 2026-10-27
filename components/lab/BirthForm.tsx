"use client";

import { forwardRef, useEffect, useRef, useState, type FormEvent } from "react";
import { BIRTH, BIRTH_EXTRA, ERRORS, OSM_ATTRIBUTION, PLACE_PICK } from "@/content/lab/ui";
import { BTN_LIGHT, ERROR_LIGHT, FOCUS, INPUT_LIGHT, LABEL, LABEL_ASIDE, cx } from "./classes";

export type BirthValues = { date: string; place: string; time: string };

/** A place the geocoder offered, and the visitor can pick. */
export type PlaceChoice = { label: string; displayName: string; lat: number; lon: number };

/** A field-specific error (field is "date" | "place" | "time") or a general one (no field). */
export type FormError = { field?: string; message: string } | null;

type Props = {
  /** `choice` is set when the visitor picked one of `choices`. */
  onSubmit: (values: BirthValues, choice?: PlaceChoice) => void;
  error: FormError;
  submitting: boolean;
  /** Candidate places for an ambiguous name; null when there is nothing to pick. */
  choices: PlaceChoice[] | null;
  /** The visitor edited the place text, so any offered choices are stale. */
  onPlaceEdit: () => void;
};

const FIELDS = ["date", "place", "time"] as const;

/** Birth data form. The date input is the forwarded ref, so the parent can focus it on reveal. */
const BirthForm = forwardRef<HTMLInputElement, Props>(function BirthForm({ onSubmit, error, submitting, choices, onPlaceEdit }, dateRef) {
  const [values, setValues] = useState<BirthValues>({ date: "", place: "", time: "" });
  const [localError, setLocalError] = useState<FormError>(null);

  // A local (pre-submit) error wins until the next submit; otherwise show the server's.
  const shown = localError ?? error;
  const fieldError = (f: string) => (shown?.field === f ? shown.message : null);
  const generalError = shown && !FIELDS.some((f) => f === shown.field) ? shown.message : null;

  const today = new Date().toISOString().slice(0, 10);

  const firstChoice = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (choices) firstChoice.current?.focus();
  }, [choices]);

  const set = (k: keyof BirthValues) => (e: { target: { value: string } }) => {
    if (k === "place") onPlaceEdit();
    setValues((v) => ({ ...v, [k]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const place = values.place.trim();
    if (!values.date) return setLocalError({ field: "date", message: ERRORS.dateMissing });
    if (!place) return setLocalError({ field: "place", message: ERRORS.placeMissing });
    setLocalError(null);
    onSubmit({ date: values.date, place, time: values.time });
  };

  const describedBy = (f: string, hint?: string) => cx(hint, fieldError(f) ? `lab-${f}-err` : undefined) || undefined;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="grid max-w-[560px] grid-cols-1 gap-x-[18px] gap-y-4 sm:grid-cols-2"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <label htmlFor="lab-date" className={LABEL}>
          {BIRTH.dateLabel}
        </label>
        <input
          ref={dateRef}
          id="lab-date"
          type="date"
          required
          min="1900-01-01"
          max={today}
          value={values.date}
          onChange={set("date")}
          aria-invalid={fieldError("date") ? true : undefined}
          aria-describedby={describedBy("date")}
          className={INPUT_LIGHT}
        />
        {fieldError("date") && (
          <p id="lab-date-err" role="alert" className={ERROR_LIGHT}>
            {fieldError("date")}
          </p>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <label htmlFor="lab-place" className={LABEL}>
          {BIRTH.placeLabel}
        </label>
        <input
          id="lab-place"
          type="text"
          required
          autoComplete="off"
          maxLength={120}
          placeholder={BIRTH.placePlaceholder}
          value={values.place}
          onChange={set("place")}
          aria-invalid={fieldError("place") ? true : undefined}
          aria-describedby={describedBy("place", "lab-place-hint lab-place-osm")}
          className={INPUT_LIGHT}
        />
        <span id="lab-place-hint" className="text-[13px] text-midBrown">
          {BIRTH_EXTRA.placeHint}
        </span>
        <span id="lab-place-osm" className="text-[12px] text-midBrown">
          {OSM_ATTRIBUTION.before}
          <a
            href={OSM_ATTRIBUTION.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-coral2"
          >
            {OSM_ATTRIBUTION.linkLabel}
          </a>
        </span>
        {fieldError("place") && (
          <p id="lab-place-err" role="alert" className={ERROR_LIGHT}>
            {fieldError("place")}
          </p>
        )}
      </div>

      {choices && (
        <div role="group" aria-labelledby="lab-place-pick" className="flex min-w-0 flex-col gap-2 sm:col-span-2">
          <p id="lab-place-pick" className={LABEL}>
            {PLACE_PICK.title}
          </p>
          <p className="m-0 text-[14px] text-midBrown">{PLACE_PICK.hint}</p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {choices.map((c, i) => (
              <li key={`${c.lat},${c.lon}`}>
                <button
                  ref={i === 0 ? firstChoice : undefined}
                  type="button"
                  disabled={submitting}
                  onClick={() => onSubmit({ ...values, place: values.place.trim() }, c)}
                  className={cx(
                    "w-full rounded-[10px] border-[1.5px] border-cardBorder bg-sagePale px-[14px] py-3 text-left text-[16px] text-deepBrown",
                    "hover:border-coral2 disabled:cursor-wait disabled:opacity-70",
                    FOCUS,
                    "focus-visible:outline-coral2",
                  )}
                >
                  {c.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="lab-time" className={LABEL}>
          {BIRTH.timeLabel} <span className={cx(LABEL_ASIDE, "text-coral2")}>{BIRTH.timeOptional}</span>
        </label>
        <input
          id="lab-time"
          type="time"
          value={values.time}
          onChange={set("time")}
          aria-invalid={fieldError("time") ? true : undefined}
          aria-describedby={describedBy("time", "lab-time-hint")}
          className={INPUT_LIGHT}
        />
        <span id="lab-time-hint" className="text-[13px] text-midBrown">
          {BIRTH.timeHint}
        </span>
        {fieldError("time") && (
          <p id="lab-time-err" role="alert" className={ERROR_LIGHT}>
            {fieldError("time")}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button type="submit" className={BTN_LIGHT} disabled={submitting} aria-busy={submitting || undefined}>
          {submitting ? BIRTH_EXTRA.submitting : BIRTH.submit}
        </button>
        {generalError && (
          <p role="alert" className={ERROR_LIGHT}>
            {generalError}
          </p>
        )}
      </div>
    </form>
  );
});

export default BirthForm;
