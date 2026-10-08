import {
  BLOCK_DATA_SCHEMAS,
  blockIsEmpty,
  type BlockData,
  type BlockType,
  type PageSection,
} from "./page-sections";
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

/**
 * Is this section still exactly a template's example, untouched?
 *
 * A seeded section carries no mark of where it came from, so the only honest
 * test is its content: the same block type and the same data as one of the
 * templates' samples. One changed word makes it the person's. Both sides go
 * through the block's own schema first, which is what reading a page does,
 * and are compared without regard to key order, because the database stores
 * the data as jsonb and hands its keys back in its own order.
 *
 * Contact never counts: a seeded Contact carries the owner's real address,
 * which is theirs whatever the sample said around it.
 */
export function isTemplateSample(section: PageSection): boolean {
  if (section.blockType === "cta" || blockIsEmpty(section.blockType, section.data)) return false;
  const content = normalisedContent(section.blockType, section.data);
  return content != null && sampleContents().has(`${section.blockType}|${content}`);
}

let sampleContentCache: Set<string> | null = null;

function sampleContents(): Set<string> {
  if (sampleContentCache) return sampleContentCache;
  const contents = new Set<string>();
  for (const seed of Object.values(TEMPLATE_SEEDS)) {
    for (const section of seed?.sections ?? []) {
      if (section.blockType === "cta") continue;
      const content = normalisedContent(section.blockType, section.data);
      if (content != null) contents.add(`${section.blockType}|${content}`);
    }
  }
  sampleContentCache = contents;
  return contents;
}

function normalisedContent(blockType: BlockType, data: unknown): string | null {
  const parsed = BLOCK_DATA_SCHEMAS[blockType].safeParse(data ?? {});
  return parsed.success ? canonicalJson(parsed.data) : null;
}

/** JSON with every object's keys sorted, and undefined fields left out as JSON would. */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const fields = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`);
    return `{${fields.join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}
