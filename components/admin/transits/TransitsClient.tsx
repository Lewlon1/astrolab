"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { transits as TRANSITS } from "@/lib/transits/transits-data";
import {
  availableMonths,
  dateToIso,
  filterTransits,
} from "@/lib/transits/utils";
import type {
  Transit,
  FilterType,
  TransitDraftRow,
  TransitHoroscopeRow,
  Pillar,
  Format,
  Language,
  HoroscopeRead,
} from "@/lib/transits/types";
import Toast from "@/components/admin/ui/Toast";
import TodaySnapshot from "./TodaySnapshot";
import MonthBar from "./MonthBar";
import FilterBar from "./FilterBar";
import TimelineView from "./TimelineView";
import CalendarView from "./CalendarView";
import DraftsView from "./DraftsView";
import DetailDrawer from "./DetailDrawer";
import DraftModal from "./DraftModal";
import HoroscopeModal from "./HoroscopeModal";

type Tab = "timeline" | "calendar" | "drafts";

const TABS: { value: Tab; label: string }[] = [
  { value: "timeline", label: "Timeline" },
  { value: "calendar", label: "Calendar" },
  { value: "drafts", label: "Drafts" },
];

export default function TransitsClient() {
  const supabase = useMemo(() => createClient(), []);

  // Shared filter state (persists across Timeline ↔ Calendar tab switches).
  const [activeTab, setActiveTab] = useState<Tab>("timeline");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [hidePast, setHidePast] = useState(true);

  // Calendar's own month nav (independent of MonthBar's filter).
  const today = useMemo(() => new Date(), []);
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());

  // Selected transit + modal state.
  const [selected, setSelected] = useState<Transit | null>(null);
  const [draftTransit, setDraftTransit] = useState<Transit | null>(null);
  const [horoscopeTransit, setHoroscopeTransit] = useState<Transit | null>(null);

  // Persistence state.
  const [drafts, setDrafts] = useState<TransitDraftRow[]>([]);
  const [bundles, setBundles] = useState<TransitHoroscopeRow[]>([]);
  const [persistenceLoading, setPersistenceLoading] = useState(true);

  // Toast.
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showSuccess = useCallback(
    (message: string) => setToast({ message, type: "success" }),
    []
  );
  const showError = useCallback(
    (message: string) => setToast({ message, type: "error" }),
    []
  );

  // Load saved drafts + bundles on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPersistenceLoading(true);
      const [draftsRes, bundlesRes] = await Promise.all([
        supabase
          .from("transit_drafts")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("transit_horoscopes")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      if (draftsRes.error) {
        showError(`Couldn't load drafts: ${draftsRes.error.message}`);
      } else {
        setDrafts((draftsRes.data ?? []) as TransitDraftRow[]);
      }
      if (bundlesRes.error) {
        showError(`Couldn't load bundles: ${bundlesRes.error.message}`);
      } else {
        setBundles((bundlesRes.data ?? []) as TransitHoroscopeRow[]);
      }
      setPersistenceLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, showError]);

  const months = useMemo(() => availableMonths(TRANSITS), []);

  const filtered = useMemo(
    () =>
      filterTransits(TRANSITS, {
        month: selectedMonth,
        type: filterType,
        hidePast,
        today,
      }),
    [selectedMonth, filterType, hidePast, today]
  );

  // For CalendarView: when "All" is selected in MonthBar, the calendar still
  // shows ONE month at a time controlled by its own nav. When a specific
  // month is selected in MonthBar, sync the calendar to it.
  useEffect(() => {
    if (selectedMonth !== null) {
      setCalendarMonth(selectedMonth);
    }
  }, [selectedMonth]);

  const todayIso = dateToIso(today);
  const todayTransits = useMemo(
    () => TRANSITS.filter((t) => t.date === todayIso),
    [todayIso]
  );

  const handleSaveDraft = useCallback(
    async ({
      content,
      pillar,
      format,
      language,
      angle,
      transit,
    }: {
      content: string;
      pillar: Pillar;
      format: Format;
      language: Language;
      angle: string;
      transit: Transit;
    }) => {
      const { error } = await supabase.from("transit_drafts").insert({
        transit_id: transit.id,
        transit_title: transit.title,
        transit_date: transit.date,
        pillar,
        format,
        language,
        angle: angle || null,
        content,
      });
      if (error) {
        showError(`Save failed: ${error.message}`);
        return;
      }
      const { data: refreshed } = await supabase
        .from("transit_drafts")
        .select("*")
        .order("created_at", { ascending: false });
      setDrafts((refreshed ?? []) as TransitDraftRow[]);
      showSuccess("Draft saved");
      setDraftTransit(null);
      setSelected(null);
      setActiveTab("drafts");
    },
    [supabase, showSuccess, showError]
  );

  const handleSaveBundle = useCallback(
    async ({
      reads,
      language,
      transit,
    }: {
      reads: HoroscopeRead[];
      language: Language;
      transit: Transit;
    }) => {
      const { error } = await supabase.from("transit_horoscopes").insert({
        transit_id: transit.id,
        transit_title: transit.title,
        transit_date: transit.date,
        language,
        reads,
      });
      if (error) {
        showError(`Save failed: ${error.message}`);
        return;
      }
      const { data: refreshed } = await supabase
        .from("transit_horoscopes")
        .select("*")
        .order("created_at", { ascending: false });
      setBundles((refreshed ?? []) as TransitHoroscopeRow[]);
      showSuccess("Bundle saved");
      setHoroscopeTransit(null);
      setSelected(null);
      setActiveTab("drafts");
      // Scroll to bundles section after the tab change paints.
      setTimeout(() => {
        document
          .getElementById("bundles")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    },
    [supabase, showSuccess, showError]
  );

  const handleDeleteDraft = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("transit_drafts").delete().eq("id", id);
      if (error) {
        showError(`Delete failed: ${error.message}`);
        return;
      }
      setDrafts((cur) => cur.filter((d) => d.id !== id));
      showSuccess("Draft deleted");
    },
    [supabase, showSuccess, showError]
  );

  const handleDeleteBundle = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("transit_horoscopes")
        .delete()
        .eq("id", id);
      if (error) {
        showError(`Delete failed: ${error.message}`);
        return;
      }
      setBundles((cur) => cur.filter((b) => b.id !== id));
      showSuccess("Bundle deleted");
    },
    [supabase, showSuccess, showError]
  );

  return (
    <div className="space-y-6 mt-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Tab switcher */}
      <div className="border-b border-[#e8e5df] flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value)}
            className={`text-sm font-medium px-4 py-2.5 -mb-px border-b-2 transition-colors ${
              activeTab === t.value
                ? "border-deep text-deep"
                : "border-transparent text-[#6b6560] hover:text-[#1a1a18]"
            }`}
          >
            {t.label}
            {t.value === "drafts" && (drafts.length + bundles.length) > 0 && (
              <span className="ml-1.5 text-[11px] text-[#b8b0a4]">
                ({drafts.length + bundles.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {(activeTab === "timeline" || activeTab === "calendar") && (
        <>
          <TodaySnapshot transits={todayTransits} onSelect={setSelected} />
          <div className="space-y-3">
            <MonthBar
              availableMonths={months}
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
              hidePast={hidePast}
              onHidePastChange={setHidePast}
            />
            <FilterBar selected={filterType} onChange={setFilterType} />
          </div>
        </>
      )}

      {activeTab === "timeline" && (
        <TimelineView transits={filtered} onSelect={setSelected} />
      )}

      {activeTab === "calendar" && (
        <CalendarView
          transits={filtered}
          year={calendarYear}
          month={calendarMonth}
          onMonthChange={(y, m) => {
            setCalendarYear(y);
            setCalendarMonth(m);
            // Switching the calendar's own month doesn't disturb MonthBar's
            // "All" state — but if MonthBar has a specific month selected
            // and the user navigates away from it, clear MonthBar to "All"
            // so the filter doesn't silently empty the grid.
            if (selectedMonth !== null && selectedMonth !== m) {
              setSelectedMonth(null);
            }
          }}
          onSelect={setSelected}
        />
      )}

      {activeTab === "drafts" && (
        <DraftsView
          drafts={drafts}
          bundles={bundles}
          loading={persistenceLoading}
          onDeleteDraft={handleDeleteDraft}
          onDeleteBundle={handleDeleteBundle}
        />
      )}

      <DetailDrawer
        transit={selected}
        onClose={() => setSelected(null)}
        onDraft={() => {
          if (selected) setDraftTransit(selected);
        }}
        onHoroscope={() => {
          if (selected) setHoroscopeTransit(selected);
        }}
      />

      <DraftModal
        transit={draftTransit}
        onClose={() => setDraftTransit(null)}
        onSaved={handleSaveDraft}
        onError={showError}
        onSuccess={showSuccess}
      />

      <HoroscopeModal
        transit={horoscopeTransit}
        onClose={() => setHoroscopeTransit(null)}
        onSaved={handleSaveBundle}
        onError={showError}
        onSuccess={showSuccess}
      />
    </div>
  );
}
