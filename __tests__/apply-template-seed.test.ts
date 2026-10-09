import { isTemplateSample, ownerHasWritten, seedSections } from "@/page/apply-template-seed";
import { blockIsEmpty, clampSections, type PageSection } from "@/page/page-sections";
import { buildSeedSections } from "@/page/page-types";
import { TEMPLATE_SEEDS } from "@/page/template-seeds";

/**
 * A template seeds the page that actually reaches it.
 *
 * The first version of this checked whether the page "had content", and
 * every page arriving from the type step does: its Contact section is
 * pre-filled with the owner's own email, and an email makes a CTA count. So
 * the seed never fired on a single real page, while a test that only looked
 * at the seeds themselves passed. These start from the page as the type step
 * leaves it, because that is the only page this code ever sees.
 */

const OWNER = "owner@example.org";
const fromTypeStep = (): PageSection[] => buildSeedSections("job", OWNER);

describe("ownerHasWritten", () => {
  it("is false for a page straight out of the type step", () => {
    expect(ownerHasWritten(fromTypeStep())).toBe(false);
  });

  it("is true once anything outside Contact has been written", () => {
    const sections = fromTypeStep().map((s) =>
      s.blockType === "text_block"
        ? { ...s, data: { ...s.data, paragraphs: ["I build payment systems."] } }
        : s,
    );
    expect(ownerHasWritten(sections)).toBe(true);
  });
});

describe("seedSections", () => {
  it("replaces the empty outline with the family's content", () => {
    const seeded = seedSections("banner", fromTypeStep(), OWNER)!;
    const filled = seeded.filter((s) => !blockIsEmpty(s.blockType, s.data));
    // Far more than the one Contact block the outline had.
    expect(filled.length).toBeGreaterThan(3);
  });

  it("keeps the owner's own Contact section, address and all", () => {
    const outline = fromTypeStep();
    const ownCta = outline.find((s) => s.blockType === "cta")!;
    const seeded = seedSections("banner", outline, OWNER)!;
    const cta = seeded.filter((s) => s.blockType === "cta");

    expect(cta).toHaveLength(1);
    expect(cta[0]!.id).toBe(ownCta.id);
    expect((cta[0]!.data as { email: string }).email).toBe(OWNER);
  });

  it("never routes contact to a sample persona", () => {
    // No existing Contact section: the sample's copy is used, with the
    // owner's address — never jaylen.reed@example.com or a cal.com link.
    const seeded = seedSections("spotlight", [], OWNER)!;
    for (const s of seeded.filter((x) => x.blockType === "cta")) {
      const data = s.data as { email: string; url: string };
      expect(data.email).toBe(OWNER);
      expect(data.url).toBe("");
    }
  });

  it("never routes contact to Apple's Hide My Email address", () => {
    const seeded = seedSections("spotlight", [], "x7k2pq9mzt@privaterelay.appleid.com")!;
    for (const s of seeded.filter((x) => x.blockType === "cta")) {
      expect((s.data as { email: string }).email).toBe("");
    }
  });

  it("gives every section a fresh id", () => {
    const a = seedSections("banner", [], OWNER)!.map((s) => s.id);
    const b = seedSections("banner", [], OWNER)!.map((s) => s.id);
    expect(new Set([...a, ...b]).size).toBe(a.length + b.length);
  });
});

describe("isTemplateSample", () => {
  // A page as the app reads it back: the database keeps sections as jsonb,
  // which returns keys shorter-first and then alphabetically, and every read
  // goes through clampSections.
  const jsonbOrder = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(jsonbOrder);
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      const keys = Object.keys(record).sort((a, b) => a.length - b.length || (a < b ? -1 : 1));
      return Object.fromEntries(keys.map((key) => [key, jsonbOrder(record[key])]));
    }
    return value;
  };
  const asStored = (sections: PageSection[]): PageSection[] =>
    clampSections(JSON.parse(JSON.stringify(jsonbOrder(sections))));

  it("recognises every section any template seeds, read back from the database", () => {
    for (const familyId of Object.keys(TEMPLATE_SEEDS)) {
      const seeded = seedSections(familyId, fromTypeStep(), OWNER);
      if (!seeded) continue;
      const samples = asStored(seeded).filter(
        (s) => s.blockType !== "cta" && !blockIsEmpty(s.blockType, s.data),
      );
      expect(samples.length).toBeGreaterThan(0);
      for (const section of samples) expect([familyId, isTemplateSample(section)]).toEqual([familyId, true]);
    }
  });

  it("stops counting a section the moment one word in it changes", () => {
    const seeded = asStored(seedSections("banner", fromTypeStep(), OWNER)!);
    const numbers = seeded.find((s) => s.blockType === "metric_grid")!;
    const items = (numbers.data as { items: Array<{ value: string }> }).items;
    const edited = { ...numbers, data: { items: [{ ...items[0]!, value: "$3M" }, ...items.slice(1)] } };

    expect(isTemplateSample(numbers)).toBe(true);
    expect(isTemplateSample(edited as PageSection)).toBe(false);
  });

  it("never counts an empty section or a Contact section", () => {
    for (const section of fromTypeStep()) expect(isTemplateSample(section)).toBe(false);
    const seeded = asStored(seedSections("banner", fromTypeStep(), OWNER)!);
    for (const cta of seeded.filter((s) => s.blockType === "cta")) expect(isTemplateSample(cta)).toBe(false);
  });

  it("still counts a sample the person only hid or renamed", () => {
    const sample = asStored(seedSections("banner", fromTypeStep(), OWNER)!).find(
      (s) => s.blockType === "metric_grid",
    )!;
    expect(isTemplateSample({ ...sample, visible: false, title: "My numbers" })).toBe(true);
  });
});
