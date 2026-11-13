"use client";

// Multi-step application. Step 1 = email + consent (saved as a partial lead straight
// away); then the steps in content/apply/application.ts; then the 15-minute Cal
// calendar inline on the page (no pop-up), with metadata for the webhook.
// If the email was already given on the page (B's gate, A's demo), step 1 is skipped so it isn't asked twice.
import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { CAL_BRAND } from "@/lib/booking";
import { flush } from "@/lib/analytics/track";
import { trackSchedule } from "@/lib/fbpixel";
import { useConsent } from "@/context/ConsentContext";
import { APPLICATION_UI, STEPS, type Question, type Step } from "@/content/apply/application";
import { BTN_LIGHT, ERROR_LIGHT, INPUT_LIGHT, cx } from "@/components/lab/classes";
import EmailCapture, { postJson, type Captured } from "./EmailCapture";
import { H2, SECTION } from "./OfferBlocks";
import { useLp } from "./LpContext";

type CalBooking = { link: string; params: Record<string, string>; url: string };

const TOTAL = STEPS.length + 1; // email step + question steps

function ProgressBar({ step }: { step: number }) {
  const pct = Math.round((step / TOTAL) * 100);
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 font-dm-mono text-[12px] uppercase tracking-[0.12em] text-midBrown">
        {APPLICATION_UI.stepLabel.replace("{n}", String(step)).replace("{total}", String(TOTAL))}
      </p>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL}
        aria-valuenow={step}
        aria-label={APPLICATION_UI.title}
        className="h-[6px] w-full overflow-hidden rounded-full bg-sagePale"
      >
        <div className="h-full rounded-full bg-coral2 transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const BIG_LABEL = "font-fraunces text-[22px] font-medium leading-[1.25] text-deepBrown";
const SMALL_LABEL = "text-[15px] font-medium text-deepBrown";

function QuestionField({
  q,
  value,
  onChange,
  error,
  small = false,
  autoFocus = false,
}: {
  q: Question;
  value: string;
  onChange: (v: string) => void;
  error: string | null;
  /** One of several fields on a step: a plain label instead of a heading-size one. */
  small?: boolean;
  autoFocus?: boolean;
}) {
  const id = useId();
  const describedBy = [q.hint ? `${id}-hint` : null, error ? `${id}-err` : null].filter(Boolean).join(" ") || undefined;
  const hint = q.hint ? (
    <p id={`${id}-hint`} className="m-0 text-[14px] text-midBrown">
      {q.hint}
    </p>
  ) : null;

  if (q.kind === "choice") {
    return (
      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0" aria-describedby={describedBy}>
        <legend className={cx("mb-3", small ? SMALL_LABEL : BIG_LABEL)}>{q.label}</legend>
        {hint}
        {q.options.map((o) => (
          <label
            key={o.value}
            className={cx(
              "flex cursor-pointer items-center gap-3 rounded-[12px] border-[1.5px] px-4 py-3 text-[16px]",
              value === o.value ? "border-deepBrown bg-cream2" : "border-cardBorder bg-sagePale",
            )}
          >
            <input type="radio" name={q.id} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="h-4 w-4 accent-[#C26B4A]" />
            {o.label}
          </label>
        ))}
      </fieldset>
    );
  }

  const common = {
    id,
    value,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    maxLength: q.maxLength,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    className: INPUT_LIGHT,
    autoFocus,
  };
  const input =
    q.kind === "textarea" ? (
      <textarea rows={4} {...common} />
    ) : q.kind === "date" ? (
      <input type="date" min="1900-01-01" max={new Date().toISOString().slice(0, 10)} autoComplete="bday" {...common} />
    ) : q.kind === "time" ? (
      <input type="time" {...common} />
    ) : (
      <input type="text" autoComplete={q.autoComplete} {...common} />
    );
  return (
    <div className={cx("flex flex-col", small ? "gap-2" : "gap-3")}>
      <label htmlFor={id} className={small ? SMALL_LABEL : BIG_LABEL}>
        {q.label}
      </label>
      {hint}
      {input}
    </div>
  );
}

type Props = {
  /** Email already captured elsewhere on the page (B's gate, A's demo): step 1 is skipped. */
  captured?: Captured | null;
  /** Count the application as started as soon as it shows with the email done (variant B). */
  autoStart?: boolean;
  /** Step 1 completed here: lets the page share the email with the demo. */
  onCaptured?: (c: Captured) => void;
};

