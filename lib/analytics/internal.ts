import { INTERNAL_FLAG_STORAGE } from "./constants";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserStorage(): StorageLike | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null; // storage blocked (e.g. privacy mode)
  }
}

/**
 * True when this browser has opted out of analytics (the owner's own devices).
 * The flag lives only in this browser's localStorage; nothing is sent anywhere.
 */
export function isInternal(store: StorageLike | null = browserStorage()): boolean {
  try {
    return store?.getItem(INTERNAL_FLAG_STORAGE) === "1";
  } catch {
    return false;
  }
}

/** `?internal=1` turns the opt-out on for this browser, `?internal=0` turns it off. */
export function applyInternalParam(
  search: string,
  store: StorageLike | null = browserStorage()
): void {
  if (!store) return;
  try {
    const value = new URLSearchParams(search).get("internal");
    if (value === "1") store.setItem(INTERNAL_FLAG_STORAGE, "1");
    else if (value === "0") store.removeItem(INTERNAL_FLAG_STORAGE);
  } catch {
    /* noop */
  }
}
