import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Lead, Event, ActionItem } from "@/types";
import type { Booking } from "@/lib/payments/types";
import { needsAttention } from "@/lib/payments/bookingView";
import { getOrCreateTodayBatch } from "@/lib/dailyActions";
import GetPaidCard from "@/components/admin/today/GetPaidCard";
import TodayChecklist from "@/components/admin/today/TodayChecklist";
import {
  timeAgo,
  leadStatusColors,
  leadSourceColors,
  formatStatus,
  formatSource,
} from "@/lib/utils";

const eventTypeColors: Record<string, string> = {
  workshop: "bg-deep",
  cosmic_tasters: "bg-purple-500",
  collab: "bg-ocean",
  popup: "bg-coral",
};

// Grouped to match the nav (components/admin/navConfig.ts).
const quickActions = [
  { label: "Plan transit posts", href: "/admin/transits", group: "Content" },
  { label: "Repurpose last post", href: "/admin/repurpose", group: "Content" },
  { label: "Write a blog post", href: "/admin/blog/new", group: "Website" },
  { label: "Edit services & prices", href: "/admin/services", group: "Website" },
  { label: "Add a testimonial", href: "/admin/testimonials", group: "Website" },
  { label: "Create an event", href: "/admin/events/new", group: "Website" },
];

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  // Opening the home screen generates today's batch (previously only Lead Queue did).
  // Any failure (e.g. a missing table) hides the checklist instead of breaking the page.
  const todayItems: Promise<ActionItem[] | null> = getOrCreateTodayBatch(supabase)
    .then((b) => b.items)
    .catch(() => null);

  const [
    { count: leadsThisWeek },
    { count: totalLeads },
    { data: recentLeads },
    { count: upcomingEventsCount },
    { data: upcomingEvents },
    { data: bookings },
    { count: paidBookings30d },
    actionItems,
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString()),
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<Lead[]>(),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("date", new Date().toISOString()),
    supabase
      .from("events")
      .select("*")
      .gte("date", new Date().toISOString())
      .order("date")
      .limit(3)
      .returns<Event[]>(),
    supabase
      .from("bookings")
      .select("*")
      .order("start_time", { ascending: true, nullsFirst: true })
      .returns<Booking[]>(),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .in("payment_status", ["paid", "manual"])
      .gte("paid_at", monthAgo.toISOString()),
    todayItems,
  ]);

  const attentionBookings = (bookings ?? []).filter(needsAttention);

  const metrics = [
    { label: "Leads this week", value: leadsThisWeek ?? 0 },
    { label: "Total subscribers", value: totalLeads ?? 0 },
    { label: "Paid bookings (30 days)", value: paidBookings30d ?? 0 },
    { label: "Upcoming events", value: upcomingEventsCount ?? 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="font-heading text-2xl text-[#1a1a18]">
          Welcome back, Gabs
        </h1>
        <p className="text-[#6b6560] mt-1">
          Work down this page and you&apos;re done for the day
        </p>
      </div>

      <GetPaidCard bookings={attentionBookings} />

      <TodayChecklist initialItems={actionItems} />

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white border border-[#e8e5df] rounded-xl p-5"
          >
            <p className="text-sm text-[#6b6560]">{metric.label}</p>
            <p className="text-2xl font-medium mt-1 text-[#1a1a18]">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recent leads */}
        <div className="lg:col-span-2 bg-white border border-[#e8e5df] rounded-xl p-6">
          <h2 className="font-heading text-lg text-[#1a1a18] mb-4">
            Recent leads
          </h2>

          {recentLeads && recentLeads.length > 0 ? (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between py-2 border-b border-[#f0ede8] last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1a1a18] truncate">
                        {lead.name || "Anonymous"}
                      </p>
                      <p className="text-xs text-[#6b6560] truncate">
                        {lead.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {lead.source && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full ${
                          leadSourceColors[lead.source]?.bg ?? "bg-slate-100"
                        } ${
                          leadSourceColors[lead.source]?.text ??
                          "text-slate-600"
                        }`}
                      >
                        {formatSource(lead.source)}
                      </span>
                    )}
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full ${
                        leadStatusColors[lead.status]?.bg ?? "bg-slate-100"
                      } ${
                        leadStatusColors[lead.status]?.text ?? "text-slate-600"
                      }`}
                    >
                      {formatStatus(lead.status)}
                    </span>
                    <span className="text-[11px] text-[#b8b0a4] w-14 text-right">
                      {timeAgo(lead.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#b8b0a4]">No leads yet</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-[#e8e5df] rounded-xl p-6">
          <h2 className="font-heading text-lg text-[#1a1a18] mb-4">
            Quick actions
          </h2>
          <div className="space-y-1">
            {quickActions.map((action, i) => (
              <div key={action.href}>
                {action.group !== quickActions[i - 1]?.group && (
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#b8b0a4] px-3 pt-2 pb-1">
                    {action.group}
                  </p>
                )}
                <Link
                  href={action.href}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm text-[#1a1a18] hover:bg-[#f5f3ef] transition-colors group"
                >
                  <span>{action.label}</span>
                  <span className="text-[#b8b0a4] group-hover:text-[#6b6560] transition-colors">
                    &rarr;
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming events */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <div className="bg-white border border-[#e8e5df] rounded-xl p-6">
          <h2 className="font-heading text-lg text-[#1a1a18] mb-4">
            Upcoming events
          </h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3">
                <div
                  className={`w-1 h-10 rounded-full ${
                    eventTypeColors[event.event_type ?? "workshop"] ?? "bg-deep"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-[#1a1a18]">
                    {event.title}
                  </p>
                  <p className="text-xs text-[#6b6560]">
                    {event.date
                      ? new Date(event.date).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "TBC"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
