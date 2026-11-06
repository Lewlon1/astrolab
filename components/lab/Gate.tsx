"use client";

import Link from "next/link";
import { forwardRef, useState, type FormEvent } from "react";
import { CONSENT_TEXT } from "@/content/lab/privacy";
import { ERRORS, GATE, GATE_EXTRA, SENT } from "@/content/lab/ui";
import type { FormError } from "./BirthForm";
import { BTN_DARK, ERROR_DARK, EYEBROW, INPUT_DARK, LABEL, LABEL_ASIDE, LEDE, cx } from "./classes";
import { MOTIF_COLORS, SunMotif } from "./motifs";
import styles from "./lab.module.css";

export type GateValues = { email: string; time: string };

export type SentInfo = {
  email: string;
  hasTime: boolean;
  /** e.g. "Leo · Cancer or Leo", taken from the reading's chips. */
  sunMoon: string;
  /** e.g. "XVI · The Tower" */
  card: string;
};

type Props = {
  /** Prefill for the time field (the birth-form time, or ""). */
  defaultTime: string;
  onSubmit: (values: GateValues) => void;
  error: FormError;
  submitting: boolean;
  sent: SentInfo | null;
};

// Same pattern as lib/lab/validate.ts (server re-validates).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The dark "keep going" panel. The forwarded ref goes on the sent-state heading,
 * so the parent can move focus there on success.
 */
