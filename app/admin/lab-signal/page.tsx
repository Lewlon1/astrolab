// Admin: which Lab readings people identify with. Reads lab_reading_signal_summary
// (migration 018) through RLS, so only admins get rows. The signal ladder is
// thumbs (±1) -> signed up (+2) -> clicked a booking button (+3) -> booked (+5).
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth/admin";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import {
  approval,
  pick,
  sortSignal,
  SIGNAL_LEVELS,
  SIGNAL_SORTS,
  type SignalLevel,
  type SignalRow,
  type SignalSort,
} from "@/lib/lab/signal";

export const dynamic = "force-dynamic";

const LEVEL_LABELS: Record<SignalLevel, string> = { card: "By card", relation: "Card × relation", sun: "Card × Sun sign" };
const SORT_LABELS: Record<SignalSort, string> = { score: "Score", votes: "Votes", approval: "% 👍", bookings: "Bookings" };

const TAB = "rounded-full border px-3 py-1.5 text-sm";
const TAB_ON = "border-deep bg-deep text-white";
const TAB_OFF = "border-[#e8e5df] bg-white text-[#1a1a18] hover:border-deep";
const TH = "px-3 py-2 text-left font-medium text-[#6b6560] whitespace-nowrap";
const TD = "px-3 py-2 whitespace-nowrap tabular-nums";

export default async function LabSignalPage({ searchParams }: { searchParams: { level?: string; sort?: string } }) {
  const level = pick(searchParams.level, SIGNAL_LEVELS, "card");
  const sort = pick(searchParams.sort, SIGNAL_SORTS, "score");
  const supabase = await createClient();
  const { isAdmin } = await getAdminUser(supabase);
  if (!isAdmin) return null;

  const { data, error } = await supabase.from("lab_reading_signal_summary").select("*").returns<SignalRow[]>();
  if (error) console.error("[admin] lab signal read failed, code", error.code);
  const rows = sortSignal(data ?? [], level, sort);
  const href = (l: SignalLevel, s: SignalSort) => `/admin/lab-signal?level=${l}&sort=${s}`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Lab signal"
        description="Which readings land. Score: 👎 −1, 👍 +1, signed up +2, clicked book +3, booked +5 (bookings matched by email, after sign-up)."
      />

      <nav aria-label="Grouping" className="flex flex-wrap gap-2">
        {SIGNAL_LEVELS.map((l) => (
          <Link key={l} href={href(l, sort)} aria-current={l === level ? "page" : undefined} className={`${TAB} ${l === level ? TAB_ON : TAB_OFF}`}>
            {LEVEL_LABELS[l]}
          </Link>
        ))}
      </nav>

      {error ? (
        <p className="text-[#6b6560]">The signal views aren&apos;t available. Has migration 018 been run?</p>
      ) : rows.length === 0 ? (
        <p className="text-[#6b6560]">No votes yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e8e5df] bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-[#e8e5df]">
              <tr>
                <th className={TH}>Card</th>
                {level === "relation" && <th className={TH}>Relation</th>}
                {level === "sun" && <th className={TH}>Sun</th>}
                {SIGNAL_SORTS.map((s) => (
                  <th key={s} className={TH} aria-sort={s === sort ? "descending" : undefined}>
                    <Link href={href(level, s)} className={s === sort ? "text-deep underline" : "hover:underline"}>
                      {SORT_LABELS[s]}
                    </Link>
                  </th>
                ))}
                <th className={TH}>👍 / 👎</th>
                <th className={TH}>Signed up</th>
                <th className={TH}>Clicked book</th>
                <th className={TH}>Paid</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const a = approval(r);
                return (
                  <tr key={`${r.card}|${r.relation}|${r.sun_sign}`} className="border-b border-[#f1efea] last:border-0">
                    <td className="px-3 py-2 whitespace-nowrap">{r.card}</td>
                    {level === "relation" && <td className={TD}>{r.relation}</td>}
                    {level === "sun" && <td className={TD}>{r.sun_sign}</td>}
                    <td className={`${TD} font-medium`}>{r.score}</td>
                    <td className={TD}>{r.votes}</td>
                    <td className={TD}>{a === null ? "–" : `${Math.round(a * 100)}%`}</td>
                    <td className={TD}>{r.bookings}</td>
                    <td className={TD}>{r.ups} / {r.downs}</td>
                    <td className={TD}>{r.signups}</td>
                    <td className={TD}>{r.booking_clicks}</td>
                    <td className={TD}>{r.paid}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
