// ─────────────────────────────────────────────────────────────────────────────
// COPIED VERBATIM from the website: src/lib/analytics-core.ts.
//
// Pure aggregation — no React, no server imports — so the app computes the
// same numbers from the same rows rather than a second implementation that
// could disagree with the website about how many views a page had.
//
// Only the import paths changed (@/lib/ -> @/analytics/). Re-copy the whole
// file when the website changes it.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Pitch Page Analytics — pure core (no DB, no env; unit-testable) ────────
// The rate limiter and the insights aggregation, kept dependency-free so the
// logic is verifiable without a database. Used by analytics.functions.ts.
// Spec: agent-os/specs/2026-06-05-2030-pitch-page-analytics/
import { sourceBucket } from "@/analytics/analytics-sources";

export const ANALYTICS_EVENT_TYPES = [
  "view",
  "video_play",
  "resume_download",
  "cta_click",
  // Watch-depth milestones on the intro video. Each fires at most once per
  // visitor per pageload (client-side dedupe), so a viewer scrubbing backwards
  // can never re-fire one they already passed.
  //
  // These describe the INTRO video only (pitch_pages.video_url). They used to
  // be claimed by whichever <video> on the page reached the threshold first —
  // a gallery highlight clip playing to the end recorded "watched 100% of the
  // intro" and then blocked the real intro milestone for that pageload. The
  // intro is now tagged in IntroVideoPlayer and the listeners ignore anything
  // else. See the PR 1 spec for the full path.
  "video_25",
  "video_50",
  "video_75",
  "video_100",
  // A play on a Film & Highlights gallery clip. Deliberately has NO milestones:
  // a gallery is browsed, not watched through, and conflating it with the intro
  // is exactly the bug above. Provider clips (YouTube/Vimeo/Hudl) render in an
  // iframe and emit nothing at all — tracking them would need a third-party
  // player SDK on the public page, which is out of scope.
  "gallery_play",
  // Any other link on the page — LinkedIn, portfolio, supporting documents,
  // credentials, mailto:, tel:, section anchors. Only the résumé and the CTAs
  // were tracked before, which left most of a page's outbound links invisible.
  // The `target` column carries the CATEGORY of link, never the URL.
  "link_click",
  // Dwell: one event per HEARTBEAT_SECONDS of *visible* tab time. It measures
  // "tab open and focused", NOT reading — which is why the UI only ever shows
  // it as a coarse bucket.
  "dwell_15",
  // Scroll depth: furthest point of the page reached, once per pageload each.
  "scroll_50",
  "scroll_90",
  // One row per SECTION the visitor actually got on screen, carrying
  // section_id and dwell_ms. Unlike every type above it, these are written in
  // batches by recordSectionReads rather than one at a time — a page has up to
  // 16 sections and per-section calls would spend the whole non-view rate
  // limit on a single visit. Scroll depth says how far down the page someone
  // went; this says which parts held them once they got there.
  "section_read",
] as const;
export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

/** Watch-depth milestone event types, shallowest → deepest. */
export const VIDEO_MILESTONE_EVENTS = [
  { pct: 25, type: "video_25" },
  { pct: 50, type: "video_50" },
  { pct: 75, type: "video_75" },
  { pct: 100, type: "video_100" },
] as const;

/** Scroll-depth milestones, shallowest → deepest. */
export const SCROLL_MILESTONE_EVENTS = [
  { pct: 50, type: "scroll_50" },
  { pct: 90, type: "scroll_90" },
] as const;

/**
 * How far down the page the visitor has SEEN, as a percentage: the bottom edge
 * of the viewport against the document's height. A milestone counts as
 * reached once that point of the page has been on screen — so a page that
 * fits on one screen is 100% the moment it is shown, which is the rule
 * (approved 2026-09-28): a page short enough to read without scrolling has
 * been read to the end, not "not scrolled".
 *
 * null when there is no layout to measure yet (height or viewport of 0) —
 * never 100, which is what an unmeasured page used to look like.
 */
export function scrollDepthPct(
  scrollY: number,
  viewportHeight: number,
  docHeight: number,
): number | null {
  if (!(viewportHeight > 0) || !(docHeight > 0)) return null;
  // 1px of slack: fractional device-pixel heights round either way.
  if (docHeight <= viewportHeight + 1) return 100;
  return Math.min(100, ((Math.max(0, scrollY) + viewportHeight) / docHeight) * 100);
}

/** Seconds of visible time represented by one `dwell_15` event. */
export const HEARTBEAT_SECONDS = 15;