const Gate = forwardRef<HTMLHeadingElement, Props>(function Gate(
  { defaultTime, onSubmit, error, submitting, sent },
  sentRef,
) {
  const [email, setEmail] = useState("");
  const [time, setTime] = useState(defaultTime);
  const [consent, setConsent] = useState(false);
  const [localError, setLocalError] = useState<FormError>(null);

  const shown = localError ?? error;
  const fieldError = (f: string) => (shown?.field === f ? shown.message : null);
  const generalError = shown && !["email", "time", "consent"].includes(shown.field ?? "") ? shown.message : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) return setLocalError({ field: "email", message: ERRORS.emailInvalid });
    if (!consent) return setLocalError({ field: "consent", message: ERRORS.consentMissing });
    setLocalError(null);
    onSubmit({ email: trimmed, time });
  };

  return (
    <section
      aria-labelledby="lab-gate-title"
      className={cx(
        "relative flex flex-col gap-5 overflow-hidden rounded-[18px] bg-deepBrown p-[clamp(22px,5vw,36px)] text-cream2",
        styles.reveal,
      )}
    >
      <SunMotif color={MOTIF_COLORS.gold2} rays={24} className={styles.sunmark} />
      <p className={cx(EYEBROW, "text-goldLight")}>{GATE.eyebrow}</p>
      <h2
        id="lab-gate-title"
        className="m-0 font-fraunces text-[clamp(28px,6vw,40px)] font-medium leading-[1.05] !text-cream2 [text-wrap:balance]"
      >
        {GATE.title}
      </h2>
      <p className={cx(LEDE, "text-coralLight")}>{GATE.lede}</p>

      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-3">
        {GATE.gets.map((g) => (
          <li key={g.title} className="rounded-xl border border-cream2/20 px-[14px] py-3 text-[14px] text-sageLight">
            <b className="mb-0.5 block text-[15px] font-medium text-cream2">{g.title}</b>
            {g.body}
          </li>
        ))}
      </ul>

      {sent ? (
        <SentState ref={sentRef} sent={sent} />
      ) : (
        <form noValidate onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-[18px] gap-y-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="lab-email" className={LABEL}>
              {GATE.emailLabel}
            </label>
            <input
              id="lab-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder={GATE.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={fieldError("email") ? true : undefined}
              aria-describedby={fieldError("email") ? "lab-email-err" : undefined}
              className={INPUT_DARK}
            />
            {fieldError("email") && (
              <p id="lab-email-err" role="alert" className={ERROR_DARK}>
                {fieldError("email")}
              </p>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="lab-time2" className={LABEL}>
              {GATE.timeLabel} <span className={cx(LABEL_ASIDE, "text-goldLight")}>{GATE.timeOptional}</span>
            </label>
            <input
              id="lab-time2"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-invalid={fieldError("time") ? true : undefined}
              aria-describedby={fieldError("time") ? "lab-time2-err" : undefined}
              className={INPUT_DARK}
            />
            {fieldError("time") && (
              <p id="lab-time2-err" role="alert" className={ERROR_DARK}>
                {fieldError("time")}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <div className="flex items-start gap-2.5 text-[14px] text-sageLight">
              <input
                id="lab-consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                aria-invalid={fieldError("consent") ? true : undefined}
                aria-describedby={fieldError("consent") ? "lab-consent-err" : undefined}
                className="mt-1 h-4 w-4 flex-none accent-gold2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-goldLight"
              />
              <label htmlFor="lab-consent">
                {CONSENT_TEXT.before}
                <Link
                  href="/privacy#lab"
                  target="_blank"
                  className="text-cream2 underline underline-offset-2 hover:text-goldLight"
                >
                  {CONSENT_TEXT.linkLabel}
                </Link>
                {CONSENT_TEXT.after}
              </label>
            </div>
            {fieldError("consent") && (
              <p id="lab-consent-err" role="alert" className={ERROR_DARK}>
                {fieldError("consent")}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <button type="submit" className={BTN_DARK} disabled={submitting} aria-busy={submitting || undefined}>
              {submitting ? GATE_EXTRA.submitting : GATE.submit}
            </button>
            {generalError && (
              <p role="alert" className={ERROR_DARK}>
                {generalError}
              </p>
            )}
          </div>
        </form>
      )}
    </section>
  );
});

const TILE = "flex min-w-0 flex-col gap-1.5 rounded-xl border border-cream2/20 bg-cream2/[0.08] p-4";
const TILE_LABEL = "font-dm-mono text-[11px] font-medium uppercase tracking-[0.14em] text-goldLight";
const TILE_VALUE = "font-fraunces text-[20px] font-medium leading-[1.2] text-cream2";
const TILE_BODY = "m-0 text-[14px] text-sageLight";

/** "Check your inbox" plus a short preview of what the profile holds. No example transit. */
const SentState = forwardRef<HTMLHeadingElement, { sent: SentInfo }>(function SentState({ sent }, ref) {
  const t = SENT.tiles;
  return (
    <div className={cx("flex flex-col gap-4", styles.reveal)}>
      <div className="flex flex-col gap-2" role="status">
        <h3 ref={ref} tabIndex={-1} className="m-0 font-fraunces text-[24px] font-medium !text-goldLight outline-none">
          {SENT.title}
        </h3>
        <p className="m-0 text-[16px] text-cream2 [overflow-wrap:anywhere]">{SENT.body(sent.email)}</p>
        <p className="m-0 text-[14px] text-sageLight">{SENT.hint}</p>
      </div>
      <p className={cx(TILE_LABEL, "m-0")}>{SENT.previewTitle}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={TILE}>
          <small className={TILE_LABEL}>{t.sunMoon.label}</small>
          <span className={TILE_VALUE}>{sent.sunMoon}</span>
          <p className={TILE_BODY}>{t.sunMoon.body}</p>
        </div>
        <div className={TILE}>
          <small className={TILE_LABEL}>{sent.hasTime ? t.risingWithTime.label : t.risingNoTime.label}</small>
          <span className={TILE_VALUE}>{sent.hasTime ? t.risingWithTime.value : t.risingNoTime.value}</span>
          <p className={TILE_BODY}>{sent.hasTime ? t.risingWithTime.body : t.risingNoTime.body}</p>
        </div>
        <div className={cx(TILE, "sm:col-span-2")}>
          <small className={TILE_LABEL}>{t.card.label}</small>
          <span className={TILE_VALUE}>{sent.card}</span>
          <p className={TILE_BODY}>{t.card.body}</p>
        </div>
      </div>
    </div>
  );
});

export default Gate;
