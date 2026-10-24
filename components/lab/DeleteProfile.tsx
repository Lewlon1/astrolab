"use client";

// Two-step in-page delete. The delete route signs the user out, so we must not
// router.refresh() afterwards: the page would redirect away from the success message.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DELETE, PROFILE_EXTRA } from "@/content/lab/ui";
import { BTN, ERROR_LIGHT, FOCUS, cx } from "./classes";

type Step = "idle" | "confirm" | "working" | "done";

export default function DeleteProfile() {
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const deleteBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const prevStep = useRef<Step>("idle");

  // Move focus with each step so it never drops to <body> when a control unmounts.
  useEffect(() => {
    const prev = prevStep.current;
    prevStep.current = step;
    if (step === "confirm" && prev !== "confirm") cancelBtnRef.current?.focus();
    else if (step === "idle" && prev === "confirm") deleteBtnRef.current?.focus();
    else if (step === "done") doneRef.current?.focus();
  }, [step]);

  async function doDelete() {
    setError(null);
    setStep("working");
    try {
      const res = await fetch("/api/lab/delete", { method: "POST" });
      if (!res.ok) {
        setError(PROFILE_EXTRA.deleteError);
        setStep("confirm");
        return;
      }
      setStep("done");
    } catch {
      setError(PROFILE_EXTRA.deleteError);
      setStep("confirm");
    }
  }

  if (step === "done") {
    return (
      <div role="status" ref={doneRef} tabIndex={-1} className="outline-none">
        <p className="m-0 font-fraunces text-[20px]">{DELETE.done}</p>
        <p className="mt-3">
          <Link href="/" className={cx("underline underline-offset-4", FOCUS, "focus-visible:outline-coral2")}>
            {PROFILE_EXTRA.homeLink}
          </Link>
        </p>
      </div>
    );
  }

  if (step === "idle") {
    return (
      <button
        ref={deleteBtnRef}
        type="button"
        onClick={() => setStep("confirm")}
        className={cx("text-[14px] text-midBrown underline underline-offset-4 cursor-pointer bg-transparent border-0 p-0", FOCUS, "focus-visible:outline-coral2")}
      >
        {DELETE.button}
      </button>
    );
  }

  return (
    <div role="group" aria-labelledby="lab-delete-title" className="rounded-[14px] border-[1.5px] border-deepBrown bg-sagePale p-5">
      <h3 id="lab-delete-title" className="m-0 font-fraunces text-[19px] font-medium !text-deepBrown">
        {DELETE.title}
      </h3>
      <p className="mt-2">{DELETE.body}</p>
      {error && (
        <p role="alert" className={cx(ERROR_LIGHT, "mt-3")}>
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={doDelete}
          disabled={step === "working"}
          className={cx(BTN, "border-deepBrown bg-deepBrown text-cream2 hover:bg-coral2 hover:border-coral2 focus-visible:outline-coral2")}
        >
          {step === "working" ? PROFILE_EXTRA.deleteWorking : DELETE.confirm}
        </button>
        <button
          ref={cancelBtnRef}
          type="button"
          onClick={() => setStep("idle")}
          disabled={step === "working"}
          className={cx(BTN, "border-deepBrown bg-transparent text-deepBrown hover:bg-cream2 focus-visible:outline-coral2")}
        >
          {DELETE.cancel}
        </button>
      </div>
    </div>
  );
}
