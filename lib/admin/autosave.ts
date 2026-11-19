/**
 * Framework-free autosave controller: debounces edits, saves one at a time, and
 * always ends with the latest value saved (or an error to retry). The React hook in
 * `useAutosave.ts` wraps it; keeping the logic here lets it be tested in node.
 */

export type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error" | "blocked";

export interface AutosaveState {
  status: AutosaveStatus;
  /** Error from the last failed save, or why saving is blocked (e.g. empty title). */
  message: string | null;
}

export interface SaveOptions {
  /** True when the page is closing: use `fetch(..., { keepalive: true })`. */
  keepalive: boolean;
}

export interface AutosaverConfig<T> {
  /** The value as last saved (or loaded). Edits equal to it are not saved. */
  initial: T;
  save: (value: T, opts: SaveOptions) => Promise<unknown>;
  /** Return an error message to block saving this value, or null if it can be saved. */
  validate?: (value: T) => string | null;
  equals?: (a: T, b: T) => boolean;
  delayMs?: number;
  onChange: (state: AutosaveState) => void;
  /** Called with whatever `save` resolved to (e.g. the updated row), when defined. */
  onSaved?: (result: unknown) => void;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

export interface Autosaver<T> {
  update: (value: T) => void;
  /** Save now if there is anything unsaved. Resolves once the latest value is saved or failed. */
  flush: (opts?: SaveOptions) => Promise<void>;
  /** True while there are edits that are not yet saved. */
  hasUnsaved: () => boolean;
  state: () => AutosaveState;
  dispose: () => void;
}

const shallowEqual = <T,>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);

export function createAutosaver<T>(cfg: AutosaverConfig<T>): Autosaver<T> {
  const equals = cfg.equals ?? shallowEqual;
  const delay = cfg.delayMs ?? 1000;
  const setTimer = cfg.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = cfg.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));

  let saved = cfg.initial;
  let latest = cfg.initial;
  let timer: unknown = null;
  let inFlight: Promise<void> | null = null;
  let disposed = false;
  let current: AutosaveState = { status: "idle", message: null };

  const set = (next: AutosaveState) => {
    current = next;
    if (!disposed) cfg.onChange(next);
  };

  const cancelTimer = () => {
    if (timer !== null) clearTimer(timer);
    timer = null;
  };

  async function runSave(opts: SaveOptions): Promise<void> {
    // Loop so edits made while a save was in flight are saved straight after it.
    while (!equals(latest, saved)) {
      const value = latest;
      const invalid = cfg.validate?.(value) ?? null;
      if (invalid) {
        set({ status: "blocked", message: invalid });
        return;
      }
      set({ status: "saving", message: null });
      try {
        const result = await cfg.save(value, opts);
        // Track what the user typed, not the server's normalised copy (e.g. trimmed
        // title): adopting that mid-typing would eat a trailing space.
        saved = value;
        if (result !== undefined) cfg.onSaved?.(result);
      } catch (err) {
        set({ status: "error", message: err instanceof Error ? err.message : "Couldn't save" });
        return;
      }
    }
    set({ status: "saved", message: null });
  }

  function flush(opts: SaveOptions = { keepalive: false }): Promise<void> {
    cancelTimer();
    if (inFlight) {
      // A save is running; it will pick up the latest value when it finishes.
      return inFlight;
    }
    if (equals(latest, saved)) return Promise.resolve();
    inFlight = runSave(opts).finally(() => {
      inFlight = null;
    });
    return inFlight;
  }

  return {
    update(value) {
      latest = value;
      cancelTimer();
      if (equals(latest, saved)) {
        if (!inFlight) set({ status: current.status === "idle" ? "idle" : "saved", message: null });
        return;
      }
      const invalid = cfg.validate?.(value) ?? null;
      if (invalid) {
        set({ status: "blocked", message: invalid });
        return;
      }
      if (!inFlight) set({ status: "pending", message: null });
      timer = setTimer(() => {
        timer = null;
        void flush();
      }, delay);
    },
    flush,
    hasUnsaved: () => !equals(latest, saved),
    state: () => current,
    dispose() {
      cancelTimer();
      disposed = true;
    },
  };
}
