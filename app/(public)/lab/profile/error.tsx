"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PROFILE_EXTRA, API } from "@/content/lab/ui";
import { FOCUS, cx } from "@/components/lab/classes";

export default function ProfileError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Name and digest only: the message could embed profile data.
    console.error("[lab] profile page failed:", error.name, error.digest ?? "");
  }, [error]);

  return (
    <main className="mx-auto flex max-w-[640px] flex-col items-start gap-4 px-4 py-16">
      <p className="m-0 font-fraunces text-[26px] font-medium leading-tight !text-deepBrown">{API.serverError}</p>
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={reset}
          className={cx("rounded-full border-[1.5px] border-deepBrown px-5 py-2 text-deepBrown", FOCUS)}
        >
          {PROFILE_EXTRA.errorRetry}
        </button>
        <Link href="/lab" className={cx("self-center text-warmRust underline", FOCUS)}>
          {PROFILE_EXTRA.errorBack}
        </Link>
      </div>
    </main>
  );
}
