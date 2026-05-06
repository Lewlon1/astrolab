import type { Transit, FilterType } from "./types";

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const WEEKDAY_LABELS_MON_FIRST = [
  "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
];

export function isPast(dateIso: string, today: Date = new Date()): boolean {
  const transitDate = new Date(dateIso + "T23:59:59");
  return transitDate < today;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatLongDate(dateIso: string): string {
  const d = new Date(dateIso + "T00:00:00");
  return `${WEEKDAY_LABELS_MON_FIRST[
    (d.getDay() + 6) % 7
  ]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShortDate(dateIso: string): string {
  const d = new Date(dateIso + "T00:00:00");
  return `${d.getDate()} ${MONTH_NAMES_SHORT[d.getMonth()]}`;
}

const filterTypeMap: Record<FilterType, Transit["type"] | null> = {
  all: null,
  lunations: "lunation",
  ingresses: "ingress",
  retrogrades: "retrograde",
  aspects: "aspect",
};

export function filterTransits(
  transits: Transit[],
  options: {
    month?: number | null; // 0-11, or null for all months
    type?: FilterType;
    hidePast?: boolean;
    today?: Date;
  } = {}
): Transit[] {
  const { month = null, type = "all", hidePast = false, today = new Date() } = options;
  const typeFilter = filterTypeMap[type];

  return transits.filter((t) => {
    if (hidePast && isPast(t.date, today)) return false;
    if (typeFilter !== null && t.type !== typeFilter) return false;
    if (month !== null) {
      const transitMonth = new Date(t.date + "T00:00:00").getMonth();
      if (transitMonth !== month) return false;
    }
    return true;
  });
}

export function groupByDay(transits: Transit[]): Map<string, Transit[]> {
  const map = new Map<string, Transit[]>();
  const sorted = [...transits].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
  for (const t of sorted) {
    const list = map.get(t.date) ?? [];
    list.push(t);
    map.set(t.date, list);
  }
  return map;
}

// Available months derived from the dataset (0-11).
export function availableMonths(transits: Transit[]): number[] {
  const set = new Set<number>();
  for (const t of transits) {
    set.add(new Date(t.date + "T00:00:00").getMonth());
  }
  return Array.from(set).sort((a, b) => a - b);
}

// Build a 6-row × 7-col Mon-first month grid for the given (year, month).
// Returns 42 cells: { date: Date, inMonth: boolean }.
export function buildMonthGrid(year: number, month: number): Array<{
  date: Date;
  inMonth: boolean;
}> {
  const firstOfMonth = new Date(year, month, 1);
  // JS Sun=0..Sat=6 → convert to Mon=0..Sun=6
  const offset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - offset);

  const cells: Array<{ date: Date; inMonth: boolean }> = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({ date: d, inMonth: d.getMonth() === month });
  }
  return cells;
}

export function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
