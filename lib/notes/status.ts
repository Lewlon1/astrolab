import type { CaptureStatus, Note, NoteCapture, NoteTask } from "@/types/notes";

export const STALE_MS = 5 * 60 * 1000;

/** A capture stuck in "processing" for over 5 minutes is treated as failed. */
export function effectiveStatus(
  c: Pick<NoteCapture, "status" | "created_at">,
  now: Date = new Date()
): CaptureStatus {
  if (
    c.status === "processing" &&
    now.getTime() - new Date(c.created_at).getTime() > STALE_MS
  ) {
    return "failed";
  }
  return c.status;
}

export type TodoWithNote = NoteTask & {
  note: Pick<Note, "id" | "title" | "area" | "status">;
};

/** Open tasks (not done, note not archived): dated by due_on asc (ties: older created first), then undated newest first. */
export function openTodos(tasks: TodoWithNote[]): TodoWithNote[] {
  return tasks
    .filter((t) => !t.done_at && t.note.status !== "archived")
    .sort((a, b) => {
      if (a.due_on && b.due_on) {
        if (a.due_on !== b.due_on) return a.due_on < b.due_on ? -1 : 1;
        return a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0;
      }
      if (a.due_on) return -1;
      if (b.due_on) return 1;
      return a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0;
    });
}

/** Open tasks that are overdue or due today (ISO date strings). */
export function todayTodos(tasks: TodoWithNote[], today: string): TodoWithNote[] {
  return openTodos(tasks).filter((t) => t.due_on !== null && t.due_on <= today);
}
