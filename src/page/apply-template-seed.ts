import { blockIsEmpty, type BlockData, type PageSection } from "./page-sections";
import { freshId } from "./page-types";
import { TEMPLATE_SEEDS } from "./template-seeds";

/**
 * Has the owner written anything?
 *
 * Not hasSectionContent. Every page arrives from the type step with a Contact
 * section already holding the owner's own email, and an email makes a CTA
 * count as content — so by that measure no page was ever empty and a
 * template never seeded, on any page, ever. The Contact block is the app's
 * doing, not theirs; what they wrote lives in the other sections.
 */
export function ownerHasWritten(sections: PageSection[]): boolean {
  return sections.some((s) => s.blockType !== "cta" && !blockIsEmpty(s.blockType, s.data));
}

/**
 * The family's sample content, with ids of its own.
 *
 * Fresh ids rather than the website's: two pages seeded from the same family
 * would otherwise carry the same section ids, and section analytics key on
 * them.
 *
 * The page's own Contact section survives the swap, because it holds the
 * owner's real address and anything they changed in it. The sample's copy
 * is only used where the page has none, and then with the owner's email —
 * never the persona's, which would send every enquiry to nobody.
 */
export function seedSections(
  familyId: string,
  existing: PageSection[],
  ownerEmail: string | null,
): PageSection[] | null {
  const seed = TEMPLATE_SEEDS[familyId];
  if (!seed?.sections.length) return null;
  const ownCta = existing.find((section) => section.blockType === "cta");

  const sections: PageSection[] = seed.sections.map((section, index) => {
    if (section.blockType === "cta" && ownCta) return { ...ownCta, order: index };
    return {
      id: freshId(),
      title: section.title,
      blockType: section.blockType,
      data:
        section.blockType === "cta"
          ? ({ ...section.data, email: ownerEmail ?? "" } as BlockData)
          : section.data,
      order: index,
      visible: true,
    };
  });

  // A sample without a Contact section must not cost the page its own.
  if (ownCta && !sections.some((section) => section.blockType === "cta")) {
    sections.push({ ...ownCta, order: sections.length });
  }
  return sections;
}
