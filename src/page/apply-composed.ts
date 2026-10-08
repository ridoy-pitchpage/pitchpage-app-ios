// ─── Applying a compose to a page: THE rule that makes it safe ──────────────
// A compose may only fill a section that is still EMPTY and that the person
// has not edited by hand. It can never overwrite written content, so someone
// who skipped the material step, answered three sections and then added their
// resume keeps every word they wrote. Basics follow the same rule: fill only
// what is still blank.
//
// Pure, and importing only ./page-sections, so the iOS app copies this file
// verbatim (its src/page/apply-composed.ts) and both apply a compose by the
// same rule. Used by the wizard's applyComposedSections.

import { blockIsEmpty, type PageSection } from "./page-sections";

export type ComposeResultToApply = {
  filled: Record<string, PageSection["data"]>;
  upgraded: Record<string, "metric_grid">;
  /** Sections the AI WROTE rather than transcribed — narrative only. */
  unconfirmed: string[];
  basics: { full_name: string; headline: string; bio: string };
};

export type ComposeApplication = {
  sections: PageSection[];
  /** The drafts actually applied — the only ones that may carry an "AI-written" badge. */
  appliedDrafts: string[];
  /** Only the basics that were blank and now have a value. */
  basics: { full_name?: string; headline?: string; bio?: string };
};

export function applyComposedToPage(
  current: {
    sections?: PageSection[] | null;
    full_name?: string | null;
    headline?: string | null;
    bio?: string | null;
  },
  /** wizard_meta.edited: sections the person has written in by hand. */
  edited: readonly string[] | null | undefined,
  result: ComposeResultToApply,
): ComposeApplication {
  const editedIds = new Set(edited ?? []);
  // Which drafts were actually APPLIED. A section can be returned as a draft
  // and then skipped below (already filled, or hand-edited), and badging one
  // the person never received would point at their own words.
  const draftedIn = new Set(result.unconfirmed);
  const appliedDrafts: string[] = [];
  const sections = (current.sections ?? []).map((s) => {
    const incoming = result.filled[s.id];
    if (incoming === undefined) return s; // the source had nothing for it
    if (editedIds.has(s.id)) return s; // the person's own words outrank ours
    if (!blockIsEmpty(s.blockType, s.data)) return s; // never overwrite content
    if (draftedIn.has(s.id)) appliedDrafts.push(s.id);
    // A section promoted from prose to a stat grid changes shape as well as
    // content — the data was validated against the NEW type server-side.
    const promoted = result.upgraded[s.id];
    return promoted ? { ...s, blockType: promoted, data: incoming } : { ...s, data: incoming };
  });

  const basics: ComposeApplication["basics"] = {};
  if (!current.full_name?.trim() && result.basics.full_name) basics.full_name = result.basics.full_name;
  if (!current.headline?.trim() && result.basics.headline) basics.headline = result.basics.headline;
  if (!current.bio?.trim() && result.basics.bio) basics.bio = result.basics.bio;

  return { sections, appliedDrafts, basics };
}

/** wizard_meta.unconfirmed with the newly applied drafts added, each once. */
export function withUnconfirmed(existing: readonly string[] | null | undefined, appliedDrafts: readonly string[]): string[] {
  return Array.from(new Set([...(existing ?? []), ...appliedDrafts]));
}
