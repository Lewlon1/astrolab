import type {
  AnalyticsEventInput,
  AnalyticsIngestBody,
  SessionAttribution,
} from "@/types";
import {
  INGEST_ENDPOINT,
  FLUSH_MAX_EVENTS,
  FLUSH_INTERVAL_MS,
  MAX_BATCH_EVENTS,
} from "./constants";
import { getSessionKey } from "./session";

let queue: AnalyticsEventInput[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let pendingAttribution: SessionAttribution | null = null;

/** Attribution is sent once, piggy-backed on the next flush. */
export function setAttribution(attr: SessionAttribution): void {
  pendingAttribution = attr;
}

export function enqueue(ev: AnalyticsEventInput): void {
  if (typeof window === "undefined") return;
  queue.push(ev);
  if (queue.length >= FLUSH_MAX_EVENTS) {
    flush();
  } else {
    scheduleFlush();
  }
}

function scheduleFlush(): void {
  if (timer) return;
  timer = setTimeout(() => flush(), FLUSH_INTERVAL_MS);
}

export function flush(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (queue.length === 0) return;

  const session_key = getSessionKey();
  if (!session_key) {
    queue = []; // storage unavailable — drop rather than spin
    return;
  }

  const batch = queue.slice(0, MAX_BATCH_EVENTS);
  queue = queue.slice(MAX_BATCH_EVENTS);

  const body: AnalyticsIngestBody = { session_key, events: batch };
  if (pendingAttribution) {
    body.attribution = pendingAttribution;
    pendingAttribution = null;
  }

  send(body);

  // If we truncated to the batch cap, drain the remainder shortly.
  if (queue.length > 0) scheduleFlush();
}

function send(body: AnalyticsIngestBody): void {
  const payload = JSON.stringify(body);

  // Beacon first — it survives page unload where fetch() is killed.
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(INGEST_ENDPOINT, blob)) return;
    }
  } catch {
    /* fall through to fetch */
  }

  try {
    void fetch(INGEST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* best-effort: analytics never breaks the page */
  }
}