// ── Running before the migration is applied ─────────────────────────────────
// Migrations in this repo do not auto-apply: the SQL is pasted into Lovable's
// editor by hand, so code and schema can briefly disagree in either direction.
// Every query that mentions a PR-1 column checks this and falls back to the
// pre-migration shape, so the wrong order is a temporary loss of bot filtering
// rather than a broken dashboard on a live site.

/**
 * True when a Supabase/Postgres error means "this column or value does not
 * exist yet": PostgREST's unknown-column code, Postgres' undefined_column, and
 * check_violation (a new event type the CHECK still rejects).
 */
export function isPreMigrationSchemaError(err: { code?: string } | null | undefined): boolean {
  const code = err?.code ?? "";
  return code === "PGRST204" || code === "42703" || code === "23514";
}

/**
 * True when a database function is not there yet: PostgREST's "not in the
 * schema cache", or Postgres' undefined_function. Used for
 * get_page_analytics_rollup, whose migration is pasted in by hand — until it
 * is, the read falls back rather than failing.
 */
export function isMissingFunctionError(err: { code?: string } | null | undefined): boolean {
  const code = err?.code ?? "";
  return code === "PGRST202" || code === "42883";
}

// ── Suspected-bot sweep throttle ────────────────────────────────────────────
// flag_suspected_bot_views() is refreshed from the owner read paths rather than
// a schedule, because pg_cron is not installed on this database. It is awaited
// (Cloudflare Workers cancel pending I/O when a handler resolves), so it must
// stay rare and bounded. Deliberately NOT called from the visitor's own request
// path — nothing here may slow down a public page view.

/** How often the sweep may run, per server instance. */
export const BOT_SWEEP_INTERVAL_MS = 10 * 60 * 1000;

/** True when the sweep is due. `lastRun` is null when it has never run. */
export function shouldRunBotSweep(
  lastRun: number | null,
  now: number,
  intervalMs: number = BOT_SWEEP_INTERVAL_MS,
): boolean {
  if (lastRun === null) return true;
  return now - lastRun >= intervalMs;
}

// ── Intro-video watch depth ──────────────────────────────────────────────────
// The intro video is never re-encoded: a trimmed page still serves the WHOLE
// file and IntroVideoPlayer seeks/clamps to the kept window. So the browser's
// `duration` and `currentTime` are both absolute offsets into the original
// file, and a percentage taken from them describes the file, not what the
// viewer was shown. On a 120s file trimmed to 60–90s that read 50% before a
// single frame played, and 100% was unreachable (it topped out at
// trimEnd/duration, and the player pauses at the window end so the native
// `ended` event never fires either).
//
// This resolves the kept window and returns progress THROUGH THAT WINDOW, so a
// trimmed clip runs a full 0 → 100 exactly like an untrimmed one.

export type VideoWindowInput = {
  currentTime: number;
  /** The element's duration; may be NaN/Infinity before metadata resolves. */
  duration: number;
  trimStart?: number | null;
  trimEnd?: number | null;
};

/** The kept window in absolute seconds, or null when it can't be resolved. */
export function resolveVideoWindow(
  input: Pick<VideoWindowInput, "duration" | "trimStart" | "trimEnd">,
): { start: number; end: number; length: number } | null {
  const dur = Number.isFinite(input.duration) ? input.duration : NaN;
  const start = Math.max(0, input.trimStart ?? 0);
  // An explicit trim end wins, but never past the real end of the file.
  const rawEnd = input.trimEnd != null && input.trimEnd > start ? input.trimEnd : dur;
  const end = Number.isFinite(dur) ? Math.min(rawEnd, dur) : rawEnd;
  if (!Number.isFinite(end)) return null;
  const length = end - start;
  if (!(length > 0)) return null;
  return { start, end, length };
}

/**
 * Progress through the kept window, 0–100, or null when the window is not yet
 * resolvable (no metadata). Clamped, so a seek past either edge can't produce a
 * nonsense percentage.
 */
export function videoWindowPct(input: VideoWindowInput): number | null {
  const win = resolveVideoWindow(input);
  if (!win) return null;
  const pct = ((input.currentTime - win.start) / win.length) * 100;
  if (!Number.isFinite(pct)) return null;
  return Math.min(100, Math.max(0, pct));
}

/**
 * The milestones a given window percentage has reached.
 *
 * 100 gets a tolerance because playback stops fractionally short of the end:
 * `timeupdate` fires every ~250ms, and for a trimmed clip IntroVideoPlayer
 * pauses at `windowEnd - 0.03`, so the last sample is never exactly 100.
 */
