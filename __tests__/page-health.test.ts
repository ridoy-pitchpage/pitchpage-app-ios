import { checkPageHealth, pageIsEmpty } from "@/page/page-health";
import { buildSeedSections } from "@/page/page-types";
import { SAMPLE_QUOTE } from "@/page/sample-content";

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

describe("Apple's Hide My Email address", () => {
  const RELAY = "x7k2pq9mzt@privaterelay.appleid.com";
  const contact = (email: string) => ({
    id: "c", title: "Contact", blockType: "cta" as const, order: 1, visible: true,
    data: { heading: "", sub: "", label: "Get in touch", url: "", email },
  });
  const ids = (page: Parameters<typeof checkPageHealth>[0]) => checkPageHealth(page).issues.map((i) => i.id);

  it("is named when it is the page's email, and is not a way to reach anybody", () => {
    expect(ids({ ...base, email: RELAY })).toEqual(["relay-email"]);
  });

  it("is named when it is in the Contact section", () => {
    expect(ids({ ...base, sections: [...base.sections, contact(RELAY.toUpperCase())] })).toContain("relay-email");
  });

  it("is still named when the page has another way in", () => {
    expect(ids({ ...base, email: RELAY, video_url: "https://x/v.mp4" })).toEqual(["relay-email"]);
  });

  it("leaves a real address alone", () => {
    expect(ids({ ...base, sections: [...base.sections, contact("jane@icloud.com")] })).toEqual([]);
  });

  it("is never written into a new page's Contact section", () => {
    const seeded = buildSeedSections("job", RELAY).find((s) => s.blockType === "cta");
    expect((seeded?.data as { email?: string }).email ?? "").toBe("");
    const real = buildSeedSections("job", "jane@icloud.com").find((s) => s.blockType === "cta");
    expect((real?.data as { email?: string }).email).toBe("jane@icloud.com");
  });
});

describe("the sample testimonial", () => {
  const quote = (name: string, words: string) => ({
    id: "q",
    title: "What people say",
    blockType: "quote_list" as const,
    order: 0,
    visible: true,
    data: { items: [{ quote: words, name, role: "VP Sales" }] },
  });

  it("is named before publishing while it is still the placeholder", () => {
    const health = checkPageHealth({
      ...base,
      sections: [quote(SAMPLE_QUOTE.name, SAMPLE_QUOTE.quote)],
    });
    expect(health.issues.map((i) => i.id)).toContain("sample-quote");
  });

  it("is not flagged once a real quote has replaced it", () => {
    const health = checkPageHealth({
      ...base,
      sections: [quote("Dana Whitfield", "Shipped the migration a quarter early.")],
    });
    expect(health.issues.map((i) => i.id)).not.toContain("sample-quote");
  });
});
