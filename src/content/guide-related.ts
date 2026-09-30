// ─────────────────────────────────────────────────────────────────────────────
// COPIED from the website: src/lib/guide-related.ts. One change: the import
// path, since the registry lives under @/content here. The CTA targets are
// web routes; src/content/guide-cta.ts maps them to app screens.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Related guides + the per-article call to action ────────────────────────
// Kept out of guide-pages.ts on purpose: that file is the article CONTENT, and
// this is the graph between articles plus where each one should send a reader
// next. Editing one does not mean re-reading the other.
//
// CURATED is the editorial layer. Anything missing from it falls back to
// same-category siblings, so a guide added tomorrow still gets sensible links
// and a working CTA without touching this file.
import { GUIDE_PAGES, type GuidePage } from "@/content/guide-pages";

/** Real routes only. A CTA pointing at a path that does not exist is a 404 in
 *  the one place an article has earned a click. */
export type GuideCtaTo =
  | "/auth"
  | "/examples"
  | "/features"
  | "/tracking"
  | "/pricing"
  | "/compare"
  | "/for";

export type GuideRelation = {
  /** Three slugs, never including the guide's own. */
  related: string[];
  ctaTo: GuideCtaTo;
  /** Button text, kept to a few words. */
  ctaLabel: string;
  /** One sentence under the button. */
  ctaBlurb: string;
};

/* Picked per article from its own content, then every set challenged by a
   second pass that rejected weak links and loose CTA copy. Two of its
   corrections should stay: no blurb states a style count, because that number
   is ACTIVE_STYLE_FAMILIES.length and is derived everywhere else, so a literal
   here would go stale in silence; and the CTA is not /auth on all fifteen. */