export function milestonesReached(pct: number): AnalyticsEventType[] {
  const out: AnalyticsEventType[] = [];
  for (const m of VIDEO_MILESTONE_EVENTS) {
    const threshold = m.pct === 100 ? 99 : m.pct;
    if (pct >= threshold) out.push(m.type);
  }
  return out;
}

const MILESTONE_PCT: Record<string, number> = {
  video_25: 25,
  video_50: 50,
  video_75: 75,
  video_100: 100,
};

const SCROLL_PCT: Record<string, number> = { scroll_50: 50, scroll_90: 90 };

/** 0 when the event type is not a video milestone. */
export function milestonePct(eventType: string): number {
  return MILESTONE_PCT[eventType] ?? 0;
}

/** 0 when the event type is not a scroll milestone. */
export function scrollPct(eventType: string): number {
  return SCROLL_PCT[eventType] ?? 0;
}

/**
 * Dwell is deliberately reported as a range, never a precise number: the
 * heartbeat measures tab-visible time, which is an upper bound on attention,
 * not a reading time. Returns null when there is nothing worth showing.
 */
export function dwellBucketLabel(seconds: number): string | null {
  if (!Number.isFinite(seconds) || seconds < HEARTBEAT_SECONDS) return null;
  if (seconds < 30) return "15–30 sec on page";
  if (seconds < 60) return "30–60 sec on page";
  if (seconds < 180) return "1–3 min on page";
  if (seconds < 600) return "3–10 min on page";
  return "10+ min on page";
}

// ── Rate limiter ─────────────────────────────────────────────────────────────
// Transient, in-memory, per server instance. Keys are `${ip}|${slug}` — the IP
// is used ONLY as a map key and is never stored, logged, or returned (the
// feature's no-PII rule). Serverless instances reset the map; the limiter is
// an honesty-by-default control, not a tamper-proof one (documented in spec).
//   view:        1 per key per 10 minutes (a person re-reading ≠ new views)
//   other types: 30 per key per minute (raised from 10 when watch-depth
//                milestones were added — one view can legitimately emit four
//                milestones on top of plays/downloads/CTA clicks)
//   global:      240 events per instance per minute (runaway breaker)
const VIEW_WINDOW_MS = 10 * 60 * 1000;
const OTHER_WINDOW_MS = 60 * 1000;
const OTHER_MAX = 30;
const GLOBAL_WINDOW_MS = 60 * 1000;
const GLOBAL_MAX = 240;

type Counter = { count: number; windowStart: number };
export type RateState = {
  viewSeen: Map<string, number>; // key -> last view timestamp
  others: Map<string, Counter>; // key -> counter for non-view events
  global: Counter;
};

export function newRateState(): RateState {
  return { viewSeen: new Map(), others: new Map(), global: { count: 0, windowStart: 0 } };
}

/** Returns true when the event may proceed; mutates state when it does. */
export function rateLimitAllow(
  state: RateState,
  key: string,
  eventType: AnalyticsEventType,
  now: number,
): boolean {
  // Global breaker first.
  if (now - state.global.windowStart >= GLOBAL_WINDOW_MS) {
    state.global = { count: 0, windowStart: now };
  }
  if (state.global.count >= GLOBAL_MAX) return false;

  if (eventType === "view") {
    const last = state.viewSeen.get(key);
    if (last !== undefined && now - last < VIEW_WINDOW_MS) return false;
    state.viewSeen.set(key, now);
  } else {
    const c = state.others.get(key);
    if (!c || now - c.windowStart >= OTHER_WINDOW_MS) {
      state.others.set(key, { count: 1, windowStart: now });
    } else {
      if (c.count >= OTHER_MAX) return false;
      c.count += 1;
    }
  }
  state.global.count += 1;

  // Opportunistic sweep so the maps can't grow unboundedly on long-lived
  // instances (cheap: only when large).
  if (state.viewSeen.size > 5000) {
    for (const [k, t] of state.viewSeen) if (now - t >= VIEW_WINDOW_MS) state.viewSeen.delete(k);
  }
  if (state.others.size > 5000) {
    for (const [k, c] of state.others)
      if (now - c.windowStart >= OTHER_WINDOW_MS) state.others.delete(k);
  }
  return true;
}

