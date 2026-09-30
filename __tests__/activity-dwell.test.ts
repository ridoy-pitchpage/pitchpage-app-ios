// ─────────────────────────────────────────────────────────────────────────────
// COPIED from the website: src/tests/activity-dwell.test.ts.
//
// The aggregation modules are copied verbatim, so their tests come with them:
// that is what proves the app counts a page the same way the website does,
// rather than merely running the same-looking code. Changes: the vitest import
// is dropped (jest provides these as globals) and @/lib/ becomes @/analytics/.
// ─────────────────────────────────────────────────────────────────────────────

import { computeDwellSeconds, DWELL_WINDOW_MS } from "@/analytics/activity-dwell";
import { HEARTBEAT_SECONDS } from "@/analytics/analytics-core";

const T0 = Date.parse("2026-09-01T10:00:00.000Z");
const iso = (offsetMs: number) => new Date(T0 + offsetMs).toISOString();

const view = (over: Partial<Record<string, unknown>> = {}) => ({
  pitch_page_id: "page-1",
  visitor_id: "v1",
  created_at: iso(0),
  event_type: "view",
  ...over,
});

const beat = (over: Partial<Record<string, unknown>> = {}) => ({
  pitch_page_id: "page-1",
  visitor_id: "v1",
  created_at: iso(15_000),
  ...over,
});

describe("computeDwellSeconds", () => {
  it("reports N heartbeats as N × HEARTBEAT_SECONDS", () => {
    const beats = [beat(), beat({ created_at: iso(30_000) }), beat({ created_at: iso(45_000) })];
    expect(computeDwellSeconds([view()], beats)).toEqual([3 * HEARTBEAT_SECONDS]);
  });

  it("ignores heartbeats from a different visitor or a different page", () => {
    const beats = [beat({ visitor_id: "v2" }), beat({ pitch_page_id: "page-2" })];
    expect(computeDwellSeconds([view()], beats)).toEqual([0]);
  });

  it("ignores heartbeats outside the 60-minute window", () => {
    const beats = [
      beat({ created_at: iso(-15_000) }),
      beat({ created_at: iso(DWELL_WINDOW_MS) }),
      beat({ created_at: iso(DWELL_WINDOW_MS - 1000) }),
    ];
    expect(computeDwellSeconds([view()], beats)).toEqual([HEARTBEAT_SECONDS]);
  });

  it("returns 0 for a view with no heartbeats and for non-view events", () => {
    const rows = [view(), view({ event_type: "scroll_50" }), view({ visitor_id: null })];
    expect(computeDwellSeconds(rows, [beat()])).toEqual([HEARTBEAT_SECONDS, 0, 0]);
  });

  it("credits each heartbeat once — a reload does not count the visit twice", () => {
    // Views at 0 and 5 min; heartbeats every 15s for 10 min. Before the fix the
    // first view took all 40 and the second the last 20: 60 heartbeats of 40.
    const beats = Array.from({ length: 40 }, (_, n) => beat({ created_at: iso((n + 1) * 15_000) }));
    const reload = view({ created_at: iso(5 * 60_000) });
    const seconds = computeDwellSeconds([reload, view()], beats);
    // 5 min = 20 heartbeats before the reload (15s…300s ⇒ the one AT 300s is
    // the reload's), so 19 to the first view and 21 to the second.
    expect(seconds).toEqual([21 * HEARTBEAT_SECONDS, 19 * HEARTBEAT_SECONDS]);
    // Summed through reduce rather than by index: the app enables
    // noUncheckedIndexedAccess, under which seconds[0] is possibly undefined.
    // Same assertion, and it also checks nothing else crept into the array.
    expect(seconds.reduce((a, b) => a + b, 0)).toBe(40 * HEARTBEAT_SECONDS);
  });

  it("two view rows stamped the same instant share one visit's time, not double it", () => {
    const beats = [beat(), beat({ created_at: iso(30_000) })];
    expect(computeDwellSeconds([view(), view()], beats)).toEqual([2 * HEARTBEAT_SECONDS, 0]);
  });

  it("a heartbeat past the latest view's window is dropped, not handed to an older view", () => {
    const later = view({ created_at: iso(10 * 60_000) });
    const beats = [beat({ created_at: iso(10 * 60_000 + DWELL_WINDOW_MS + 1000) })];
    expect(computeDwellSeconds([later, view()], beats)).toEqual([0, 0]);
  });
});

// The website's own suite also asserts here that its dashboard route reads
// these helpers rather than recomputing dwell itself. That block is dropped:
// it reads src/routes/_authenticated/dashboard.tsx, which is a website file.
// The app's equivalent guarantee is that it imports from @/analytics/ too.

