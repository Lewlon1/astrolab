"use client";

// Email + consent: application step 1 in both variants, and variant B's gate.
// On success it saves a partial lead, fires lp_email_captured and (after cookie
// consent only) the Meta Lead event.
import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { getSessionKey } from "@/lib/analytics/session";
import { flush } from "@/lib/analytics/track";
import { trackLead } from "@/lib/fbpixel";
import { useConsent } from "@/context/ConsentContext";
import { APPLICATION_UI, APPLY_CONSENT_VERSION } from "@/content/apply/application";
import { BTN_LIGHT, ERROR_LIGHT, INPUT_LIGHT, LABEL, cx } from "@/components/lab/classes";
import { useLp } from "./LpContext";

export type Captured = { email: string; leadId: string };
export type ReadingSummary = { card: string; sun: string; moon: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldError = { field?: string; message: string } | null;

/** POST JSON; failures become a message to show. Never logs the body. */
export async function postJson<T>(url: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; error: { field?: string; message: string } }> {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    return { ok: false, error: { message: APPLICATION_UI.errors.generic } };
  }
  const data = (await res.json().catch(() => null)) as (T & { error?: unknown; field?: unknown }) | null;
  if (!res.ok || !data) {
    return {
      ok: false,
      error: {
        message: data && typeof data.error === "string" ? data.error : APPLICATION_UI.errors.generic,
        field: data && typeof data.field === "string" ? data.field : undefined,
      },
    };
  }
  return { ok: true, data };
}

type Props = {
  /** Variant B passes what the reading showed, for the follow-up email. */
  reading?: ReadingSummary | null;
  submitLabel: string;
  placement: "application" | "gate";
  onCaptured: (c: Captured) => void;
  /** Fired on first focus or input (application step 1 only). */
  onStart?: () => void;
};

export default function EmailCapture({ reading, submitLabel, placement, onCaptured, onStart }: Props) {
  const { variant, concept, market, utm, lpTrack } = useLp();
  const { marketingAllowed } = useConsent();
  const id = useId();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<FieldError>(null);
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);

  const start = () => {
    if (started) return;
    setStarted(true);
    onStart?.();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) return setError({ field: "email", message: APPLICATION_UI.errors.email });
    if (!consent) return setError({ field: "consent", message: APPLICATION_UI.errors.consent });
    setBusy(true);
    setError(null);
    const r = await postJson<{ ok: true; leadId: string }>("/api/apply/partial", {
      email,
      consent: true,
      consentVersion: APPLY_CONSENT_VERSION,
      variant,
      concept,
      market,
      utm,
      sessionKey: getSessionKey() || undefined,
      reading: reading ?? undefined,
    });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    lpTrack("lp_email_captured", { placement });
    // Send now: people often leave right after giving their email.
    flush();
    if (marketingAllowed) trackLead(email, "lp_r1_email");
    onCaptured({ email: email.trim().toLowerCase(), leadId: r.data.leadId });
  };

  const emailErr = error?.field === "email";
  const consentErr = error?.field === "consent";

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-email`} className={LABEL}>
          {APPLICATION_UI.emailLabel}
        </label>
        <input
          id={`${id}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={APPLICATION_UI.emailPlaceholder}
          value={email}
          onFocus={start}
          onChange={(e) => {
            start();
            setEmail(e.target.value);
          }}
          aria-invalid={emailErr || undefined}
          aria-describedby={emailErr ? `${id}-err` : undefined}
          className={INPUT_LIGHT}
        />
      </div>
      <label className="flex items-start gap-3 text-[15px] leading-[1.5]">
        <input
          type="checkbox"
          checked={consent}
          onFocus={start}
          onChange={(e) => {
            start();
            setConsent(e.target.checked);
          }}
          aria-invalid={consentErr || undefined}
          aria-describedby={consentErr ? `${id}-err` : undefined}
          className="mt-1 h-5 w-5 flex-none accent-[#C26B4A]"
        />
        <span>
          {APPLICATION_UI.consent.before}
          <Link href="/privacy" className="underline underline-offset-[3px]" target="_blank">
            {APPLICATION_UI.consent.linkLabel}
          </Link>
          {APPLICATION_UI.consent.after}
        </span>
      </label>
      {error && (
        <p id={`${id}-err`} role="alert" className={ERROR_LIGHT}>
          {error.message}
        </p>
      )}
      <div>
        <button type="submit" disabled={busy} className={cx(BTN_LIGHT)}>
          {busy ? APPLICATION_UI.saving : submitLabel}
        </button>
      </div>
    </form>
  );
}
