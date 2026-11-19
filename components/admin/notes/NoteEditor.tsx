"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Note, NoteArea, NoteTask } from "@/types/notes";
import { useAutosave } from "@/lib/admin/useAutosave";
import type { AutosaveState } from "@/lib/admin/autosave";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import AreaChip from "./AreaChip";

async function send<T = unknown>(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
  keepalive = false
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    keepalive,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { error?: string }).error ?? `Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const errorText = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong");

const input =
  "w-full min-w-0 rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-base text-[#1a1a18] focus:outline-none focus:border-[#b8b0a4]";
// iOS gives date inputs an intrinsic width that overflows narrow cards; drop the native chrome.
const dateInput = `${input} block max-w-full appearance-none min-h-[44px]`;
const smallBtn =
  "text-sm font-medium px-4 py-2.5 rounded-lg border border-[#e8e5df] bg-white text-[#1a1a18] active:bg-[#f5f3ef] disabled:opacity-40 disabled:cursor-not-allowed";
const primaryBtn =
  "bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg active:bg-emerald-800 disabled:bg-[#d6d1c8] disabled:text-[#6b6560] disabled:cursor-not-allowed";

/** "Saving… / Saved ✓ / Couldn't save — Retry", next to the note so it's always in view. */
function SaveStatus({ state, retry }: { state: AutosaveState; retry: () => void }) {
  const { status, message } = state;
  if (status === "idle") return <span className="text-xs text-[#b8b0a4]">Changes save automatically</span>;
  if (status === "pending" || status === "saving")
    return (
      <span className="text-xs text-[#6b6560]" aria-live="polite">
        Saving…
      </span>
    );
  if (status === "saved")
    return (
      <span className="text-xs text-emerald-700" aria-live="polite">
        Saved ✓
      </span>
    );
  if (status === "blocked")
    return (
      <span className="text-xs text-amber-700" role="status">
        {message}
      </span>
    );
  return (
    <span className="flex items-center gap-2 text-xs text-red-700" role="alert">
      Couldn&apos;t save{message ? `: ${message}` : ""}
      <button type="button" onClick={retry} className="underline font-medium px-1 py-1">
        Retry
      </button>
    </span>
  );
}

/** A textarea that grows with its content, so the whole note is readable without an inner scroll. */
function GrowingTextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={6}
      className={`${input} leading-relaxed resize-none overflow-hidden min-h-[160px]`}
    />
  );
}

function TaskRow({
  task,
  busy,
  onTick,
  onSave,
  onDelete,
}: {
  task: NoteTask;
  busy: boolean;
  onTick: () => void;
  onSave: (patch: { text: string; due_on: string | null }) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(task.text);
  const [due, setDue] = useState(task.due_on ?? "");

  if (editing) {
    return (
      <li className="p-3 space-y-2">
        <input value={text} onChange={(e) => setText(e.target.value)} aria-label="Task text" className={input} />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="Due date"
          className={dateInput}
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={async () => {
              if (await onSave({ text: text.trim(), due_on: due || null })) setEditing(false);
            }}
            className={primaryBtn}
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setText(task.text);
              setDue(task.due_on ?? "");
              setEditing(false);
            }}
            className={smallBtn}
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 p-2">
      <button
        type="button"
        onClick={onTick}
        disabled={busy}
        aria-label={task.done_at ? "Mark not done" : "Mark done"}
        className="shrink-0 w-11 h-11 flex items-center justify-center disabled:opacity-50"
      >
        <span
          className={`w-7 h-7 rounded-md border flex items-center justify-center text-xs ${
            task.done_at ? "bg-emerald-500 border-emerald-500 text-white" : "border-[#d6d1c8] bg-white"
          }`}
        >
          {task.done_at ? "✓" : ""}
        </span>
      </button>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Edit task"
        className="flex-1 min-w-0 text-left text-sm py-2"
      >
        <span className={task.done_at ? "line-through text-[#b8b0a4]" : "text-[#1a1a18]"}>{task.text}</span>
        {task.due_on && <span className="block text-xs text-[#6b6560]">Due {task.due_on}</span>}
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        aria-label="Delete task"
        className="shrink-0 w-11 h-11 text-lg text-[#b8b0a4] active:text-[#6b6560] disabled:opacity-50"
      >
        &times;
      </button>
    </li>
  );
}

type Draft = { title: string; body: string; client: string };

/** One note: original photo(s) beside the typed text (autosaved), to-dos, archive and delete. */
export default function NoteEditor({
  note,
  tasks,
  photos,
  photosUnavailable,
}: {
  note: Note;
  tasks: NoteTask[];
  photos: string[];
  photosUnavailable: boolean;
}) {
  const router = useRouter();
  const [area, setArea] = useState<NoteArea>(note.area);
  const [status, setStatus] = useState(note.status);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [client, setClient] = useState(note.client_name ?? "");
  const [list, setList] = useState(tasks);
  const [newText, setNewText] = useState("");
  const [newDue, setNewDue] = useState("");
  // Separate busy flags, so ticking a to-do never locks the note or other buttons.
  const [areaBusy, setAreaBusy] = useState(false);
  const [busyTasks, setBusyTasks] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const draft = useMemo<Draft>(() => ({ title, body, client }), [title, body, client]);
  const autosave = useAutosave<Draft>(draft, {
    validate: (d) => (d.title.trim() ? null : "Add a title to save"),
    save: (d, { keepalive }) =>
      send<Note>(`/api/admin/notes/${note.id}`, "PATCH", { title: d.title, body: d.body, client_name: d.client }, keepalive),
    onSaved: (updated) => {
      const n = updated as Note | undefined;
      if (n?.status) setStatus(n.status);
    },
  });

  // Pages left after editing (the notes list, Today) should show the new text.
  useEffect(() => () => router.refresh(), [router]);

  const withTask = async (id: string, fn: () => Promise<void>): Promise<boolean> => {
    setBusyTasks((prev) => new Set(prev).add(id));
    setTaskError(null);
    try {
      await fn();
      return true;
    } catch (err) {
      setTaskError(errorText(err));
      return false;
    } finally {
      setBusyTasks((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const changeArea = async (next: NoteArea) => {
    const prev = area;
    setArea(next); // optimistic: the chip changes straight away
    setAreaBusy(true);
    setAreaError(null);
    try {
      const updated = await send<Note>(`/api/admin/notes/${note.id}`, "PATCH", { area: next });
      setStatus(updated.status);
    } catch (err) {
      setArea(prev);
      setAreaError(errorText(err));
    } finally {
      setAreaBusy(false);
    }
  };

  const runAction = async (fn: () => Promise<void>) => {
    setActionBusy(true);
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(errorText(err));
    } finally {
      setActionBusy(false);
    }
  };

  const archive = () =>
    runAction(async () => {
      await autosave.flush();
      await send(`/api/admin/notes/${note.id}`, "PATCH", { status: "archived" });
      router.push("/admin/notes");
    });

  const unarchive = () =>
    runAction(async () => {
      await send(`/api/admin/notes/${note.id}`, "PATCH", { status: "filed" });
      setStatus("filed");
    });

  const remove = () =>
    runAction(async () => {
      await send(`/api/admin/notes/${note.id}`, "DELETE");
      autosave.discard();
      setConfirmDelete(false);
      router.push("/admin/notes");
    });

  const tick = (t: NoteTask) =>
    withTask(t.id, async () => {
      const done = !t.done_at;
      setList((prev) => prev.map((x) => (x.id === t.id ? { ...x, done_at: done ? new Date().toISOString() : null } : x)));
      try {
        await send(`/api/admin/notes/tasks/${t.id}`, "PATCH", { done });
      } catch (err) {
        setList((prev) => prev.map((x) => (x.id === t.id ? { ...x, done_at: t.done_at } : x)));
        throw err;
      }
    });

  const saveTask = (t: NoteTask, patch: { text: string; due_on: string | null }) =>
    withTask(t.id, async () => {
      const updated = await send<NoteTask>(`/api/admin/notes/tasks/${t.id}`, "PATCH", patch);
      setList((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...updated } : x)));
    });

  const deleteTask = (t: NoteTask) =>
    withTask(t.id, async () => {
      await send(`/api/admin/notes/tasks/${t.id}`, "DELETE");
      setList((prev) => prev.filter((x) => x.id !== t.id));
    });

  const addTask = async () => {
    setAdding(true);
    setTaskError(null);
    try {
      const created = await send<NoteTask>("/api/admin/notes/tasks", "POST", {
        note_id: note.id,
        text: newText.trim(),
        due_on: newDue || null,
      });
      setList((prev) => [...prev, created]);
      setNewText("");
      setNewDue("");
    } catch (err) {
      setTaskError(errorText(err));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Sticky so the save status stays in view while typing a long note. */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-[#fafaf8]/95 backdrop-blur flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <AreaChip area={area} onChange={changeArea} disabled={areaBusy} />
          {status === "inbox" && <span className="text-xs text-amber-700">Not checked yet</span>}
          {status === "archived" && <span className="text-xs text-[#6b6560]">Archived</span>}
        </div>
        <SaveStatus state={autosave} retry={autosave.retry} />
      </div>
      {areaError && (
        <p role="alert" className="text-sm text-red-700">
          Couldn&apos;t change the area: {areaError}
        </p>
      )}

      {(photos.length > 0 || photosUnavailable) && (
        <section className="space-y-2" aria-label="Original photo">
          {photos.map((src, i) => (
            <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Original page ${i + 1}`}
                className="w-full rounded-xl border border-[#e8e5df] bg-[#f5f3ef]"
              />
            </a>
          ))}
          {photosUnavailable && <p className="text-sm text-[#6b6560]">Photo unavailable</p>}
        </section>
      )}

      <section className="bg-white border border-[#e8e5df] rounded-xl p-3 sm:p-4 space-y-3">
        <label className="block space-y-1">
          <span className="text-xs text-[#6b6560]">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-[#6b6560]">Client</span>
          <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Optional" className={input} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-[#6b6560]">Note</span>
          <GrowingTextarea value={body} onChange={setBody} />
        </label>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-lg text-[#1a1a18]">To-dos</h2>
        {list.length > 0 && (
          <ul className="bg-white border border-[#e8e5df] rounded-xl divide-y divide-[#f0ede8]">
            {list.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                busy={busyTasks.has(t.id)}
                onTick={() => void tick(t)}
                onSave={(patch) => saveTask(t, patch)}
                onDelete={() => void deleteTask(t)}
              />
            ))}
          </ul>
        )}
        <div className="bg-white border border-[#e8e5df] rounded-xl p-3 space-y-2">
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newText.trim() && !adding) void addTask();
            }}
            enterKeyHint="done"
            placeholder="Add a to-do"
            aria-label="New to-do"
            className={input}
          />
          <div className="flex gap-2 min-w-0">
            <div className="flex-1 min-w-0">
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                aria-label="New to-do due date"
                className={dateInput}
              />
            </div>
            <button
              type="button"
              onClick={() => void addTask()}
              disabled={adding || !newText.trim()}
              className={`${primaryBtn} shrink-0`}
            >
              {adding ? "Adding…" : "Add"}
            </button>
          </div>
        </div>
        {taskError && (
          <p role="alert" className="text-sm text-red-700">
            {taskError}
          </p>
        )}
      </section>

      <div className="space-y-2 pt-2">
        <div className="flex gap-3">
          {status === "archived" ? (
            <button type="button" onClick={() => void unarchive()} disabled={actionBusy} className={smallBtn}>
              Unarchive
            </button>
          ) : (
            <button type="button" onClick={() => void archive()} disabled={actionBusy} className={smallBtn}>
              Archive
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={actionBusy}
            className="text-sm font-medium px-4 py-2.5 rounded-lg border border-red-200 bg-white text-red-700 disabled:opacity-40"
          >
            Delete
          </button>
        </div>
        {actionError && (
          <p role="alert" className="text-sm text-red-700">
            {actionError}
          </p>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        title="Delete this note?"
        message="The note and its to-dos will be deleted. This can't be undone."
        loading={actionBusy}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
