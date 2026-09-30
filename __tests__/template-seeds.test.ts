import { sectionsForEditing, sectionsForLayout, clampSections } from "@/page/page-sections";
import { STYLE_FAMILIES } from "@/page/style-families";
import { TEMPLATE_SEEDS } from "@/page/template-seeds";

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

function pageFor(familyId: string) {
  const seed = TEMPLATE_SEEDS[familyId]!;
  return {
    sections: clampSections(
      seed.sections.map((s, index) => ({
        id: `${familyId}-${index}`,
        title: s.title,
        blockType: s.blockType,
        data: s.data,
        order: index,
        visible: true,
      })),
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
      expect(pageFor(familyId).sections).toHaveLength(seed.sections.length);
    }
  });

  it("links a portrait only where the website actually serves one", () => {
    for (const familyId of seeded) {
      const portrait = TEMPLATE_SEEDS[familyId]!.portraitUrl;
      if (portrait !== null) expect(portrait).toMatch(/^\/people\//);
    }
  });
});
