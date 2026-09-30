import { supabase } from "@/auth/supabase";
import {
  aggregateInsights,
  isMissingFunctionError,
  isPreMigrationSchemaError,
  type EventRow,
  type LinkRow,
  type PageInsights,
} from "@/analytics/analytics-core";
import {
  previousPeriod,
  rangeStart,
  windowDaysFor,
  type AnalyticsRange,
} from "@/analytics/analytics-range";
import { EDITOR_PREVIEW_HOST, withoutEditorPreview } from "@/analytics/analytics-sources";
import { visitLengthHistogram } from "@/analytics/activity-dwell";

/**
 * Analytics, read straight from the database with the signed-in user's own
 * client.
 *
 * This needs no backend change, which is not obvious and is worth writing
 * down. `pitch_page_views` carries an RLS policy — "Owners can read their
 * pages' view events" — so the same rows the website's server function reads
 * come back to the app. `get_page_analytics_rollup` is SECURITY INVOKER,
 * checks `auth.uid()` owns the page itself, and is granted to `authenticated`;
 * called with the service role it returns nothing, so the user's client is the
 * only thing that can read it at all.
 *
 * The maths is not reimplemented here. `aggregateInsights` and its helpers are
 * copied verbatim into src/analytics/, so a page's numbers in the app are the
 * same numbers as on the website, computed by the same code from the same
 * rows. This file is only the reads.
 *
 * Two fallbacks, both the website's:
 *   - the rollup function may not be applied to the live database yet, in
 *     which case the range falls back to a capped raw read and says on screen
 *     that it was capped, rather than silently showing partial history;
 *   - a database without the bot-flag migration rejects `is_bot`, so the query
 *     is retried without that filter rather than failing.
 */

const INSIGHTS_ROW_CAP = 10000;
const ROLLUP_MAX_GROUPS = 20000;

/** The rollup only pays for itself on the long ranges (the website's rule). */
const usesRollup = (range: AnalyticsRange) => range === "90d" || range === "all";

export type PageInsightsResult = PageInsights & {
  range: AnalyticsRange;
  /** "capped": older rows in the window were not read. */
  coverage: "complete" | "capped";
  cappedAt: number | null;
  slug: string;
  visitLengths: Record<number, number>;
  /** Views in the equal-length period before this one, or null if unknown. */
  previousViews: number | null;
};

type RollupPayload = {
  groups: Array<Record<string, unknown>>;
  truncated: boolean;
  visit_lengths: Record<string, number>;
  first_day: string | null;
};

const histogramFrom = (h: Record<string, number>): Record<number, number> =>
  Object.fromEntries(Object.entries(h).map(([k, v]) => [Number(k), v]));

/** The first UTC day any of these rows covers. */
function firstDayOf(rows: ReadonlyArray<{ created_at: string; first_at?: string }>): string | null {
  let min: string | null = null;
  for (const row of rows) {
    const at = new Date(row.first_at ?? row.created_at);
    if (Number.isNaN(at.getTime())) continue;
    const day = at.toISOString().slice(0, 10);
    if (!min || day < min) min = day;
  }
  return min;
}

/**
 * `pitch_page_views` and `get_page_analytics_rollup` are missing from the
 * generated types — the app's database.types.ts was generated before the
 * analytics tables were exposed. The shapes are asserted at the boundary
 * instead, which is what the website does for the same rows.
 */
const untyped = supabase as any;

async function readRollup(pageId: string, since: Date | null): Promise<RollupPayload | "missing"> {
  const { data, error } = await untyped.rpc("get_page_analytics_rollup", {
    p_page_id: pageId,
    p_since: since ? since.toISOString() : null,
  });
  if (error) {
    if (isMissingFunctionError(error)) return "missing";
    throw new Error("Couldn't load analytics — please try again.");
  }
  // NULL means "not your page", which the function already checked, so this is
  // only reachable in a race with a delete: an empty page, not an error.
  if (!data) return { groups: [], truncated: false, visit_lengths: {}, first_day: null };
  return data as RollupPayload;
}

