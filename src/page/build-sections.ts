import { isTemplateSample } from "./apply-template-seed";
import { BLOCK_DATA_SCHEMAS, blockIsEmpty, type BlockData, type PageSection } from "./page-sections";
import { buildSeedSections, type ListingAudience, type PitchKind } from "./page-types";

/**
 * The sections "Build my page" asks the AI to write into.
 *
 * Picking a template copies its example sections onto the page
 * (apply-template-seed.ts), and the website's rule for applying a draft fills
 * only sections that are empty (apply-composed.ts). Together they meant a
 * build could never touch a section: every one held a sample, so every draft
 * was dropped and only the blank name, headline and bio came through
 * (2026-10-08). An example is not the person's writing, so here it stops
 * counting as theirs:
 *
 * - A page that is nothing but examples gets its page type's own sections
 *   back, with the hints the AI writes to. The template's are someone else's
 *   page: a sales rep's "Quota Attainment" on a job page. Its Contact section
 *   is the owner's, and stays.
 * - Otherwise each example is emptied where it stands, so the AI fills it, and
 *   whatever the AI has nothing true to say about stays empty rather than
 *   keeping another person's figures under this person's name. What the
 *   person wrote is left exactly as it is.
 */
export function sectionsToBuild(
  sections: PageSection[],
  kind: PitchKind | null,
  ownerEmail: string,
  options?: { listingAudience?: ListingAudience },
): PageSection[] {
  if (!sections.some(isTemplateSample)) return sections;

  const personWrote = sections.some(
    (s) => s.blockType !== "cta" && !blockIsEmpty(s.blockType, s.data) && !isTemplateSample(s),
  );

  if (!personWrote && kind) {
    const ownContact = sections.find((s) => s.blockType === "cta");
    const typeSections = buildSeedSections(kind, ownerEmail, options);
    if (!ownContact) return typeSections;
    let placed = false;
    const withOwnContact = typeSections.map((s) => {
      if (s.blockType !== "cta" || placed) return s;
      placed = true;
      return ownContact;
    });
    if (!placed) withOwnContact.push(ownContact);
    return withOwnContact.map((s, order) => ({ ...s, order }));
  }

  return sections.map((s) => (isTemplateSample(s) ? { ...s, data: emptyData(s) } : s));
}

/** The block's own empty shape, the same one a fresh section starts with. */
function emptyData(section: PageSection): BlockData {
  return BLOCK_DATA_SCHEMAS[section.blockType].parse({}) as BlockData;
}