// ── Insights aggregation ─────────────────────────────────────────────────────
export type EventRow = {
  event_type: string;
  ref: string | null;
  /** Anonymous per-device id; used only to count DISTINCT devices per link. */
  visitor_id?: string | null;
  referrer_host: string | null;
  /** The ?via= channel the owner's own share button stamped on the link. */
  share_source?: string | null;
  created_at: string;
  /**
   * How many identical events this row stands for — 1 (or absent) for a raw
   * row. The SQL rollup (get_page_analytics_rollup) groups events that differ
   * in nothing the aggregation reads, so 300 heartbeats from one visitor on
   * one day arrive as one row with n = 300. Every count adds `n`; every
   * per-visitor set is unchanged, because a group never spans two visitors.
   */
  n?: number;
  /** Earliest event in a grouped row; `created_at` is then its latest. */
  first_at?: string;
};

/** The weight of a row: n for a grouped row, 1 for a raw one. */
export const rowWeight = (r: { n?: number | null }): number =>
  typeof r.n === "number" && r.n > 0 ? r.n : 1;
export type LinkRow = { id: string; label: string; ref_slug: string; created_at: string };

export type PageInsights = {
  /** Raw event counts. A visitor who reloads, or plays the video twice, is
      counted twice — right for "how many views", wrong for any rate. */
  totals: Record<AnalyticsEventType, number>;
  /**
   * Distinct visitors per event type, counting only visitors who also have a
   * `view` in the same rows — so `visitors.X <= visitors.view` for every X and
   * any rate built as `visitors.X / visitors.view` cannot pass 100%. Rows
   * without a visitor id count in neither. This is the one to divide.
   */
  visitors: Record<AnalyticsEventType, number>;
  /** Oldest→newest, one entry per day for the window; views only. */
  byDay: Array<{ day: string; views: number }>;
  /** Every owner link (even 0-view ones) + any orphaned refs from deleted
      links (id null — not deletable, history only). */
  byRef: Array<{
    id: string | null;
    refSlug: string;
    label: string;
    views: number;
    lastViewedAt: string | null;
    /**
     * Distinct anonymous visitor ids that opened this link. Forwarding is NOT
     * detectable; this only says the link was opened from more than one device.
     */
    distinctVisitors: number;
  }>;
  /** Top sources by view count (max 6). `host` is a RAW bucket token — pass it
      through friendlySourceLabel before showing it to anyone. */
  topReferrers: Array<{ host: string; views: number }>;
  /**
   * EVERY source bucket, busiest first — what anything combining pages must
   * merge. Merging each page's top 6 dropped a source that was seventh on
   * every page, however many views it had in total, and made the donut's
   * percentages shares of the top six rather than of all views.
   */
  sources: Array<{ host: string; views: number }>;
  views7d: number;
};

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

// ── One window ──────────────────────────────────────────────────────────────
// Every personal analytics figure is counted over whole UTC days: the chart
// draws windowDays of them ending today, the totals are read from 00:00 UTC of
// the first, and the 7-day figures are the last seven. Before 2026-09-28 the
// totals were a rolling 30×24 hours (so the first bar could be missing rows
// the total counted), "last 7 days" was a rolling 168 hours, and the two
// deltas compared different things — /analytics calendar weeks, the dashboard
// a rolling week against a calendar one.

/** 00:00 UTC of the first day the chart draws. getPageInsights reads from
 *  here, so the totals are exactly the rows in the bars. */
export function insightsWindowStart(now: Date, windowDays = 30): Date {
  const d = new Date(now.getTime() - (windowDays - 1) * 24 * 60 * 60 * 1000);
  return new Date(`${dayKey(d)}T00:00:00.000Z`);
}

/** Views in the last `n` days of a dense, oldest-first day series. */
export function sumLastDays(byDay: ReadonlyArray<{ views: number }>, n: number): number {
  return byDay.slice(-n).reduce((s, d) => s + d.views, 0);
}

/** The last 7 days against the 7 before, in percent; null when the earlier
 *  week is empty ("+100%" against nothing is noise). */
export function weekOverWeekPct(byDay: ReadonlyArray<{ views: number }>): number | null {
  const prior = byDay.length >= 14 ? sumLastDays(byDay.slice(0, -7), 7) : 0;
  if (prior <= 0) return null;
  return ((sumLastDays(byDay, 7) - prior) / prior) * 100;
}