/**
 * Views in the equal-length period before the range, for "vs the period
 * before". A HEAD count, so no rows cross the wire, and bots and editor
 * previews are excluded exactly as in the range itself.
 */
async function previousPeriodViews(
  pageId: string,
  range: AnalyticsRange,
  now: Date,
): Promise<number | null> {
  const previous = previousPeriod(range, now);
  if (!previous) return null;
  const { count, error } = await untyped
    .from("pitch_page_views")
    .select("id", { count: "exact", head: true })
    .eq("pitch_page_id", pageId)
    .eq("event_type", "view")
    .eq("is_bot", false)
    .gte("created_at", previous.start.toISOString())
    .lt("created_at", previous.end.toISOString())
    .or(`referrer_host.is.null,referrer_host.neq.${EDITOR_PREVIEW_HOST}`);
  // The delta is simply not shown if this fails — it must never block the page.
  if (error) return null;
  return count ?? 0;
}

export async function getPageInsights(
  pitchPageId: string,
  range: AnalyticsRange,
): Promise<PageInsightsResult> {
  // Ownership is checked here as well as by RLS. The website does the same,
  // and it turns "somebody else's id" into "not found" rather than an empty
  // page that looks like nobody has visited.
  const { data: page, error: pageError } = await supabase
    .from("pitch_pages")
    .select("id, slug")
    .eq("id", pitchPageId)
    .maybeSingle();
  if (pageError) throw new Error("Couldn't load analytics — please try again.");
  if (!page) throw new Error("That page no longer exists.");

  const now = new Date();
  const start = rangeStart(range, now);
  const since = start?.toISOString() ?? null;

  const events = async (excludeBots: boolean) => {
    let query = untyped
      .from("pitch_page_views")
      .select("event_type, ref, referrer_host, created_at, visitor_id, share_source")
      .eq("pitch_page_id", page.id);
    if (since) query = query.gte("created_at", since);
    query = query.order("created_at", { ascending: false }).limit(INSIGHTS_ROW_CAP);
    return excludeBots ? query.eq("is_bot", false) : query;
  };

  const [linksRes, previousViews, rolled] = await Promise.all([
    supabase
      .from("pitch_page_links")
      .select("id, label, ref_slug, created_at")
      .eq("pitch_page_id", page.id)
      .order("created_at", { ascending: false }),
    previousPeriodViews(page.id, range, now),
    usesRollup(range) ? readRollup(page.id, start) : Promise.resolve("missing" as const),
  ]);
  if (linksRes.error) throw new Error("Couldn't load analytics — please try again.");

  let rows: EventRow[];
  let visitLengths: Record<number, number>;
  let firstDay: string | null;
  let coverage: "complete" | "capped";
  let cappedAt: number | null;

  if (rolled !== "missing") {
    rows = rolled.groups as unknown as EventRow[];
    visitLengths = histogramFrom(rolled.visit_lengths);
    firstDay = rolled.first_day;
    coverage = rolled.truncated ? "capped" : "complete";
    cappedAt = rolled.truncated ? ROLLUP_MAX_GROUPS : null;
  } else {
    let res = await events(true);
    // A database without the bot-flag migration rejects is_bot. Counting
    // without the filter is better than showing nothing.
    if (isPreMigrationSchemaError(res.error)) res = await events(false);
    if (res.error) throw new Error("Couldn't load analytics — please try again.");
    const raw = (res.data ?? []) as EventRow[];
    rows = withoutEditorPreview(raw);
    visitLengths = visitLengthHistogram(rows);
    firstDay = firstDayOf(rows);
    coverage = raw.length >= INSIGHTS_ROW_CAP ? "capped" : "complete";
    cappedAt = coverage === "capped" ? INSIGHTS_ROW_CAP : null;
  }

  const insights = aggregateInsights(
    rows,
    (linksRes.data ?? []) as LinkRow[],
    now,
    windowDaysFor(range, now, firstDay),
  );

  return { ...insights, range, coverage, cappedAt, slug: page.slug, visitLengths, previousViews };
}
