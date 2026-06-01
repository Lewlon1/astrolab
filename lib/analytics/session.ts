import type { DeviceType, SessionAttribution } from "@/types";
import { detectDevice } from "./device";
import { SESSION_KEY_STORAGE, SESSION_STARTED_FLAG } from "./constants";

function safeSessionStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null; // storage blocked (e.g. privacy mode)
  }
}

function genId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* noop */
  }
  return `s-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/**
 * The ephemeral, cookieless session id. Created once per tab-session and stored
 * in sessionStorage only — no cookie, no persistent localStorage visitor id.
 * Returns "" on the server or when storage is unavailable (callers no-op).
 */
export function getSessionKey(): string {
  const ss = safeSessionStorage();
  if (!ss) return "";
  let key = ss.getItem(SESSION_KEY_STORAGE);
  if (!key) {
    key = genId();
    try {
      ss.setItem(SESSION_KEY_STORAGE, key);
    } catch {
      /* noop */
    }
  }
  return key;
}

/** True exactly the first time it is called in a session — used to fire `session_start` once. */
export function markSessionStarted(): boolean {
  const ss = safeSessionStorage();
  if (!ss) return false;
  if (ss.getItem(SESSION_STARTED_FLAG)) return false;
  try {
    ss.setItem(SESSION_STARTED_FLAG, "1");
  } catch {
    /* noop */
  }
  return true;
}

function readLang(): string | null {
  try {
    const stored = window.localStorage.getItem("apl.lang"); // LangContext STORAGE_KEY
    if (stored === "en" || stored === "es") return stored;
  } catch {
    /* noop */
  }
  try {
    return document.documentElement.lang || null;
  } catch {
    return null;
  }
}

/** Capture-once attribution gathered on the first page load of a session. */
export function getAttribution(): SessionAttribution {
  const loc = typeof window !== "undefined" ? window.location : null;
  const params = new URLSearchParams(loc?.search ?? "");
  const referrer =
    typeof document !== "undefined" && document.referrer ? document.referrer : null;

  let referrer_host: string | null = null;
  if (referrer) {
    try {
      referrer_host = new URL(referrer).host || null;
    } catch {
      /* noop */
    }
  }

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

  return {
    landing_path: loc?.pathname ?? "/",
    referrer,
    referrer_host,
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_term: params.get("utm_term"),
    utm_content: params.get("utm_content"),
    device: detectDevice(ua) as DeviceType,
    lang: readLang(),
  };
}
