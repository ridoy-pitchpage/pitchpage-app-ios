import { checkPageHealth, pageIsEmpty } from "@/page/page-health";
import { buildSeedSections } from "@/page/page-types";

const base = {
  headline: "Staff engineer",
  bio: "Ten years on payments.",
  portrait_url: "https://example.com/p.jpg",
  email: "a@example.com",
  template: "corporate__blue__light",
  sections: [
    {
      id: "s1", title: "About", blockType: "text_block" as const, order: 0, visible: true,
      data: { heading: "", paragraphs: ["Something real."], bullets: [], format: "paragraph" as const },
    },
  ],
};

describe("page health", () => {
  it("passes a complete page", () => {
    expect(checkPageHealth(base).status).toBe("ready");
  });

  it("names what is missing", () => {
    const { issues } = checkPageHealth({ ...base, headline: "", portrait_url: null });
    expect(issues.map((i) => i.id).sort()).toEqual(["headline", "portrait"]);
  });

  it("only credits a CTA url on families that actually render one", () => {
    const withoutContact = { ...base, email: "", template: "corporate__blue__light", primary_cta_url: "https://x.test" };
    expect(checkPageHealth(withoutContact).issues.some((i) => i.id === "cta")).toBe(true);

    // Premium is one of the five that do render it.
    const premium = { ...withoutContact, template: "premium__gold__light" };
    expect(checkPageHealth(premium).issues.some((i) => i.id === "cta")).toBe(false);
  });

  it("treats a freshly seeded page as empty", () => {
    // Every seed ships blank, so a page nobody has filled in must be caught
    // before a credit is spent on it.
    for (const kind of ["job", "athlete", "contractor", "university"] as const) {
      const sections = buildSeedSections(kind, "a@example.com");
      expect(pageIsEmpty({ sections, template: "corporate__blue__light" })).toBe(true);
    }
  });

  it("does not call a page with one filled section empty", () => {
    expect(pageIsEmpty(base)).toBe(false);
  });

  it("does not call a page with only a video empty", () => {
    expect(pageIsEmpty({ template: "corporate__blue__light", sections: [], video_url: "https://x/v.mp4" })).toBe(false);
  });
});
