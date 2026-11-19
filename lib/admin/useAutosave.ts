"use client";

import { useEffect, useRef, useState } from "react";
import { createAutosaver, type AutosaveState, type Autosaver, type AutosaverConfig } from "./autosave";

type Options<T> = Omit<AutosaverConfig<T>, "onChange" | "initial" | "setTimer" | "clearTimer">;

/**
 * Autosaves `value` a moment after the last edit. Also saves straight away when the
 * page is hidden (home-screen app sent to background, phone locked) or the editor
 * unmounts (in-app navigation), using a keepalive request so it survives the page
 * going away.
 */
export function useAutosave<T>(
  value: T,
  options: Options<T>
): AutosaveState & { retry: () => void; flush: () => Promise<void>; discard: () => void } {
  const [state, setState] = useState<AutosaveState>({ status: "idle", message: null });
  const opts = useRef(options);
  opts.current = options;

  const saver = useRef<Autosaver<T> | null>(null);
  if (saver.current === null) {
    saver.current = createAutosaver<T>({
      initial: value,
      delayMs: options.delayMs,
      equals: options.equals,
      save: (v, o) => opts.current.save(v, o),
      validate: (v) => opts.current.validate?.(v) ?? null,
      onSaved: (r) => opts.current.onSaved?.(r),
      onChange: setState,
    });
  }

  const discarded = useRef(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    saver.current?.update(value);
  }, [value]);

  useEffect(() => {
    const s = saver.current!;
    const flushNow = () => {
      if (!discarded.current) void s.flush({ keepalive: true });
    };
    const onVisibility = () => document.visibilityState === "hidden" && flushNow();
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (discarded.current || !s.hasUnsaved()) return;
      flushNow();
      e.preventDefault();
      e.returnValue = "";
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flushNow);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flushNow);
      window.removeEventListener("beforeunload", onBeforeUnload);
      // Leaving the editor (e.g. "Back to notes", a tab tap): save what's left.
      // No dispose here: React strict mode re-runs this effect on the same saver.
      flushNow();
    };
  }, []);

  return {
    ...state,
    retry: () => void saver.current?.flush(),
    flush: () => saver.current?.flush() ?? Promise.resolve(),
    /** Stop saving for good (e.g. the note was deleted). */
    discard: () => {
      discarded.current = true;
      saver.current?.dispose();
    },
  };
}
