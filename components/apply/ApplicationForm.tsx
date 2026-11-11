"use client";

// Multi-step application. Step 1 = email + consent (saved as a partial lead straight
// away); then one question per step; then the 15-minute Cal call with metadata.
// Variant B arrives with step 1 already done (`captured`), so the email isn't asked twice.
import { getCalApi } from "@calcom/embed-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { CAL_BRAND } from "@/lib/booking";
import { flush } from "@/lib/analytics/track";
import { trackSchedule } from "@/lib/fbpixel";
import { useConsent } from "@/context/ConsentContext";
import { APPLICATION_UI, QUESTIONS, type Question } from "@/content/apply/application";
import { BTN_LIGHT, ERROR_LIGHT, INPUT_LIGHT, cx } from "@/components/lab/classes";
import EmailCapture, { postJson, type Captured } from "./EmailCapture";
import { H2, SECTION } from "./OfferBlocks";
import { useLp } from "./LpContext";

type Cal = { link: string; params: Record<string, string>; url: string };

const TOTAL = QUESTIONS.length + 1; // email step + questions

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

function QuestionField({ q, value, onChange, error }: { q: Question; value: string; onChange: (v: string) => void; error: string | null }) {
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
        <legend className="mb-3 font-fraunces text-[22px] font-medium leading-[1.25] text-deepBrown">{q.label}</legend>
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
    autoFocus: true,
  };
  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={id} className="font-fraunces text-[22px] font-medium leading-[1.25] text-deepBrown">
        {q.label}
      </label>
      {hint}
      {q.kind === "textarea" ? <textarea rows={4} {...common} /> : <input type="text" autoComplete={q.autoComplete} {...common} />}
    </div>
  );
}

type Props = {
  /** Variant B: email already captured at the gate. */
  captured?: Captured | null;
};

export default function ApplicationForm({ captured: initial = null }: Props) {
  const { variant, concept, market, utm, lpTrack } = useLp();
  const { marketingAllowed } = useConsent();
  const [captured, setCaptured] = useState<Captured | null>(initial);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cal, setCal] = useState<Cal | null>(null);
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
    if (initial) markStarted();
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

  const q = QUESTIONS[qIndex];
  const step = captured ? qIndex + 2 : 1;

  const next = async (e: FormEvent) => {
    e.preventDefault();
    const v = (answers[q.id] ?? "").trim();
    if (q.required && !v) return setError(q.kind === "choice" ? APPLICATION_UI.errors.choice : APPLICATION_UI.errors.required);
    setError(null);
    if (qIndex < QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
      requestAnimationFrame(() => qRef.current?.scrollIntoView({ block: "nearest" }));
      return;
    }
    if (!captured) return;
    setBusy(true);
    const r = await postJson<{ ok: true; cal: Cal }>("/api/apply", {
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
      const idx = QUESTIONS.findIndex((x) => x.id === r.error.field);
      if (idx >= 0) setQIndex(idx);
      return setError(r.error.message);
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
            {APPLICATION_UI.doneTitle.replace("{name}", answers.first_name ?? "")}
          </h3>
          <p className="m-0 max-w-[62ch]">{APPLICATION_UI.doneBody}</p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              data-cal-link={cal.link}
              data-cal-config={JSON.stringify({ layout: "month_view", ...cal.params })}
              onClick={() => {
                lpTrack("lp_booking_clicked");
                flush();
              }}
              className={BTN_LIGHT}
            >
              {APPLICATION_UI.bookCta}
            </button>
            <a
              href={cal.url}
              target="_blank"
              rel="noopener"
              onClick={() => lpTrack("lp_booking_clicked", { via: "link" })}
              className="text-[14px] text-midBrown underline underline-offset-[3px]"
            >
              {APPLICATION_UI.bookFallback}
            </a>
          </div>
        </div>
      ) : (
        <div ref={qRef} className="flex scroll-mt-6 flex-col gap-5">
          <ProgressBar step={step} />
          {!captured ? (
            <EmailCapture placement="application" submitLabel={APPLICATION_UI.continue} onStart={markStarted} onCaptured={setCaptured} />
          ) : (
            <form noValidate onSubmit={next} className="flex flex-col gap-5">
              <QuestionField
                key={q.id}
                q={q}
                value={answers[q.id] ?? ""}
                onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                error={error}
              />
              {error && (
                <p role="alert" className={ERROR_LIGHT}>
                  {error}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4">
                <button type="submit" disabled={busy} className={BTN_LIGHT}>
                  {busy ? APPLICATION_UI.submitting : qIndex === QUESTIONS.length - 1 ? APPLICATION_UI.submit : APPLICATION_UI.continue}
                </button>
                {qIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setQIndex(qIndex - 1);
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
