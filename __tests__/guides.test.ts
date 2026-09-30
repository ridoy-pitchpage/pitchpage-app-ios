import { GUIDE_CATEGORIES, GUIDE_PAGES, type GuideBlock } from "@/content/guide-pages";
import { inlineRe, stripInline } from "@/content/guide-inline";
import { nodesToPlainText, parseInline } from "@/content/guide-inline-parse";
import { relationFor } from "@/content/guide-related";

/**
 * The guide copy is hand-written and shipped in the bundle, so nothing at
 * runtime can tell you a link in it points nowhere — the reader just taps and
 * lands on the wrong thing. These walk the whole registry.
 */

const GUIDES = Object.values(GUIDE_PAGES);

/** Every string in a guide that the reader actually sees. */
function proseOf(slug: string): string[] {
  const guide = GUIDE_PAGES[slug];
  if (!guide) return [];
  const fromBlock = (b: GuideBlock): string[] => (b.type === "p" ? [b.text] : b.items);
  return [
    guide.intro,
    ...guide.sections.flatMap((s) => s.blocks.flatMap(fromBlock)),
    ...guide.faqs.map((f) => f.a),
  ];
}

function hrefsOf(text: string): string[] {
  const out: string[] = [];
  const re = inlineRe();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) != null) if (m[2]) out.push(m[2]);
  return out;
}

it("has guides, each keyed by its own slug and in a real category", () => {
  expect(GUIDES.length).toBeGreaterThan(0);
  for (const [key, guide] of Object.entries(GUIDE_PAGES)) {
    expect(guide.slug).toBe(key);
    expect(GUIDE_CATEGORIES).toContain(guide.category);
    expect(guide.h1.length).toBeGreaterThan(0);
    expect(guide.sections.length).toBeGreaterThan(0);
  }
});

it("points every internal /guide link at a guide that exists", () => {
  const broken: string[] = [];
  for (const guide of GUIDES) {
    for (const text of proseOf(guide.slug)) {
      for (const href of hrefsOf(text)) {
        if (!href.startsWith("/guide/")) continue;
        const slug = href.replace(/^\/guide\//, "").replace(/\/$/, "");
        if (!GUIDE_PAGES[slug]) broken.push(`${guide.slug} -> ${href}`);
      }
    }
  }
  expect(broken).toEqual([]);
});

it("writes every other internal link as a rooted path, never a bare word", () => {
  const bad: string[] = [];
  for (const guide of GUIDES) {
    for (const text of proseOf(guide.slug)) {
      for (const href of hrefsOf(text)) {
        const ok = href.startsWith("/") || /^https?:\/\//i.test(href);
        if (!ok) bad.push(`${guide.slug} -> ${href}`);
      }
    }
  }
  expect(bad).toEqual([]);
});

it("gives every guide three related guides that exist and are not itself", () => {
  for (const guide of GUIDES) {
    const relation = relationFor(guide.slug);
    expect(relation.related).toHaveLength(3);
    expect(new Set(relation.related).size).toBe(3);
    for (const slug of relation.related) {
      expect(slug).not.toBe(guide.slug);
      expect(GUIDE_PAGES[slug]).toBeDefined();
    }
    expect(relation.ctaLabel.length).toBeGreaterThan(0);
    expect(relation.ctaBlurb.length).toBeGreaterThan(0);
  }
});

it("leaves no inline marker in the plain-text projection", () => {
  const leftover: string[] = [];
  for (const guide of GUIDES) {
    for (const text of proseOf(guide.slug)) {
      const plain = stripInline(text);
      if (/\*\*|\]\(|https?:\/\//.test(plain)) leftover.push(`${guide.slug}: ${plain.slice(0, 60)}`);
    }
  }
  expect(leftover).toEqual([]);
});

it("closes every inline marker it opens", () => {
  const unbalanced: string[] = [];
  for (const guide of GUIDES) {
    for (const text of proseOf(guide.slug)) {
      // An odd number of ** means one run was never closed, which renders as
      // literal asterisks in the middle of a sentence.
      const stars = (text.match(/\*\*/g) ?? []).length;
      const open = (text.match(/\[/g) ?? []).length;
      const close = (text.match(/\]/g) ?? []).length;
      if (stars % 2 !== 0 || open !== close) {
        unbalanced.push(`${guide.slug}: ${text.slice(0, 60)}`);
      }
    }
  }
  expect(unbalanced).toEqual([]);
});

it("renders every marker, including bold nested inside a link label", () => {
  // The statistics guide writes `[**more than 300 applications**](https://…)`.
  // A parser that treats a link label as plain text leaves the asterisks in
  // the sentence, which is what shipped before this test existed.
  const leftover: string[] = [];
  for (const guide of GUIDES) {
    for (const text of proseOf(guide.slug)) {
      const rendered = nodesToPlainText(parseInline(text));
      if (/\*\*|\]\(/.test(rendered)) leftover.push(`${guide.slug}: ${rendered.slice(0, 70)}`);
      // The rendered words must be exactly the words, no more and no fewer.
      expect(rendered).toBe(stripInline(text));
    }
  }
  expect(leftover).toEqual([]);
});

it("keeps a link's href out of the words and attaches it to the link", () => {
  const nodes = parseInline("See [**the report**](https://example.com/r) for more.");
  expect(nodesToPlainText(nodes)).toBe("See the report for more.");
  const link = nodes.find((n) => n.type === "link");
  expect(link).toMatchObject({ type: "link", href: "https://example.com/r" });
  expect(link && link.type === "link" && link.children[0]?.type).toBe("bold");
});
