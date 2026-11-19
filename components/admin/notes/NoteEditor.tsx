"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Note, NoteArea, NoteTask } from "@/types/notes";
import AreaChip from "./AreaChip";

async function send<T = unknown>(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { error?: string }).error ?? `Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const input =
  "w-full rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-base text-[#1a1a18] focus:outline-none focus:border-[#b8b0a4]";
const smallBtn =
  "text-sm font-medium px-4 py-2.5 rounded-lg border border-[#e8e5df] bg-white text-[#1a1a18] disabled:opacity-60";

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
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Task text"
          className={input}
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="Due date"
          className={input}
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={async () => {
              if (await onSave({ text: text.trim(), due_on: due || null })) setEditing(false);
            }}
            className="bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg disabled:opacity-60"
          >
            Save
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
    <li className="flex items-center gap-2 p-3">
      <button
        type="button"
        onClick={onTick}
        disabled={busy}
        aria-label={task.done_at ? "Mark not done" : "Mark done"}
        className={`shrink-0 w-7 h-7 rounded-md border flex items-center justify-center text-xs ${
          task.done_at ? "bg-emerald-500 border-emerald-500 text-white" : "border-[#d6d1c8] bg-white"
        }`}
      >
        {task.done_at ? "✓" : ""}
      </button>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Edit task"
        className="flex-1 min-w-0 text-left text-sm py-1"
      >
        <span className={task.done_at ? "line-through text-[#b8b0a4]" : "text-[#1a1a18]"}>{task.text}</span>
        {task.due_on && <span className="block text-xs text-[#6b6560]">Due {task.due_on}</span>}
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        aria-label="Delete task"
        className="shrink-0 w-10 h-10 text-lg text-[#b8b0a4] hover:text-[#6b6560]"
      >
        &times;
      </button>
    </li>
  );
}

/** One note: original photo(s) beside the typed text, with editing, to-dos, archive and delete. */
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
  const [saved, setSaved] = useState({ title: note.title, body: note.body, client: note.client_name ?? "" });
  const [list, setList] = useState(tasks);
  const [newText, setNewText] = useState("");
  const [newDue, setNewDue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const dirty = title !== saved.title || body !== saved.body || client !== saved.client;

  async function run(fn: () => Promise<void>): Promise<boolean> {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const saveText = () =>
    run(async () => {
      const updated = await send<Note>(`/api/admin/notes/${note.id}`, "PATCH", {
        title,
        body,
        client_name: client,
      });
      setSaved({ title: updated.title, body: updated.body, client: updated.client_name ?? "" });
      setTitle(updated.title);
      setClient(updated.client_name ?? "");
      setStatus(updated.status);
      setNotice("Saved");
      router.refresh();
    });

  const changeArea = (next: NoteArea) =>
    run(async () => {
      const updated = await send<Note>(`/api/admin/notes/${note.id}`, "PATCH", { area: next });
      setArea(next);
      setStatus(updated.status);
      router.refresh();
    });

  const archive = () =>
    run(async () => {
      await send(`/api/admin/notes/${note.id}`, "PATCH", { status: "archived" });
      router.push("/admin/notes");
      router.refresh();
    });

  const unarchive = () =>
    run(async () => {
      await send(`/api/admin/notes/${note.id}`, "PATCH", { status: "filed" });
      setStatus("filed");
      router.refresh();
    });

  const remove = async () => {
    if (!window.confirm("Delete this note and its to-dos? This can't be undone.")) return;
    await run(async () => {
      await send(`/api/admin/notes/${note.id}`, "DELETE");
      router.push("/admin/notes");
      router.refresh();
    });
  };

  const tick = (t: NoteTask) =>
    run(async () => {
      const done = !t.done_at;
      await send(`/api/admin/notes/tasks/${t.id}`, "PATCH", { done });
      setList((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, done_at: done ? new Date().toISOString() : null } : x))
      );
      router.refresh();
    });

  const saveTask = (t: NoteTask, patch: { text: string; due_on: string | null }) =>
    run(async () => {
      const updated = await send<NoteTask>(`/api/admin/notes/tasks/${t.id}`, "PATCH", patch);
      setList((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...updated } : x)));
      router.refresh();
    });

  const deleteTask = (t: NoteTask) =>
    run(async () => {
      await send(`/api/admin/notes/tasks/${t.id}`, "DELETE");
      setList((prev) => prev.filter((x) => x.id !== t.id));
      router.refresh();
    });

  const addTask = () =>
    run(async () => {
      const created = await send<NoteTask>("/api/admin/notes/tasks", "POST", {
        note_id: note.id,
        text: newText.trim(),
        due_on: newDue || null,
      });
      setList((prev) => [...prev, created]);
      setNewText("");
      setNewDue("");
      router.refresh();
    });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <AreaChip area={area} onChange={changeArea} disabled={busy} />
        {status === "inbox" && <span className="text-xs text-amber-700">Not checked yet</span>}
        {status === "archived" && <span className="text-xs text-[#6b6560]">Archived</span>}
      </div>

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

      <section className="bg-white border border-[#e8e5df] rounded-xl p-4 space-y-3">
        <label className="block space-y-1">
          <span className="text-xs text-[#6b6560]">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-[#6b6560]">Client</span>
          <input
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Optional"
            className={input}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-[#6b6560]">Note</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className={`${input} leading-relaxed`}
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={saveText}
            disabled={busy || !dirty || !title.trim()}
            className="bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-60"
          >
            Save changes
          </button>
          {notice && <span className="text-sm text-emerald-700">{notice}</span>}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-lg text-[#1a1a18]">To-dos</h2>
        {list.length > 0 && (
          <ul className="bg-white border border-[#e8e5df] rounded-xl divide-y divide-[#f0ede8]">
            {list.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                busy={busy}
                onTick={() => tick(t)}
                onSave={(patch) => saveTask(t, patch)}
                onDelete={() => deleteTask(t)}
              />
            ))}
          </ul>
        )}
        <div className="bg-white border border-[#e8e5df] rounded-xl p-3 space-y-2">
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add a to-do"
            aria-label="New to-do"
            className={input}
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
              aria-label="New to-do due date"
              className={input}
            />
            <button
              type="button"
              onClick={addTask}
              disabled={busy || !newText.trim()}
              className={`${smallBtn} shrink-0`}
            >
              Add
            </button>
          </div>
        </div>
      </section>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      <div className="flex gap-3 pt-2">
        {status === "archived" ? (
          <button type="button" onClick={unarchive} disabled={busy} className={smallBtn}>
            Unarchive
          </button>
        ) : (
          <button type="button" onClick={archive} disabled={busy} className={smallBtn}>
            Archive
          </button>
        )}
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="text-sm font-medium px-4 py-2.5 rounded-lg border border-red-200 bg-white text-red-700 disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
