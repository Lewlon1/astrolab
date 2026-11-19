import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isMissingTable } from "@/lib/notes/errors";
import type { Note, NoteCapture, NoteTask } from "@/types/notes";
import NoteEditor from "@/components/admin/notes/NoteEditor";

export const dynamic = "force-dynamic";

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e8e5df] rounded-xl p-5 text-sm text-[#6b6560]">{children}</div>
  );
}

export default async function NoteDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: note, error } = await supabase
    .from("notes")
    .select("*, note_tasks(*)")
    .eq("id", params.id)
    .order("created_at", { referencedTable: "note_tasks", ascending: true })
    .maybeSingle<Note & { note_tasks: NoteTask[] }>();

  let content: React.ReactNode;
  if (error) {
    content = isMissingTable(error) ? (
      <Panel>Notes isn&apos;t set up yet — run migrations 019 and 019b in the Supabase SQL editor.</Panel>
    ) : (
      <Panel>Couldn&apos;t load this note: {error.message}</Panel>
    );
  } else {
    if (!note) notFound();
    const { note_tasks, ...rest } = note;

    let photos: string[] = [];
    let photosUnavailable = false;
    if (rest.capture_id) {
      const { data: capture } = await supabase
        .from("note_captures")
        .select("photo_paths")
        .eq("id", rest.capture_id)
        .maybeSingle<Pick<NoteCapture, "photo_paths">>();
      const paths = capture?.photo_paths ?? [];
      if (paths.length > 0) {
        try {
          const { data: signed, error: signError } = await supabase.storage
            .from("note-photos")
            .createSignedUrls(paths, 3600);
          const urls = (signed ?? []).flatMap((s) => (s.signedUrl && !s.error ? [s.signedUrl] : []));
          if (signError || urls.length < paths.length) photosUnavailable = true;
          photos = urls;
        } catch {
          photosUnavailable = true;
        }
      }
    }

    content = (
      <NoteEditor note={rest} tasks={note_tasks ?? []} photos={photos} photosUnavailable={photosUnavailable} />
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24 md:pb-8">
      <Link href="/admin/notes" className="inline-block text-sm text-[#6b6560] underline">
        &larr; Back to notes
      </Link>
      {content}
    </div>
  );
}
