import { GUIDE_PAGES, type GuidePage } from "@/content/guide-pages";
import { relationFor, type GuideRelation } from "@/content/guide-related";

/**
 * The guides as the app shows them: the website's articles, with PitchPage's
 * own price given in credits instead of dollars.
 *
 * guide-pages.ts and guide-related.ts stay verbatim copies of the website's
 * files. But the articles quote the website's checkout — "$9 one-time to
 * publish", "a five-page pack at $39" — and inside the iOS app that is a price
 * for something the app does not sell. App Review reads it as pointing people
 * at a purchase outside In-App Purchase (Guideline 3.1.1), and if the app ever
 * does sell credits, StoreKit sets its own localised price, which a hard-coded
 * "$9" would contradict. So the app states what publishing costs in the unit it
 * actually uses, and nothing else changes. Other products' prices — Carrd's
 * "$9, $19 or $49 per year" — are facts about them, and stay.
 *
 * The rewrites run on the strings rather than the files, so a re-copied guide
 * needs no edit here; __tests__/guide-app-copy.test.ts fails if it brings a
 * phrasing these do not cover.
 */

/** Most specific first: the pack sentences, then the single-page phrasings. */
const REWRITES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\$9 per page, or \$39 for a five-page pack/g, "one credit per page, and credits also come in packs of five"],
  [/\$9 once for one page, or \$39 for a five-page pack/g, "one credit per page, and credits also come in packs of five"],
  [/there's a five-page pack at \$39/g, "credits also come in packs of five"],
  [/the \$39 pack/g, "a five-credit pack"],
  [/pay \$9 once to publish/g, "use one credit to publish"],
  [/a one-time \$9 to publish/g, "one credit to publish"],
  [/a one-time \$9 per page/g, "one credit per page"],
  [/for a one-time \$9/g, "for one credit"],
  [/for \$9 one-time/g, "for one credit"],
  [/\$9 total for one published page/g, "one credit for one published page"],
  [/\$9 one-time per (published )?page/g, "one credit per $1page"],
  [/\$9 (?:one-time |one time |once )?to publish/g, "one credit to publish"],
];

/** PitchPage's own price, restated in credits. Everything else is untouched. */
export function inCredits(text: string): string {
  let out = text;
  for (const [pattern, replacement] of REWRITES) out = out.replace(pattern, replacement);
  // "Free to build and edit. $9 one time to publish" began its sentence with the price.
  return out.replace(/(^|[.!?]\s+)one credit/g, "$1One credit");
}

/** Applies inCredits to every string in a guide, whatever field it sits in. */
function restate<T>(value: T): T {
  if (typeof value === "string") return inCredits(value) as T;
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
