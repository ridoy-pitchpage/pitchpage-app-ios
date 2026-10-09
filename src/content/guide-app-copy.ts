import { GUIDE_PAGES, type GuidePage } from "@/content/guide-pages";
import { relationFor, type GuideRelation } from "@/content/guide-related";
import { FREE_LIVE_PAGES } from "@/lib/free-publishing";

/**
 * The guides as the app shows them: the website's articles, with PitchPage's
 * own price replaced by what the app does, which is publish for free.
 *
 * guide-pages.ts and guide-related.ts stay verbatim copies of the website's
 * files. But the articles quote the website's checkout ("$9 one-time to
 * publish", "a five-page pack at $39", credits that never expire and are
 * refundable for 14 days), and the app sells nothing: publishing from it is
 * free, for up to FREE_LIVE_PAGES live pages at a time (2026-10-09). A price
 * there would be untrue, and pointing people at a purchase outside the app is
 * what Guideline 3.1.3(f) rules out. Other products' prices, like Carrd's
 * "$9, $19 or $49 per year", are facts about them, and stay.
 *
 * The rewrites run on the strings rather than the files, so a re-copied guide
 * needs no edit here; __tests__/guide-app-copy.test.ts fails if it brings a
 * phrasing these do not cover.
 */

const LIVE = `up to ${FREE_LIVE_PAGES} live pages at a time`;

type Rewrite = readonly [RegExp, string | ((match: string, ...groups: string[]) => string)];

/** Most specific first: the sentences about packs and refunds, then the single-page phrasings. */
const REWRITES: ReadonlyArray<Rewrite> = [
  // These only explain buying, and say nothing once there is nothing to buy.
  [/\s*Credits never expire,? and unused ones are refundable within 14 days\./g, ""],
  [
    /Publishing is \$9 (?:per page|once for one page), or \$39 for a five-page pack(?: if you're tailoring per role)?\./g,
    `Publishing from the app is free, for ${LIVE}.`,
  ],
  [
    /There's no subscription to cancel — publishing is a one-time \$9 per page, and credits never expire\./g,
    "There's no subscription to cancel, and publishing from the app is free.",
  ],
  [/so there's a five-page pack at \$39\./g, `and the app keeps ${LIVE}.`],
  [/nothing renews — credits never expire/g, "nothing renews"],
  [/publish up to 5 with the \$39 pack/g, `publish ${LIVE}`],
  [/then \$9 once to publish a page/g, "and free to publish from the app"],
  [/\$9 total for one published page \(free to build and edit\)/g, "free to build, edit and publish in the app"],
  [/\$9 one-time per published page \(free to build\)/g, "free to build and publish in the app"],
  [/Build and edit free, pay \$9 once to publish/g, "Build, edit and publish free in the app"],
  [/ for \$9 one-time/g, ", free in the app"],
  [/for a one-time \$9/g, "for free"],
  // "Free to build and edit, $9 one-time to publish", and its many cousins.
  [
    /(free to build)( and edit)?(?:,| and) (?:a one-time )?\$9 (?:one-time |one time |once )?(?:to publish(?: a page)?|per (?:published )?page)/gi,
    (_match, build: string, edit?: string) => `${build}${edit ? ", edit" : ""} and publish in the app`,
  ],
  // "Free to build, $9 once to publish with PitchPage."
  [/ and publish in the app with PitchPage/g, " and publish with the PitchPage app"],
  // A price on its own, should a re-copied guide bring one.
  [/\$9 (?:one-time |one time |once )?to publish/g, "free to publish in the app"],
];

/** PitchPage's own price, restated as the app has it. Everything else is untouched. */
export function appCopy(text: string): string {
  let out = text;
  for (const [pattern, replacement] of REWRITES) {
    out = out.replace(pattern, replacement as (substring: string, ...args: string[]) => string);
  }
  // "Free to build and edit. $9 one time to publish" began its sentence with the price.
  return out.replace(/(^|[.!?]\s+)free to publish/g, "$1Free to publish");
}

/** Applies appCopy to every string in a guide, whatever field it sits in. */
function restate<T>(value: T): T {
  if (typeof value === "string") return appCopy(value) as T;
  if (Array.isArray(value)) return value.map(restate) as T;
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, restate(item)])) as T;
  }
  return value;
}

export const APP_GUIDE_PAGES: Record<string, GuidePage> = restate(GUIDE_PAGES);

export function appRelationFor(slug: string): GuideRelation {
  return restate(relationFor(slug));
}
