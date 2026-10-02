import { blockIsEmpty, sectionsForLayout, type PageSection } from "./page-sections";
import { isSampleQuote } from "./sample-content";

/**
 * The pre-publish health nudge, ported from `src/lib/page-health.ts` in the web
 * repo.
 *
 * It catches a thin or clearly incomplete page before the credit is spent,
 * because a paid-for empty page is the worst possible first impression. It is a
 * nudge and nothing more: it never blocks publishing, and it does not change
 * what counts as publishable. The one exception is `pageIsEmpty` below.
 */

/**
 * Only five of the template families actually render the page-level CTA url.
 * On every other family that url is never shown, so a page whose only contact
 * route is a CTA url has no visible way to get in touch and must not be
 * credited with one.
 */
const CTA_URL_FAMILIES = new Set(["credential", "saas", "personal", "premium", "skyline"]);

/**
 * A template key is `family__color[__mode]`. Only the family is needed here, so
 * this reads it directly rather than pulling in the web's 1,500-line style
 * registry; an unknown key simply is not in the set above.
 */
function rendersCtaUrl(template?: string | null): boolean {
  if (!template) return false;
  const family = template.split("__")[0] ?? template;
  return CTA_URL_FAMILIES.has(family);
}

export type PageHealthIssue = { id: string; label: string };
export type PageHealth = { status: "ready" | "needs_attention"; issues: PageHealthIssue[] };

export type PageHealthInput = {
  headline?: string | null;
  bio?: string | null;
  portrait_url?: string | null;
  primary_cta_url?: string | null;
  final_cta_url?: string | null;
  video_url?: string | null;
  email?: string | null;
  template?: string | null;
  sections?: PageSection[] | null;
};

const has = (value?: string | null): boolean => Boolean(value && value.trim());

export function checkPageHealth(page: PageHealthInput): PageHealth {
  const issues: PageHealthIssue[] = [];

  if (!has(page.headline)) issues.push({ id: "headline", label: "Add a headline" });
  if (!has(page.bio)) issues.push({ id: "bio", label: "Add a short bio" });
  if (!has(page.portrait_url)) {
    issues.push({ id: "portrait", label: "Upload a portrait or headshot" });
  }

  // "Thin" reuses the layout contract — visible, non-empty, sorted — minus the
  // cta, which is not body content.
  const bodySections = sectionsForLayout(page).filter((s) => s.blockType !== "cta");
  if (bodySections.length === 0) {
    issues.push({ id: "content", label: "Add some content to your page" });
  }

  // Only flag a missing contact route when there is genuinely none: a video
  // renders as a "#video" anchor, and an email or a filled cta section are both
  // real ways to reach the person.
  const ctaSection = (page.sections ?? []).find(
    (s) => s.blockType === "cta" && !blockIsEmpty(s.blockType, s.data),
  );
  const ctaData = (ctaSection?.data ?? {}) as { url?: string; email?: string };
  const hasContactPath =
    (rendersCtaUrl(page.template) && (has(page.primary_cta_url) || has(page.final_cta_url))) ||
    has(page.video_url) ||
    has(page.email) ||
    has(ctaData.url) ||
    has(ctaData.email);
  if (!hasContactPath) {
    issues.push({ id: "cta", label: "Add a way for people to contact you" });
  }

  // App-only, on purpose: the website never seeds a testimonial, so its own
  // check has nothing to look for. A quote still reading "Their name" is the
  // template's placeholder, not somebody vouching for the owner.
  const sampleQuoteLeft = (page.sections ?? []).some(
    (s) =>
      s.visible !== false &&
      s.blockType === "quote_list" &&
      ((s.data as { items?: Array<Record<string, unknown>> }).items ?? []).some(isSampleQuote),
  );
  if (sampleQuoteLeft) {
    issues.push({ id: "sample-quote", label: "Replace the sample testimonial, or remove it" });
  }

  return { status: issues.length === 0 ? "ready" : "needs_attention", issues };
}

export type EmptyCheckInput = PageHealthInput & {
  portfolio?: { images?: unknown[] } | null;
  film?: { clips?: unknown[] } | null;
  listing?: Record<string, unknown> | null;
};

/**
 * The one case that is not a nudge.
 *
 * Everything above is advisory: a sparse page is still the customer's call.
 * A page with nothing on it is different — publishing costs a credit and puts
 * a public URL under their own name with nothing to read on it. That is not a
 * judgement about taste, it is a receipt with no product behind it.
 *
 * Deliberately narrow. This is not "thin", it is EMPTY: one filled section, a
 * bio, a video or a single photo all clear it.
 */
export function pageIsEmpty(page: EmptyCheckInput): boolean {
  const bodySections = sectionsForLayout(page).filter((s) => s.blockType !== "cta");
  if (bodySections.length > 0) return false;
  if (has(page.bio) || has(page.headline)) return false;
  if (has(page.video_url) || has(page.portrait_url)) return false;
  if ((page.portfolio?.images ?? []).length > 0) return false;
  if ((page.film?.clips ?? []).length > 0) return false;
  // A property listing carries its content in its own column, not in sections.
  if (page.listing && Object.values(page.listing).some((v) => String(v ?? "").trim())) {
    return false;
  }
  return true;
}

export const EMPTY_PAGE_MESSAGE =
  "There's nothing on this page yet. Add something — a few sentences, a photo, or a video — before you publish it.";
