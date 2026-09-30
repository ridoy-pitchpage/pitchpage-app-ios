// ─────────────────────────────────────────────────────────────────────────────
// COPIED from the website: src/tests/analytics-range.test.ts.
//
// The aggregation modules are copied verbatim, so their tests come with them:
// that is what proves the app counts a page the same way the website does,
// rather than merely running the same-looking code. Changes: the vitest import
// is dropped (jest provides these as globals) and @/lib/ becomes @/analytics/.
// ─────────────────────────────────────────────────────────────────────────────

// ─── The analytics date range: parsing, windows, previous period, buckets ───
import {
  ANALYTICS_RANGES,
  DEFAULT_RANGE,
  parseRange,
  rangeSearch,
  rangeDays,
  rangeStart,
  previousPeriod,
  windowDaysFor,
  periodOverPeriodPct,
  chartUnitFor,
  bucketDays,
  bucketLabel,
} from "@/analytics/analytics-range";
import { insightsWindowStart } from "@/analytics/analytics-core";

const NOW = new Date("2026-09-28T09:30:00.000Z"); // a Monday

describe("parseRange", () => {
  it("accepts the four keys", () => {
    for (const r of ANALYTICS_RANGES) expect(parseRange(r)).toBe(r);
  });

  it("falls back to 30 days for anything else", () => {
    for (const v of [undefined, null, "", "14d", "30", 30, "ALL", "all ", "7d;drop", {}, ["7d"]]) {
      // vitest takes a message as expect()'s second argument and jest does
      // not, so the value under test carries the label instead.
      expect({ input: String(v), range: parseRange(v) }).toEqual({
        input: String(v),
        range: "30d",
      });
    }
    expect(DEFAULT_RANGE).toBe("30d");
  });

  it("leaves the default out of the URL", () => {
    expect(rangeSearch("30d")).toEqual({});
    expect(rangeSearch("7d")).toEqual({ range: "7d" });
    expect(rangeSearch("all")).toEqual({ range: "all" });
  });
});

describe("windows", () => {
  it("fixed ranges are whole UTC days — 30d is exactly the #232 window", () => {
    expect(rangeStart("30d", NOW)?.toISOString()).toBe(insightsWindowStart(NOW).toISOString());
    expect(rangeStart("7d", NOW)?.toISOString()).toBe("2026-09-22T00:00:00.000Z");
    expect(rangeStart("90d", NOW)?.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(rangeStart("all", NOW)).toBeNull();
    expect(rangeDays("all")).toBeNull();
  });

  it("the previous period is the same length, immediately before", () => {
    const p = previousPeriod("7d", NOW)!;
    expect(p.start.toISOString()).toBe("2026-09-15T00:00:00.000Z");
    expect(p.end.toISOString()).toBe("2026-09-22T00:00:00.000Z");
    const m = previousPeriod("30d", NOW)!;
    expect((m.end.getTime() - m.start.getTime()) / 86_400_000).toBe(30);
    expect(previousPeriod("all", NOW)).toBeNull();
  });

  it("All time runs from the first day with data", () => {
    expect(windowDaysFor("30d", NOW)).toBe(30);
    expect(windowDaysFor("all", NOW, "2026-09-28")).toBe(1);
    expect(windowDaysFor("all", NOW, "2026-09-01T12:00:00Z")).toBe(28);
    expect(windowDaysFor("all", NOW, null)).toBe(1);
  });
});

describe("periodOverPeriodPct", () => {
  it("compares with the previous period, and is hidden without one", () => {
    expect(periodOverPeriodPct(12, 8)).toBe(50);
    expect(periodOverPeriodPct(4, 8)).toBe(-50);
    expect(periodOverPeriodPct(4, 0)).toBeNull();
    expect(periodOverPeriodPct(4, null)).toBeNull();
  });
});

describe("chart buckets", () => {
  const days = (start: string, n: number, v = 1) =>
    Array.from({ length: n }, (_, i) => ({
      day: new Date(Date.parse(`${start}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10),
      views: v,
    }));

  it("daily for the fixed ranges, weekly then monthly for All time", () => {
    expect(chartUnitFor("90d", 90)).toBe("day");
    expect(chartUnitFor("all", 30)).toBe("week");
    expect(chartUnitFor("all", 182)).toBe("week");
    expect(chartUnitFor("all", 183)).toBe("month");
  });

  it("weeks start on Monday (UTC) and add up to the total", () => {
    const series = days("2026-09-03", 26); // Thu Sep 3 → Mon Sep 28
    const weeks = bucketDays(series, "week");
    expect(weeks.map((w) => w.start)).toEqual(["2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28"]);
    expect(weeks.map((w) => w.views)).toEqual([4, 7, 7, 7, 1]);
    expect(weeks.reduce((s, w) => s + w.views, 0)).toBe(26);
  });

  it("months are calendar months", () => {
    const months = bucketDays(days("2026-07-30", 40), "month");
    expect(months.map((m) => [m.start, m.views])).toEqual([
      ["2026-07-01", 2],
      ["2026-08-01", 31],
      ["2026-09-01", 7],
    ]);
  });

  it("labels say which unit they are", () => {
    expect(bucketLabel("2026-09-07", "day")).toBe("Sep 7");
    expect(bucketLabel("2026-09-07", "week")).toBe("Wk of Sep 7");
    expect(bucketLabel("2026-09-01", "month")).toBe("Sep 2026");
  });
});
