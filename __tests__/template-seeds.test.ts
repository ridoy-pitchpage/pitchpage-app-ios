import { sectionsForEditing, sectionsForLayout, clampSections } from "@/page/page-sections";
import { STYLE_FAMILIES } from "@/page/style-families";
import { TEMPLATE_SEEDS } from "@/page/template-seeds";
import { seedSections } from "@/page/apply-template-seed";
import { buildSeedSections } from "@/page/page-types";

/**
 * A seeded page has to look the same while it is being edited and while it is
 * being previewed.
 *
 * The builder draws every visible section; the preview draws only the ones
 * with something in them, because a published page must not show a heading
 * over nothing. While a template seeded empty sections those two answers
 * differed — the builder showed six headings and the preview showed one — and
 * the page appeared to change when you looked at it.
 *
 * Seeding real content is what closes that gap, so this pins it: for every
 * family, what the builder shows and what the preview shows are the same
 * sections, in the same order.
 */

const seeded = STYLE_FAMILIES.map((f) => f.id).filter((id) => TEMPLATE_SEEDS[id]);

/**
 * A page built the way the app builds one: the type step's outline, then the
 * template's seed over it, with the owner's address carried through. Raw
 * seeds are not a page anybody can have — their Contact section is stripped
 * of the sample persona's address on purpose, so on its own it is empty.
 */
function pageFor(familyId: string) {
  return {
    sections: clampSections(
      seedSections(familyId, buildSeedSections("job", "owner@example.org"), "owner@example.org"),
    ),
  };
}

describe("template seeds", () => {
  it("covers every family the picker offers", () => {
    expect(seeded).toHaveLength(STYLE_FAMILIES.length);
  });

  it.each(seeded)("%s shows the same sections editing and previewing", (familyId) => {
    const page = pageFor(familyId);
    const editing = sectionsForEditing(page).map((s) => s.id);
    const preview = sectionsForLayout(page).map((s) => s.id);

    expect(editing.length).toBeGreaterThan(0);
    expect(preview).toEqual(editing);
  });

  it("survives clamping — nothing is dropped for being malformed", () => {
    for (const familyId of seeded) {
      const seed = TEMPLATE_SEEDS[familyId]!;
      // The owner's Contact section stands in for the sample's, so the count
      // is unchanged — unless the sample had none, when it is appended.
      const hasCta = seed.sections.some((s) => s.blockType === "cta");
      expect(pageFor(familyId).sections).toHaveLength(seed.sections.length + (hasCta ? 0 : 1));
    }
  });

  it("links a portrait only where the website actually serves one", () => {
    for (const familyId of seeded) {
      const portrait = TEMPLATE_SEEDS[familyId]!.portraitUrl;
      if (portrait !== null) expect(portrait).toMatch(/^\/people\//);
    }
  });
});
