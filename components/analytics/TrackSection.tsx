"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { trackSectionView, trackSectionDwell } from "@/lib/analytics/track";
import { MIN_DWELL_MS } from "@/lib/analytics/constants";

/**
 * Wraps a landing-page section and measures how long it is actually read.
 *
 * - Fires `section_view` once, the first time the section is ≥50% visible.
 * - Accumulates dwell time only while the section is on-screen AND the tab is
 *   foregrounded, emitting `section_dwell` (summed server-side) on each exit /
 *   tab-hide / unmount. Sub-`MIN_DWELL_MS` glimpses are ignored.
 *
 * It is a client component but renders server-component children untouched, so
 * sections can be wrapped in page.tsx without editing each section file.
 */
export default function TrackSection({
  name,
  index,
  children,
}: {
  name: string;
  index: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const st = {
      intersecting: false,
      timing: false,
      enteredAt: 0,
      accumulated: 0,
      viewed: false,
    };

    const pause = () => {
      if (st.timing) {
        st.accumulated += Date.now() - st.enteredAt;
        st.timing = false;
      }
    };
    const resume = () => {
      if (
        !st.timing &&
        st.intersecting &&
        document.visibilityState === "visible"
      ) {
        st.timing = true;
        st.enteredAt = Date.now();
      }
    };
    const emit = () => {
      pause();
      if (st.accumulated >= MIN_DWELL_MS) {
        trackSectionDwell(name, st.accumulated, index);
      }
      st.accumulated = 0;
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const isVisible =
            entry.isIntersecting && entry.intersectionRatio >= 0.5;
          st.intersecting = isVisible;
          if (isVisible) {
            if (!st.viewed) {
              st.viewed = true;
              trackSectionView(name, index);
            }
            resume();
          } else {
            emit(); // left the viewport — bank this visit's dwell
          }
        }
      },
      { threshold: [0, 0.5] }
    );
    io.observe(el);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") pause();
      else resume();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", emit);

    return () => {
      emit();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", emit);
    };
  }, [name, index]);

  return (
    <div ref={ref} data-track-section={name}>
      {children}
    </div>
  );
}
