import { isTemplateSample, seedSections } from "@/page/apply-template-seed";
import { sectionsToBuild } from "@/page/build-sections";
import { blockIsEmpty, clampSections, type PageSection } from "@/page/page-sections";
import { buildSeedSections } from "@/page/page-types";

/**
 * What "Build my page" writes into, starting from pages as they really reach
 * it: the type step's outline, then a template's examples on top.
 */

const OWNER = "owner@example.org";
const JOB_TITLES = buildSeedSections("job", OWNER).map((s) => s.title);
const templated = (): PageSection[] =>
  clampSections(seedSections("banner", buildSeedSections("job", OWNER), OWNER));

describe("sectionsToBuild", () => {
  it("gives a page of nothing but examples its own type's sections, and keeps its Contact", () => {
    const page = templated();
    const ownContact = page.find((s) => s.blockType === "cta")!;
    const built = sectionsToBuild(page, "job", OWNER);

    expect(built.map((s) => s.title)).toEqual(JOB_TITLES);
    expect(built.find((s) => s.blockType === "cta")).toEqual({ ...ownContact, order: JOB_TITLES.length - 1 });
    for (const s of built.filter((x) => x.blockType !== "cta")) {
      expect(blockIsEmpty(s.blockType, s.data)).toBe(true);
      expect(s.hint).toBeTruthy();
    }
    expect(built.map((s) => s.order)).toEqual(built.map((_, i) => i));
    expect(built.some(isTemplateSample)).toBe(false);
  });

  it("keeps what the person wrote and empties only the examples, where they stand", () => {
    const page = templated().map((s) =>
      s.blockType === "cards"
        ? { ...s, data: { items: [{ title: "Craft", body: "I design the whole identity.", icon: "" }] } }
        : s,
    );
    const built = sectionsToBuild(page, "job", OWNER);

    expect(built).toHaveLength(page.length);
    built.forEach((s, i) => {
      const before = page[i]!;
      expect([s.id, s.title, s.blockType, s.order]).toEqual([before.id, before.title, before.blockType, before.order]);
      if (before.blockType === "cards" || before.blockType === "cta") expect(s).toEqual(before);
      else expect(blockIsEmpty(s.blockType, s.data)).toBe(true);
    });
  });

  it("leaves a page without examples exactly as it is", () => {
    const page = buildSeedSections("job", OWNER).map((s) =>
      s.blockType === "text_block" ? { ...s, data: { ...s.data, paragraphs: ["I design brands."] } } : s,
    );
    expect(sectionsToBuild(page, "job", OWNER)).toBe(page);
  });

  it("empties the examples in place when the page's type isn't known", () => {
    const page = templated();
    const built = sectionsToBuild(page, null, OWNER);

    expect(built.map((s) => s.title)).toEqual(page.map((s) => s.title));
    expect(built.some(isTemplateSample)).toBe(false);
    for (const s of built.filter((x) => x.blockType !== "cta")) expect(blockIsEmpty(s.blockType, s.data)).toBe(true);
  });

  it("gives an emptied example the same empty shape a new section of its kind has", () => {
    const chart = templated().find((s) => s.blockType === "chart")!;
    const [emptied] = sectionsToBuild([chart], null, OWNER);
    expect(emptied!.data).toEqual({ variant: "bars", series: [], caption: "" });
  });
});