export const CURATED: Record<string, GuideRelation> = {
  "what-to-send-instead-of-a-resume": {
    related: ["what-is-a-pitch-page", "pitch-page-vs-resume", "how-to-record-an-intro-video-for-a-job"],
    ctaTo: "/examples",
    ctaLabel: "See finished pitch pages",
    ctaBlurb: "Browse finished pitch pages across every style to see exactly what you would send instead of a PDF.",
  },
  "what-is-a-pitch-page": {
    related: ["what-to-send-instead-of-a-resume", "pitch-page-vs-resume", "how-to-record-an-intro-video-for-a-job"],
    ctaTo: "/examples",
    ctaLabel: "See example pitch pages",
    ctaBlurb: "Browse finished pitch pages in every visual style to see how the sections, video and metrics come together.",
  },
  "pitch-page-vs-resume": {
    related: ["what-is-a-pitch-page", "what-to-send-instead-of-a-resume", "how-to-prove-not-another-ai-application"],
    ctaTo: "/auth",
    ctaLabel: "Build your pitch page",
    ctaBlurb: "Build and edit free, pay $9 once to publish, then lead with the link instead of the PDF.",
  },
  "pitchpage-vs-carrd": {
    related: ["what-is-a-pitch-page", "how-to-make-a-personal-website-for-job-search", "resume-alternative-tools"],
    ctaTo: "/examples",
    ctaLabel: "Browse example pitch pages",
    ctaBlurb: "See finished pages in every style and judge the design before you build one.",
  },
  "pitchpage-vs-flowcv": {
    related: ["pitch-page-vs-resume", "what-to-send-instead-of-a-resume", "how-to-prove-not-another-ai-application"],
    ctaTo: "/auth",
    ctaLabel: "Start from your resume",
    ctaBlurb: "Upload the resume you already have and PitchPage composes a page from it. Free to build, $9 to publish.",
  },
  "how-to-stand-out-in-job-applications": {
    related: ["what-to-send-instead-of-a-resume", "how-to-record-an-intro-video-for-a-job", "how-to-prove-not-another-ai-application"],
    ctaTo: "/auth",
    ctaLabel: "Build your pitch page",
    ctaBlurb: "Free to build and edit, $9 one time to publish when you are ready to send it.",
  },
  "how-to-make-a-personal-website-for-job-search": {
    related: ["what-is-a-pitch-page", "how-to-record-an-intro-video-for-a-job", "pitchpage-vs-carrd"],
    ctaTo: "/auth",
    ctaLabel: "Build your page free",
    ctaBlurb: "Upload your resume and get a first draft in minutes. Free to build, $9 once to publish.",
  },
  "how-to-record-an-intro-video-for-a-job": {
    related: ["what-is-a-pitch-page", "how-to-prove-not-another-ai-application", "what-to-send-instead-of-a-resume"],
    ctaTo: "/features",
    ctaLabel: "See the video size limit",
    ctaBlurb: "The features page shows the intro video size limit and how the video sits inside your page.",
  },
  "do-recruiters-read-cover-letters": {
    related: ["what-to-send-instead-of-a-resume", "how-to-prove-not-another-ai-application", "what-is-a-pitch-page"],
    ctaTo: "/examples",
    ctaLabel: "See pitch page examples",
    ctaBlurb: "See finished pitch pages in every style, so you know what the link in your note actually shows.",
  },
  "job-search-statistics": {
    related: ["what-to-send-instead-of-a-resume", "how-to-stand-out-in-job-applications", "how-to-prove-not-another-ai-application"],
    ctaTo: "/tracking",
    ctaLabel: "See what tracking shows",
    ctaBlurb: "Sixty percent say the worst part is not knowing if anyone looked. Tracking shows opens, watch depth, downloads.",
  },
  "pitchpage-vs-kickresume": {
    related: ["what-is-a-pitch-page", "pitch-page-vs-resume", "how-to-stand-out-in-job-applications"],
    ctaTo: "/examples",
    ctaLabel: "See finished pitch pages",
    ctaBlurb: "Browse real pitch pages across roles and styles to see what you would send instead of a PDF.",
  },
  "pitchpage-vs-enhancv": {
    related: ["what-is-a-pitch-page", "how-to-prove-not-another-ai-application", "resume-alternative-tools"],
    ctaTo: "/examples",
    ctaLabel: "See finished pitch pages",
    ctaBlurb: "Browse real sample pages in every visual style to see what you would send instead of a PDF.",
  },
  "pitchpage-vs-visualcv": {
    related: ["what-is-a-pitch-page", "how-to-record-an-intro-video-for-a-job", "resume-alternative-tools"],
    ctaTo: "/tracking",
    ctaLabel: "See how tracking works",
    ctaBlurb: "See exactly what PitchPage tracking records about visitors, how visitor identity works, and what stays private.",
  },
  "resume-alternative-tools": {
    related: ["what-to-send-instead-of-a-resume", "what-is-a-pitch-page", "pitch-page-vs-resume"],
    ctaTo: "/examples",
    ctaLabel: "See finished pitch pages",
    ctaBlurb: "Browse finished pitch pages and see what a resume replacement actually looks like.",
  },
  "how-to-prove-not-another-ai-application": {
    related: ["how-to-record-an-intro-video-for-a-job", "what-is-a-pitch-page", "job-search-statistics"],
    ctaTo: "/tracking",
    ctaLabel: "See how view tracking works",
    ctaBlurb: "Exactly what is measured when someone opens your page, who a visitor is, and what is never kept.",
  },
};

const DEFAULT_CTA: Omit<GuideRelation, "related"> = {
  ctaTo: "/auth",
  ctaLabel: "Build my pitch page",
  ctaBlurb: "Free to build and edit. $9 one time to publish, with no subscription.",
};

/** Same-category siblings first, then anything else, never itself. */
function fallbackRelated(slug: string): string[] {
  const self = GUIDE_PAGES[slug];
  const all = Object.values(GUIDE_PAGES).filter((g: GuidePage) => g.slug !== slug);
  const sameCategory = all.filter((g) => self && g.category === self.category);
  const rest = all.filter((g) => !self || g.category !== self.category);
  return [...sameCategory, ...rest].slice(0, 3).map((g) => g.slug);
}

export function relationFor(slug: string): GuideRelation {
  const curated = CURATED[slug];
  const related = (curated?.related ?? fallbackRelated(slug))
    .filter((s) => s !== slug && Boolean(GUIDE_PAGES[s]))
    .slice(0, 3);
  // A curated list that lost entries to the guard above is topped up rather
  // than rendered short.
  const topped =
    related.length === 3
      ? related
      : [...related, ...fallbackRelated(slug).filter((s) => !related.includes(s))].slice(0, 3);
  return {
    related: topped,
    ctaTo: curated?.ctaTo ?? DEFAULT_CTA.ctaTo,
    ctaLabel: curated?.ctaLabel ?? DEFAULT_CTA.ctaLabel,
    ctaBlurb: curated?.ctaBlurb ?? DEFAULT_CTA.ctaBlurb,
  };
}
