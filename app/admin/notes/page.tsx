import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isMissingTable, type QueryError } from "@/lib/notes/errors";
import { effectiveStatus, openTodos, type TodoWithNote } from "@/lib/notes/status";
import { todayInMadrid } from "@/lib/dailyActions";
import { NOTE_AREAS, type Note, type NoteCapture, type NoteTask } from "@/types/notes";
import CaptureButton, { PendingCaptures } from "@/components/admin/notes/CaptureButton";
import InboxCard from "@/components/admin/notes/InboxCard";
import NotesList, { type AreaFilter } from "@/components/admin/notes/NotesList";
import TodoList from "@/components/admin/notes/TodoList";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e8e5df] rounded-xl p-5 text-sm text-[#6b6560]">{children}</div>
  );
}

type SearchParams = { view?: string; area?: string; q?: string; page?: string };

export default async function NotesPage({ searchParams }: { searchParams: SearchParams }) {
  const view = searchParams.view === "todos" ? "todos" : "notes";
  const supabase = await createClient();

  let body: React.ReactNode;
  let errors: QueryError[];

  if (view === "todos") {
    const { data, error } = await supabase
      .from("note_tasks")
      .select("*, note:notes!inner(id, title, area, status)")
      .is("done_at", null)
      .returns<TodoWithNote[]>();
    errors = [error];
    body = <TodoList todos={openTodos(data ?? [])} today={todayInMadrid()} />;
  } else {
    const area: AreaFilter =
      searchParams.area === "archived" || (NOTE_AREAS as readonly string[]).includes(searchParams.area ?? "")
        ? (searchParams.area as AreaFilter)
        : "";
    const q = (searchParams.q ?? "").trim().slice(0, 200);
    const page = Math.max(1, Math.floor(Number(searchParams.page)) || 1);

    let list = supabase
      .from("notes")
      .select("id, title, body, area, status, client_name, created_at");
    if (area === "archived") list = list.eq("status", "archived");
    else {
      list = list.neq("status", "archived");
      if (area) list = list.eq("area", area);
      // Unfiltered, inbox notes already show in the Inbox above — don't list them twice.
      if (!q && !area) list = list.neq("status", "inbox");
    }
    if (q) list = list.textSearch("search", q, { config: "simple", type: "websearch" });

    const [captures, inbox, all] = await Promise.all([
      supabase
        .from("note_captures")
        .select("id, status, error, photo_paths, created_at, started_at")
        .in("status", ["processing", "failed"])
        .order("created_at", { ascending: false })
        .limit(20)
        .returns<Pick<NoteCapture, "id" | "status" | "error" | "photo_paths" | "created_at" | "started_at">[]>(),
      supabase
        .from("notes")
        .select("*, note_tasks(*)")
        .eq("status", "inbox")
        .order("created_at", { ascending: false })
        .order("created_at", { referencedTable: "note_tasks", ascending: true })
        .returns<(Note & { note_tasks: NoteTask[] })[]>(),
      list
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE) // one extra row tells us there is a next page
        .returns<Note[]>(),
    ]);
    errors = [captures.error, inbox.error, all.error];

    const now = new Date();
    const pending = (captures.data ?? []).flatMap((c) => {
      const status = effectiveStatus(c, now);
      return status === "done"
        ? []
        : [{ id: c.id, status, error: c.error, created_at: c.created_at, pages: c.photo_paths.length }];
    });
    const rows = all.data ?? [];
    const inboxNotes = inbox.data ?? [];

    body = (
      <div className="space-y-8">
        <div className="space-y-3">
          <CaptureButton />
          <PendingCaptures captures={pending} />
        </div>

        {inboxNotes.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-heading text-lg text-[#1a1a18]">Inbox</h2>
              <span className="text-sm text-[#6b6560]">{inboxNotes.length} to check</span>
            </div>
            {inboxNotes.map(({ note_tasks, ...note }) => (
              // Keyed on its task ids so the card's seeded task state resets
              // when tasks are added or removed elsewhere (e.g. the detail page).
              <InboxCard
                key={note.id + ":" + (note_tasks ?? []).map((t) => t.id).join(",")}
                note={note}
                tasks={note_tasks ?? []}
              />
            ))}
          </section>
        )}

        <NotesList
          notes={rows.slice(0, PAGE_SIZE)}
          area={area}
          q={q}
          page={page}
          hasMore={rows.length > PAGE_SIZE}
        />
      </div>
    );
  }

  if (errors.some(isMissingTable)) {
    body = (
      <Panel>
        Notes isn&apos;t set up yet — run migrations 019 and 019b in the Supabase SQL editor.
      </Panel>
    );
  } else {
    const failed = errors.find((e) => e);
    if (failed) body = <Panel>Couldn&apos;t load notes: {failed.message}</Panel>;
  }

  const tab = (key: "notes" | "todos", label: string) => (
    <Link
      href={key === "notes" ? "/admin/notes" : "/admin/notes?view=todos"}
      aria-current={view === key ? "page" : undefined}
      className={`flex-1 text-center text-sm font-medium py-2 rounded-lg transition-colors ${
        view === key ? "bg-white text-[#1a1a18] shadow-sm" : "text-[#6b6560]"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-[#6b6560] hover:text-[#1a1a18]">
          &larr; Today
        </Link>
        <h1 className="font-heading text-2xl text-[#1a1a18] mt-1">Notes</h1>
        <p className="text-[#6b6560] mt-1">Snap a paper page; it&apos;s typed up and filed for you.</p>
      </div>

      <nav className="flex gap-1 p-1 bg-[#f5f3ef] rounded-xl" aria-label="Notes view">
        {tab("notes", "Notes")}
        {tab("todos", "To-dos")}
      </nav>

      {body}
    </div>
  );
}
