"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Marketing-cookie consent for GDPR / ePrivacy.
 *
 * "unset"   — visitor hasn't chosen yet → show the banner, load nothing.
 * "granted" — marketing cookies allowed → Meta Pixel + ManyChat may load/fire.
 * "denied"  — marketing cookies refused → keep everything off.
 *
 * Only "necessary" cookies (none third-party here) run without consent.
 * Vercel Analytics is cookieless and stays always-on.
 */
export type ConsentState = "unset" | "granted" | "denied";

type ConsentContextValue = {
  consent: ConsentState;
  /** true only once the visitor has explicitly accepted marketing cookies. */
  marketingAllowed: boolean;
  /** banner is shown when undecided, or when the visitor re-opens settings. */
  bannerVisible: boolean;
  accept: () => void;
  reject: () => void;
  openSettings: () => void;
};

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

const STORAGE_KEY = "apl.consent.marketing.v1";

export function ConsentProvider({ children }: { children: ReactNode }) {
  // Start "unset" with the banner hidden so server and first client render match;
  // the real value is read from localStorage in the mount effect below.
  const [consent, setConsent] = useState<ConsentState>("unset");
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "granted" || stored === "denied") {
        setConsent(stored);
      } else {
        // No prior choice → prompt.
        setBannerVisible(true);
      }
    } catch {
      // localStorage unavailable (private mode, etc.) — prompt, persist best-effort.
      setBannerVisible(true);
    }
  }, []);

  const persist = useCallback((value: "granted" | "denied") => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // noop
    }
  }, []);

  const accept = useCallback(() => {
    setConsent("granted");
    setBannerVisible(false);
    persist("granted");
  }, [persist]);

  const reject = useCallback(() => {
    setConsent("denied");
    setBannerVisible(false);
    persist("denied");
    // If the pixel already loaded earlier this session (withdrawal), tell Meta to
    // stop sending. On the next page load it won't be mounted at all.
    try {
      window.fbq?.("consent", "revoke");
    } catch {
      // noop
    }
  }, [persist]);

  const openSettings = useCallback(() => {
    setBannerVisible(true);
  }, []);

  return (
    <ConsentContext.Provider
      value={{
        consent,
        marketingAllowed: consent === "granted",
        bannerVisible,
        accept,
        reject,
        openSettings,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent must be used inside <ConsentProvider>");
  }
  return ctx;
}

/**
 * Non-React reader for the stored marketing-consent choice. Useful for
 * imperative / future server-bound code paths (e.g. passing a consent flag to a
 * server-side Conversions API call). Returns false during SSR.
 */
export function hasMarketingConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "granted";
  } catch {
    return false;
  }
}
