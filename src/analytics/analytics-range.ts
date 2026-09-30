// ─────────────────────────────────────────────────────────────────────────────
// COPIED VERBATIM from the website: src/lib/analytics-range.ts.
//
// Pure aggregation — no React, no server imports — so the app computes the
// same numbers from the same rows rather than a second implementation that
// could disagree with the website about how many views a page had.
//
// Only the import paths changed (@/lib/ -> @/analytics/). Re-copy the whole
// file when the website changes it.
// ─────────────────────────────────────────────────────────────────────────────

// ─── The analytics date range — pure ────────────────────────────────────────
// One vocabulary for "which days are we looking at", shared by the range
// control, the URL, the server fns and the chart. Always whole UTC days, built
// on insightsWindowStart, so the totals, the bars and "last 7 days" keep
// counting the same rows at every range (the #232 rule).
//
// The server only ever receives one of these KEYS, never a number of days: a
// day count from the client would be a free parameter on a read path.
import { insightsWindowStart } from "@/analytics/analytics-core";

export const ANALYTICS_RANGES = ["7d", "30d", "90d", "all"] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

/** What everyone sees until they choose otherwise — the page as it was. */
export const DEFAULT_RANGE: AnalyticsRange = "30d";

export const RANGE_LABEL: Record<AnalyticsRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

/** Short form for the segmented control at 375px. */
export const RANGE_SHORT: Record<AnalyticsRange, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  all: "All time",
};

const DAYS: Record<Exclude<AnalyticsRange, "all">, number> = { "7d": 7, "30d": 30, "90d": 90 };

export function isAnalyticsRange(v: unknown): v is AnalyticsRange {
  return typeof v === "string" && (ANALYTICS_RANGES as readonly string[]).includes(v);
}

/** A URL value → a range. Anything missing or invalid is the default. */
export function parseRange(v: unknown): AnalyticsRange {
  return isAnalyticsRange(v) ? v : DEFAULT_RANGE;
}

/**
 * The `?range=` search object for a route. The default is left OUT of the
 * URL, so /analytics looks exactly as it did and every existing link to it
 * (the dashboard's, the nav's) needs no search at all.
 */
export function rangeSearch(range: AnalyticsRange): { range?: AnalyticsRange } {
  return range === DEFAULT_RANGE ? {} : { range };
}

/** Days in a fixed range; null for All time. */
export function rangeDays(range: AnalyticsRange): number | null {
  return range === "all" ? null : DAYS[range];
}

/** 00:00 UTC of the range's first day; null for All time (no lower bound). */
export function rangeStart(range: AnalyticsRange, now: Date): Date | null {
  const days = rangeDays(range);
  return days === null ? null : insightsWindowStart(now, days);
}

/** The same number of whole UTC days immediately before the range; null for
 *  All time, which has no "before". */
export function previousPeriod(
  range: AnalyticsRange,
  now: Date,
): { start: Date; end: Date } | null {
  const days = rangeDays(range);
  const end = rangeStart(range, now);
  if (days === null || !end) return null;
  return { start: new Date(end.getTime() - days * 86_400_000), end };
}

/** How many whole UTC days the window has, for the dense day series:
 *  fixed ranges are their length; All time runs from the first day with any
 *  data (at least one day, today). */
export function windowDaysFor(range: AnalyticsRange, now: Date, firstDay?: string | null): number {
  const days = rangeDays(range);
  if (days !== null) return days;
  if (!firstDay) return 1;
  const first = Date.parse(`${firstDay.slice(0, 10)}T00:00:00.000Z`);
  const today = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);
  if (!Number.isFinite(first) || first > today) return 1;
  return Math.round((today - first) / 86_400_000) + 1;
}

/** The range against the equal-length period before it, in percent. null
 *  when there is no previous period (All time) or it was empty — "+100%"
 *  against nothing is noise. */
export function periodOverPeriodPct(current: number, previous: number | null): number | null {
  if (previous === null || !(previous > 0)) return null;
  return ((current - previous) / previous) * 100;
}

/** What the delta badge is compared with, in words. */
export function previousPeriodLabel(range: AnalyticsRange): string | null {
  return range === "all" ? null : "vs previous period";
}

// ── Chart buckets ───────────────────────────────────────────────────────────
// Daily bars for the fixed ranges. All time would be hundreds of hairline bars
// at 375px, so it is summed into UTC weeks (Monday start) while the span fits
// in 26 of them, calendar months beyond that. Buckets are sums of whole UTC
// days, so they add up to exactly the total the stat card shows.

export type ChartUnit = "day" | "week" | "month";
export type ChartBucket = { start: string; views: number };

const MAX_WEEKLY_DAYS = 26 * 7;

export function chartUnitFor(range: AnalyticsRange, days: number): ChartUnit {
  if (range !== "all") return "day";
  return days <= MAX_WEEKLY_DAYS ? "week" : "month";
}

function bucketKey(day: string, unit: ChartUnit): string {
  if (unit === "day") return day;
  if (unit === "month") return `${day.slice(0, 7)}-01`;
  const d = new Date(`${day}T00:00:00.000Z`);
  const back = (d.getUTCDay() + 6) % 7; // days since Monday
  return new Date(d.getTime() - back * 86_400_000).toISOString().slice(0, 10);
}

/** Sum a dense, oldest-first day series into chart buckets. */
export function bucketDays(
  byDay: ReadonlyArray<{ day: string; views: number }>,
  unit: ChartUnit,
): ChartBucket[] {
  const out: ChartBucket[] = [];
  for (const d of byDay) {
    const key = bucketKey(d.day, unit);
    const last = out[out.length - 1];
    if (last && last.start === key) last.views += d.views;
    else out.push({ start: key, views: d.views });
  }
  return out;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Axis / tooltip label for a bucket. */
export function bucketLabel(start: string, unit: ChartUnit): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(start);
  if (!m) return start;
  const mon = MONTHS[Number(m[2]) - 1];
  if (unit === "month") return `${mon} ${m[1]}`;
  if (unit === "week") return `Wk of ${mon} ${Number(m[3])}`;
  return `${mon} ${Number(m[3])}`;
}
