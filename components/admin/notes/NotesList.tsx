import Link from "next/link";
import { AREA_LABELS, NOTE_AREAS, type Note } from "@/types/notes";
import AreaChip from "./AreaChip";

export type AreaFilter = (typeof NOTE_AREAS)[number] | "archived" | "";

function href(params: { area?: string; q?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (params.area) sp.set("area", params.area);
  if (params.q) sp.set("q", params.q);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const s = sp.toString();
  return s ? `/admin/notes?${s}` : "/admin/notes";
}

/** All notes: area filter chips, search box, newest first, paged. Server component. */
export default function NotesList({
  notes,
  area,
  q,
  page,
  hasMore,
}: {
  notes: Pick<Note, "id" | "title" | "body" | "area" | "status" | "client_name" | "created_at">[];
  area: AreaFilter;
  q: string;
  page: number;
  hasMore: boolean;
}) {
  const filters: { key: AreaFilter; label: string }[] = [
    { key: "", label: "All" },
    ...NOTE_AREAS.map((a) => ({ key: a as AreaFilter, label: AREA_LABELS[a] })),
    { key: "archived", label: "Archived" },
  ];

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg text-[#1a1a18]">All notes</h2>

      <form action="/admin/notes" method="get" role="search" className="flex gap-2">
        {area && <input type="hidden" name="area" value={area} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search notes"
          aria-label="Search notes"
          className="flex-1 min-w-0 bg-white border border-[#e8e5df] rounded-lg px-3 py-2.5 text-base sm:text-sm text-[#1a1a18] placeholder:text-[#b8b0a4] focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
        <button type="submit" className="shrink-0 text-sm font-medium bg-[#f5f3ef] border border-[#e8e5df] text-[#1a1a18] px-4 rounded-lg">
          Search
        </button>
      </form>

      <div className="-mx-6 px-6 sm:mx-0 sm:px-0 overflow-x-auto">
        <div className="flex gap-2 w-max sm:w-auto sm:flex-wrap pb-1">
          {filters.map((f) => (
            <Link
              key={f.key || "all"}
              href={href({ area: f.key, q })}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap ${
                area === f.key
                  ? "bg-[#1a1a18] text-white border-[#1a1a18]"
                  : "bg-white text-[#6b6560] border-[#e8e5df]"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-[#6b6560] py-4">
          {q ? `Nothing matches “${q}”.` : "No notes here yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id}>
              <Link
                href={`/admin/notes/${n.id}`}
                className="block bg-white border border-[#e8e5df] rounded-xl p-4 hover:bg-[#faf9f7] transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <AreaChip area={n.area} />
                  {n.status === "inbox" && (
                    <span className="text-[11px] text-emerald-700">new</span>
                  )}
                  <span className="ml-auto text-[11px] text-[#b8b0a4] shrink-0">
                    {new Date(n.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <p className="font-medium text-[#1a1a18] truncate">
                  {n.title || "Untitled"}
                  {n.client_name && <span className="font-normal text-[#6b6560]"> · {n.client_name}</span>}
                </p>
                {n.body && <p className="text-sm text-[#6b6560] line-clamp-2 mt-0.5">{n.body}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {(page > 1 || hasMore) && (
        <div className="flex justify-between text-sm pt-1">
          {page > 1 ? (
            <Link href={href({ area, q, page: page - 1 })} className="text-[#6b6560] underline">
              &larr; Newer
            </Link>
          ) : (
            <span />
          )}
          {hasMore && (
            <Link href={href({ area, q, page: page + 1 })} className="text-[#6b6560] underline">
              Older &rarr;
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
