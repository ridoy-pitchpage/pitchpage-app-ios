import { APP_GUIDE_PAGES, appCopy, appRelationFor } from "@/content/guide-app-copy";
import { GUIDE_PAGES } from "@/content/guide-pages";

/**
 * The app sells nothing, so it must not quote the website's checkout price or
 * its credits (Guideline 3.1.3(f)), but the guides it shows are copied
 * verbatim from the site. These walk every string the app renders, so a
 * re-copied guide with a new way of saying "$9" fails here rather than in App
 * Review.
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

it("says nothing about credits, packs or refunds anywhere the app shows a guide", () => {
  const buying = /credit|refund|five-page pack|\$39 pack/i;
  const shown = [
    ...Object.values(APP_GUIDE_PAGES).flatMap(stringsIn),
    ...Object.keys(GUIDE_PAGES).flatMap((slug) => stringsIn(appRelationFor(slug))),
  ];
  expect(shown.filter((text) => buying.test(text))).toEqual([]);
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
  expect(appCopy("Free to build and edit, $9 one-time to publish.")).toBe(
    "Free to build, edit and publish in the app.",
  );
  expect(appCopy("PitchPage is free to build and a one-time $9 to publish, with no subscription.")).toBe(
    "PitchPage is free to build and publish in the app, with no subscription.",
  );
  expect(appCopy("Free to build and edit. $9 one time to publish, with no subscription.")).toBe(
    "Free to build and edit. Free to publish in the app, with no subscription.",
  );
  expect(appCopy("Publishing is $9 per page, or $39 for a five-page pack.")).toBe(
    "Publishing from the app is free, for up to 3 live pages at a time.",
  );
  expect(appCopy("PitchPage is $9 one-time per published page (free to build).")).toBe(
    "PitchPage is free to build and publish in the app.",
  );
  expect(appCopy("Want a job-ready page in minutes for a one-time $9? PitchPage.")).toBe(
    "Want a job-ready page in minutes for free? PitchPage.",
  );
  expect(appCopy("PitchPage builds one shareable pitch page with video for $9 one-time.")).toBe(
    "PitchPage builds one shareable pitch page with video, free in the app.",
  );
});

it("drops the sentences that only explain buying", () => {
  expect(
    appCopy(
      "Building on PitchPage is free. Publishing is $9 once for one page, or $39 for a five-page pack if you're tailoring per role. Credits never expire, and unused ones are refundable within 14 days.",
    ),
  ).toBe("Building on PitchPage is free. Publishing from the app is free, for up to 3 live pages at a time.");
  expect(
    appCopy(
      "Tailoring per role is common, so there's a five-page pack at $39. Credits never expire and unused ones are refundable within 14 days. Nothing renews.",
    ),
  ).toBe("Tailoring per role is common, and the app keeps up to 3 live pages at a time. Nothing renews.");
});
