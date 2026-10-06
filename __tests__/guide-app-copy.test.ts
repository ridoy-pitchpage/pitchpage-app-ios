import { APP_GUIDE_PAGES, appRelationFor, inCredits } from "@/content/guide-app-copy";
import { GUIDE_PAGES } from "@/content/guide-pages";

/**
 * The app must not quote the website's checkout price (Guideline 3.1.1), but
 * the guides it shows are copied verbatim from the site. These walk every
 * string the app renders, so a re-copied guide with a new way of saying "$9"
 * fails here rather than in App Review.
 */

function stringsIn(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (value !== null && typeof value === "object") return Object.values(value).flatMap(stringsIn);
  return [];
}

/** A dollar figure that is PitchPage's own: any $39, and any $9 not in Carrd's tier list. */
function ownPrices(text: string): string[] {
  const withoutCarrd = text.replace(/\$9, \$19 or \$49/g, "");
  return withoutCarrd.match(/\$39|\$9(?![\d.])/g) ?? [];
}

it("leaves no PitchPage price in any guide the app shows", () => {
  const leftover: string[] = [];
  for (const guide of Object.values(APP_GUIDE_PAGES)) {
    for (const text of stringsIn(guide)) {
      if (ownPrices(text).length > 0) leftover.push(`${guide.slug}: ${text.slice(0, 90)}`);
    }
  }
  expect(leftover).toEqual([]);
});

it("leaves no PitchPage price in any call to action under a guide", () => {
  const leftover = Object.keys(GUIDE_PAGES)
    .map((slug) => appRelationFor(slug).ctaBlurb)
    .filter((blurb) => ownPrices(blurb).length > 0);
  expect(leftover).toEqual([]);
});

it("keeps other products' prices, which are facts about them", () => {
  const carrd = stringsIn(APP_GUIDE_PAGES["pitchpage-vs-carrd"]).join(" ");
  expect(carrd).toContain("$9, $19 or $49 per year");
  const kickresume = stringsIn(APP_GUIDE_PAGES["pitchpage-vs-kickresume"]).join(" ");
  expect(kickresume).toContain("$24/month");
});

it("changes nothing in the copied source files", () => {
  const source = stringsIn(GUIDE_PAGES).join(" ");
  expect(source).toContain("$9 one-time to publish");
});

it("reads as a sentence after the rewrite", () => {
  expect(inCredits("Free to build and edit, $9 one-time to publish.")).toBe(
    "Free to build and edit, one credit to publish.",
  );
  expect(inCredits("Free to build and edit. $9 one time to publish, with no subscription.")).toBe(
    "Free to build and edit. One credit to publish, with no subscription.",
  );
  expect(inCredits("Publishing is $9 per page, or $39 for a five-page pack.")).toBe(
    "Publishing is one credit per page, and credits also come in packs of five.",
  );
  expect(inCredits("PitchPage is $9 one-time per published page (free to build).")).toBe(
    "PitchPage is one credit per published page (free to build).",
  );
  expect(inCredits("Want a job-ready page in minutes for a one-time $9? PitchPage.")).toBe(
    "Want a job-ready page in minutes for one credit? PitchPage.",
  );
});
