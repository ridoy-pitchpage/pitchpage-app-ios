// ─────────────────────────────────────────────────────────────────────────────
// COPIED VERBATIM from the website: src/lib/activity-dwell.ts.
//
// Pure aggregation — no React, no server imports — so the app computes the
// same numbers from the same rows rather than a second implementation that
// could disagree with the website about how many views a page had.
//
// Only the import paths changed (@/lib/ -> @/analytics/). Re-copy the whole
// file when the website changes it.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Recent-activity dwell stitching (pure; unit-testable) ───────────────────
// Dwell is stored as one `dwell_15` row per HEARTBEAT_SECONDS of visible tab
// time, carrying the same visitor_id + pitch_page_id as the view it belongs to.
// This joins each VIEW event to its heartbeats (same visitor, same page, within
// the window) and returns seconds. visitor_id never leaves the server: the
// caller returns only the resulting number.

import { HEARTBEAT_SECONDS } from "@/analytics/analytics-core";

/** Heartbeats are attributed to a view for up to this long after it. */
export const DWELL_WINDOW_MS = 60 * 60 * 1000;

export type DwellCandidate = {
  pitch_page_id: string;
  visitor_id: string | null;
  created_at: string;
};

export type ViewCandidate = DwellCandidate & { event_type: string };

/**
 * For each input event, the dwell seconds to report (0 when not applicable).
 * Only `view` events get a figure; everything else is 0.
 */
/**
 * NOTE FOR THE COMPANY DASHBOARD. This is the canonical dwell number, and it
 * is gap-aware: heartbeats are bucketed per page+visitor and a gap wider than
 * DWELL_WINDOW_MS does not accrue, so a visitor who leaves a tab open and
 * comes back is not credited with the time in between.
 *
 * PR 5's org aggregation cannot do that. It runs in SQL over
 * pitch_page_views_human and counts heartbeats, multiplying by
 * `_analytics_heartbeat_seconds()` — which is the same 15 seconds, but blind
 * to gaps. So the company's "average time on page" can read a few seconds
 * higher than this on a long visit.
 *
 * That is accepted rather than overlooked: the company number is a
 * cross-member average where a few seconds is noise, and a second gap-aware
 * implementation in SQL would be a second thing to keep in step with this one.
 * If the two ever need to agree exactly, the honest fix is to compute one of
 * them from the other, not to write the window logic twice.
 */
export function computeDwellSeconds<T extends ViewCandidate>(
  events: T[],
  heartbeats: DwellCandidate[],
): number[] {
  // Each heartbeat is credited ONCE, to the latest view by the same visitor on
  // the same page at or before it, within DWELL_WINDOW_MS. Before 2026-09-28
  // every view took every heartbeat in its own 60-minute window, so a visitor
  // who reloaded after five minutes had the rest of the visit counted twice.
  // The views in `events` are the anchors: a view newer than any of them is
  // newer than the oldest event passed, so it would be in `events` too.
  const anchors = new Map<string, Array<{ t: number; i: number }>>();
  events.forEach((e, i) => {
    if (e.event_type !== "view" || !e.visitor_id) return;
    const t = new Date(e.created_at).getTime();
    if (!Number.isFinite(t)) return;
    const key = `${e.pitch_page_id}|${e.visitor_id}`;
    const arr = anchors.get(key);
    if (arr) arr.push({ t, i });
    else anchors.set(key, [{ t, i }]);
  });
  for (const arr of anchors.values()) arr.sort((a, b) => a.t - b.t || a.i - b.i);

  const counts = new Array<number>(events.length).fill(0);
  for (const h of heartbeats) {
    if (!h.visitor_id) continue;
    const views = anchors.get(`${h.pitch_page_id}|${h.visitor_id}`);
    if (!views) continue;
    const t = new Date(h.created_at).getTime();
    if (!Number.isFinite(t)) continue;
    // Latest view at or before the heartbeat. Among views stamped the same
    // instant the first one takes it, so a duplicate row cannot split a visit.
    let owner: { t: number; i: number } | undefined;
    for (const v of views) {
      if (v.t > t) break;
      if (!owner || v.t > owner.t) owner = v;
    }
    // `counts[owner.i]` is indexed by a position this function built itself,
    // so it is always present; the ?? 0 is only to satisfy the app's
    // noUncheckedIndexedAccess, which the website does not enable. The one
    // change to this file's logic, and it changes no result.
    if (owner && t < owner.t + DWELL_WINDOW_MS) counts[owner.i] = (counts[owner.i] ?? 0) + 1;
  }
  return counts.map((n) => n * HEARTBEAT_SECONDS);
}

/**
 * How long each VISIT (one `view`) lasted, as heartbeat counts: key = number
 * of heartbeats credited to the visit by computeDwellSeconds, value = how many
 * visits had that many. A histogram rather than a list so pages can be merged
 * on the client and nothing per-visit leaves the server.
 *
 * Exists for the /analytics "Typical visit" figure (2026-09-28): the old card
 * divided ALL heartbeats by all views, so one visitor with an idle tab open
 * for 38 minutes held 47% of the heartbeats and set the page's average.
 */
export function visitLengthHistogram(
  rows: ReadonlyArray<{ event_type: string; visitor_id?: string | null; created_at: string }>,
  pageId = "page",
): Record<number, number> {
  const views: ViewCandidate[] = [];
  const beats: DwellCandidate[] = [];
  for (const r of rows) {
    const row = { pitch_page_id: pageId, visitor_id: r.visitor_id ?? null, created_at: r.created_at };
    if (r.event_type === "view") views.push({ ...row, event_type: "view" });
    else if (r.event_type === "dwell_15") beats.push(row);
  }
  const out: Record<number, number> = {};
  for (const s of computeDwellSeconds(views, beats)) {
    const n = Math.round(s / HEARTBEAT_SECONDS);
    out[n] = (out[n] ?? 0) + 1;
  }
  return out;
}

/** Merge per-page histograms. */
export function mergeVisitLengths(parts: ReadonlyArray<Record<number, number> | undefined>) {
  const out: Record<number, number> = {};
  for (const p of parts) for (const [k, v] of Object.entries(p ?? {})) out[+k] = (out[+k] ?? 0) + v;
  return out;
}

/** Visits, the median visit in seconds, and visits of at least `minSeconds`. */
export function summariseVisits(hist: Record<number, number>, minSeconds = 60) {
  const lengths = Object.entries(hist)
    .map(([k, v]) => [Number(k) * HEARTBEAT_SECONDS, v] as const)
    .sort((a, b) => a[0] - b[0]);
  const visits = lengths.reduce((s, [, v]) => s + v, 0);
  const at = (i: number) => {
    let seen = 0;
    for (const [secs, v] of lengths) {
      seen += v;
      if (i < seen) return secs;
    }
    return 0;
  };
  const medianSeconds =
    visits === 0 ? 0 : visits % 2 ? at((visits - 1) / 2) : (at(visits / 2 - 1) + at(visits / 2)) / 2;
  const atLeast = lengths.filter(([s]) => s >= minSeconds).reduce((s, [, v]) => s + v, 0);
  return { visits, medianSeconds, atLeast };
}