export default function ApplicationForm({ captured: initial = null, autoStart = false, onCaptured }: Props) {
  const { variant, concept, market, utm, lpTrack } = useLp();
  const { marketingAllowed } = useConsent();
  const [captured, setCaptured] = useState<Captured | null>(initial);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  /** The field the error belongs to, and what to fix. */
  const [error, setError] = useState<{ field: string | null; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [cal, setCal] = useState<CalBooking | null>(null);
  const started = useRef(false);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const qRef = useRef<HTMLDivElement>(null);

  useEffect(() => setCaptured((c) => c ?? initial), [initial]);

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    lpTrack("lp_application_started", { prefilled: Boolean(initial) });
  };
  // B arrives with the email done: the application starts when this form appears.
  useEffect(() => {
    if (initial && autoStart) markStarted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  // Cal embed: brand it, and record a booked call (plus Meta Schedule after consent).
  useEffect(() => {
    if (!cal) return;
    let api: Awaited<ReturnType<typeof getCalApi>> | undefined;
    const onBooked = () => {
      lpTrack("lp_call_booked", { via: "cal_embed" });
      flush();
      if (marketingAllowed) trackSchedule({ content_name: "lp_r1_call" });
    };
    (async () => {
      api = await getCalApi();
      api("ui", { cssVarsPerTheme: { light: { "cal-brand": CAL_BRAND }, dark: { "cal-brand": CAL_BRAND } }, layout: "month_view", theme: "light" });
      api("on", { action: "bookingSuccessful", callback: onBooked });
    })();
    return () => api?.("off", { action: "bookingSuccessful", callback: onBooked });
  }, [cal, lpTrack, marketingAllowed]);

  const current: Step = STEPS[stepIndex];
  const step = captured ? stepIndex + 2 : 1;
  const last = stepIndex === STEPS.length - 1;

  const next = async (e: FormEvent) => {
    e.preventDefault();
    const missing = current.fields.find((f) => f.required && !(answers[f.id] ?? "").trim());
    if (missing) {
      return setError({
        field: missing.id,
        message: missing.kind === "choice" ? APPLICATION_UI.errors.choice : APPLICATION_UI.errors.required,
      });
    }
    setError(null);
    if (!last) {
      setStepIndex(stepIndex + 1);
      requestAnimationFrame(() => qRef.current?.scrollIntoView({ block: "nearest" }));
      return;
    }
    if (!captured) return;
    setBusy(true);
    const r = await postJson<{ ok: true; cal: CalBooking }>("/api/apply", {
      leadId: captured.leadId,
      email: captured.email,
      answers,
      variant,
      concept,
      market,
      utm,
    });
    setBusy(false);
    if (!r.ok) {
      const idx = STEPS.findIndex((s) => s.fields.some((f) => f.id === r.error.field));
      if (idx >= 0) setStepIndex(idx);
      return setError({ field: idx >= 0 ? (r.error.field ?? null) : null, message: r.error.message });
    }
    lpTrack("lp_application_submitted");
    flush();
    setCal(r.data.cal);
    requestAnimationFrame(() => doneRef.current?.focus());
  };

  return (
    <section id="apply" aria-labelledby="lp-apply" className={cx(SECTION, "scroll-mt-6")}>
      <h2 id="lp-apply" className={H2}>
        {APPLICATION_UI.title}
      </h2>

      {cal ? (
        <div className="flex flex-col gap-4">
          <h3 ref={doneRef} tabIndex={-1} className="m-0 font-fraunces text-[24px] font-medium text-deepBrown outline-none">
            {APPLICATION_UI.doneTitle}
          </h3>
          <p className="m-0 max-w-[62ch]">{APPLICATION_UI.doneBody}</p>
          {/* Inline calendar: one less tap than a pop-up, and it can't be blocked as one. */}
          <div
            role="region"
            aria-label={APPLICATION_UI.calendarLabel}
            className="min-h-[520px] w-full overflow-hidden rounded-[14px] border-[1.5px] border-cardBorder bg-cream2"
          >
            <Cal
              calLink={cal.link}
              config={{ layout: "month_view", theme: "light", ...cal.params }}
              style={{ width: "100%", height: "100%", overflow: "scroll" }}
            />
          </div>
          <a
            href={cal.url}
            target="_blank"
            rel="noopener"
            onClick={() => {
              lpTrack("lp_booking_clicked", { via: "link" });
              flush();
            }}
            className="self-start text-[14px] text-midBrown underline underline-offset-[3px]"
          >
            {APPLICATION_UI.bookFallback}
          </a>
        </div>
      ) : (
        <div ref={qRef} className="flex scroll-mt-6 flex-col gap-5">
          <ProgressBar step={step} />
          {!captured ? (
            <EmailCapture
              placement="application"
              submitLabel={APPLICATION_UI.continue}
              onStart={markStarted}
              onCaptured={(c) => {
                setCaptured(c);
                onCaptured?.(c);
              }}
            />
          ) : (
            <form noValidate onSubmit={next} className="flex flex-col gap-5">
              <fieldset key={current.id} className="m-0 flex flex-col gap-5 border-0 p-0">
                {current.title && (
                  <legend className="mb-1 p-0">
                    <span className="block font-fraunces text-[22px] font-medium leading-[1.25] text-deepBrown">{current.title}</span>
                    {current.hint && <span className="mt-2 block text-[14px] text-midBrown">{current.hint}</span>}
                  </legend>
                )}
                {current.fields.map((f, i) => (
                  <QuestionField
                    key={f.id}
                    q={f}
                    small={current.fields.length > 1}
                    autoFocus={i === 0}
                    value={answers[f.id] ?? ""}
                    onChange={(v) => {
                      markStarted();
                      setAnswers((a) => ({ ...a, [f.id]: v }));
                    }}
                    error={error && error.field === f.id ? error.message : null}
                  />
                ))}
              </fieldset>
              {error && (
                <p role="alert" className={ERROR_LIGHT}>
                  {error.message}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4">
                <button type="submit" disabled={busy} className={BTN_LIGHT}>
                  {busy ? APPLICATION_UI.submitting : last ? APPLICATION_UI.submit : APPLICATION_UI.continue}
                </button>
                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStepIndex(stepIndex - 1);
                    }}
                    className="border-0 bg-transparent p-0 text-[14px] text-midBrown underline underline-offset-[3px]"
                  >
                    {APPLICATION_UI.back}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