export function aggregateInsights(
  rows: EventRow[],
  links: LinkRow[],
  now: Date,
  windowDays = 30,
): PageInsights {
  const totals = Object.fromEntries(ANALYTICS_EVENT_TYPES.map((t) => [t, 0])) as Record<
    AnalyticsEventType,
    number
  >;
  // Per-visitor, so history already holding repeat events (two page loads,
  // two plays) reads correctly without a backfill.
  const viewers = new Set<string>();
  for (const r of rows) if (r.event_type === "view" && r.visitor_id) viewers.add(r.visitor_id);
  const visitorSets = new Map<AnalyticsEventType, Set<string>>();

  const byDayMap = new Map<string, number>();
  const refViews = new Map<string, { views: number; last: string | null; visitors: Set<string> }>();
  const refHosts = new Map<string, number>();

  for (const r of rows) {
    if (!(ANALYTICS_EVENT_TYPES as readonly string[]).includes(r.event_type)) continue;
    const t = r.event_type as AnalyticsEventType;
    const w = rowWeight(r);
    totals[t] += w;
    if (r.visitor_id && viewers.has(r.visitor_id)) {
      let set = visitorSets.get(t);
      if (!set) visitorSets.set(t, (set = new Set()));
      set.add(r.visitor_id);
    }
    if (t !== "view") continue;
    const day = r.created_at.slice(0, 10);
    byDayMap.set(day, (byDayMap.get(day) ?? 0) + w);
    if (r.ref) {
      const cur = refViews.get(r.ref) ?? { views: 0, last: null, visitors: new Set<string>() };
      cur.views += w;
      if (r.visitor_id) cur.visitors.add(r.visitor_id);
      if (!cur.last || r.created_at > cur.last) cur.last = r.created_at;
      refViews.set(r.ref, cur);
    }
    // Bucketed by a RAW token — a `via:` channel when the owner's own share
    // button tagged the link, otherwise the referrer host, otherwise empty
    // (which the label mapper renders as "Direct"). Kept raw here and named
    // once at render, so rows recorded long before any of this still resolve
    // to a friendly name without a backfill.
    const bucket = sourceBucket({
      shareSource: r.share_source,
      referrerHost: r.referrer_host,
    });
    refHosts.set(bucket, (refHosts.get(bucket) ?? 0) + w);
  }

  // Dense day series, oldest → newest.
  const byDay: PageInsights["byDay"] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = dayKey(d);
    byDay.push({ day: key, views: byDayMap.get(key) ?? 0 });
  }
  // The last 7 of the same UTC days the chart draws, so "N in the last 7
  // days", the chart's last seven bars and the week-on-week delta are one
  // set of rows. It was a rolling 168 hours beside calendar-day bars.
  const views7d = sumLastDays(byDay, 7);

  // Owner links first (registry order: newest first as supplied), then any
  // refs seen in events whose link was deleted (label = raw slug).
  const byRef: PageInsights["byRef"] = links.map((l) => {
    const v = refViews.get(l.ref_slug);
    return {
      id: l.id,
      refSlug: l.ref_slug,
      label: l.label,
      views: v?.views ?? 0,
      lastViewedAt: v?.last ?? null,
      distinctVisitors: v?.visitors.size ?? 0,
    };
  });
  const known = new Set(links.map((l) => l.ref_slug));
  for (const [slug, v] of refViews) {
    if (!known.has(slug))
      byRef.push({
        id: null,
        refSlug: slug,
        label: slug,
        views: v.views,
        lastViewedAt: v.last,
        distinctVisitors: v.visitors.size,
      });
  }

  const sources = [...refHosts.entries()]
    .map(([host, views]) => ({ host, views }))
    .sort((a, b) => b.views - a.views);
  const topReferrers = sources.slice(0, 6);

  const visitors = Object.fromEntries(
    ANALYTICS_EVENT_TYPES.map((t) => [t, visitorSets.get(t)?.size ?? 0]),
  ) as Record<AnalyticsEventType, number>;

  return { totals, visitors, byDay, byRef, topReferrers, sources, views7d };
}

// ── Ref-slug generation (for createPageLink) ────────────────────────────────
// Never purely numeric (search-param coercion gotcha) — the alphanumeric
// suffix always contains a letter.
const SUFFIX_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export function makeRefSlug(label: string, rand: () => number = Math.random): string {
  const base = label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  let suffix = "";
  for (let i = 0; i < 4; i++)
    suffix += SUFFIX_ALPHABET[Math.floor(rand() * SUFFIX_ALPHABET.length)];
  // Guarantee a letter in the suffix (alphabet is mostly letters, but be exact).
  if (!/[a-z]/.test(suffix)) suffix = "a" + suffix.slice(1);
  return base ? `${base}-${suffix}` : `link-${suffix}`;
}
