"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  track,
  trackPageView,
  ensureSessionStarted,
  trackSessionEnd,
  flush,
} from "@/lib/analytics/track";
import type { AnalyticsEventType } from "@/types";

type AnalyticsContextValue = {
  track: (
    type: AnalyticsEventType,
    name?: string,
    props?: Record<string, unknown>
  ) => void;
};

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(
  undefined
);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Mount-once: session bootstrap, foreground-duration accumulator, scroll depth,
  // delegated click tracking, and unload/visibility flushing. This provider lives
  // in the persistent public layout, so it is NOT remounted on route changes —
  // session_end therefore fires only on real page exit.
  useEffect(() => {
    ensureSessionStarted();

    let visibleSince = document.visibilityState === "visible" ? Date.now() : 0;
    let accumulatedMs = 0;
    let maxScrollPct = 0;
    let ended = false;

    const computeScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct =
        scrollable > 0
          ? Math.min(100, Math.round((window.scrollY / scrollable) * 100))
          : 0;
      if (pct > maxScrollPct) maxScrollPct = pct;
    };

    const accumulate = () => {
      if (visibleSince) {
        accumulatedMs += Date.now() - visibleSince;
        visibleSince = 0;
      }
    };

    const onScroll = () => computeScroll();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (!visibleSince) visibleSince = Date.now();
      } else {
        accumulate();
        flush();
      }
    };

    const endSession = () => {
      if (ended) return;
      ended = true;
      accumulate();
      computeScroll();
      trackSessionEnd(accumulatedMs, maxScrollPct);
      flush();
    };

    // Delegated click tracking: anything carrying data-analytics is recorded.
    const onClick = (e: MouseEvent) => {
      const start = e.target as HTMLElement | null;
      const el = start?.closest?.("[data-analytics]") as HTMLElement | null;
      if (!el) return;
      const name = el.dataset.analytics;
      if (!name) return;

      const props: Record<string, unknown> = {};
      if (el.dataset.serviceSlug) props.service_slug = el.dataset.serviceSlug;
      if (el.dataset.section) props.section = el.dataset.section;
      const href = (el as HTMLAnchorElement).href;
      if (href) props.href = href;

      track("click", name, props);

      // Some CTAs are also conversions (e.g. a Calendly handoff link).
      if (el.dataset.analyticsConversion) {
        track("conversion", el.dataset.analyticsConversion, props);
      }
    };

    computeScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", endSession);
    document.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", endSession);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  // page_view on first mount AND on every App Router route change.
  useEffect(() => {
    if (pathname) trackPageView(pathname);
  }, [pathname]);

  return (
    <AnalyticsContext.Provider value={{ track }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    throw new Error("useAnalytics must be used inside <AnalyticsProvider>");
  }
  return ctx;
}
