import { ownerHasWritten, seedSections } from "@/page/apply-template-seed";
import { blockIsEmpty, type PageSection } from "@/page/page-sections";
import { buildSeedSections } from "@/page/page-types";

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

  it("gives every section a fresh id", () => {
    const a = seedSections("banner", [], OWNER)!.map((s) => s.id);
    const b = seedSections("banner", [], OWNER)!.map((s) => s.id);
    expect(new Set([...a, ...b]).size).toBe(a.length + b.length);
  });
});
