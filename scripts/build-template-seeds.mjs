/**
 * Turns the website's per-family sample personas into seeds the app can put
 * on a new page.
 *
 * A template used to arrive as an outline of empty sections. The builder drew
 * them with their hints so they could be filled in, but the preview drops
 * empty sections — a published page must not show a heading over nothing —
 * so the two disagreed about what the page was. Giving the sections real
 * content makes them agree, and is what "show me the template with its
 * content" asks for.
 *
 * The source is sample-personas.ts in the WEB repo, dumped to JSON. To
 * refresh it, run a script there that writes { [familyId]: sampleData(id) }
 * and drop the file at .design-sources/sample-dump.json, then run this.
 *
 *   node scripts/build-template-seeds.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const dump = JSON.parse(readFileSync(".design-sources/sample-dump.json", "utf8"));
const families = JSON.parse(
  JSON.stringify(
    [...readFileSync("src/page/style-families.ts", "utf8").matchAll(/\{ id: "([a-z-]+)", label: "[^"]+", category:/g)].map((m) => m[1]),
  ),
);

// The app's own list, so a family the website still carries but the picker
// retired never reaches a page.
const BLOCK_TYPES = new Set([
  "metric_grid", "text_block", "timeline", "cards",
  "quote_list", "logo_row", "tag_list", "chart", "cta",
]);
const MAX_SECTIONS = 16;

// The app's BLOCK_DATA_SCHEMAS parse with defaults, but its BlockData TYPE
// requires every key. The website's rows carry a few extras (a period on a
// quote) and omit a few optionals (a heading on a tag list), so each block is
// reshaped to exactly the app's key set here rather than cast past the
// compiler and left to fail a zod parse at save time.
const SAMPLE_QUOTE = {
  quote: "Add a line from someone who has worked with you — their words, copied exactly.",
  name: "Their name",
  role: "Their role",
};

const S = (v, max) => String(v ?? "").slice(0, max);
const A = (v, cap, map) => (Array.isArray(v) ? v.slice(0, cap).map(map) : []);

function normalize(type, d) {
  switch (type) {
    case "metric_grid":
      return { items: A(d.items, 8, (i) => ({ value: S(i.value, 24), label: S(i.label, 60), sub: S(i.sub, 80) })) };
    case "text_block":
      return {
        heading: S(d.heading, 120),
        paragraphs: A(d.paragraphs, 4, (x) => S(x, 800)),
        bullets: A(d.bullets, 8, (x) => S(x, 240)),
        format: d.format === "bullets" ? "bullets" : "paragraph",
      };
    case "timeline":
      return {
        location: S(d.location, 120),
        items: A(d.items, 8, (i) => ({ period: S(i.period, 60), title: S(i.title, 120), org: S(i.org, 160), bullets: A(i.bullets, 6, (b) => S(b, 300)) })),
      };
    case "cards":
      return { items: A(d.items, 20, (i) => ({ title: S(i.title, 80), body: S(i.body, 320), icon: S(i.icon, 24) })) };
    case "quote_list":
      // The sample's quotes are signed by people who do not exist. Seeded onto a
      // real page they become a fabricated endorsement under the owner's name, so
      // the section keeps its place and says what belongs there instead. Same
      // strings as SAMPLE_QUOTE in src/page/sample-content.ts; the test checks.
      return { items: [{ ...SAMPLE_QUOTE }] };
    case "logo_row":
      return { heading: S(d.heading, 80), names: A(d.names, 12, (x) => S(x, 60)) };
    case "tag_list":
      return { heading: S(d.heading, 80), tags: A(d.tags, 16, (x) => S(x, 80)) };
    case "chart":
      return {
        variant: d.variant === "line" || d.variant === "donut" ? d.variant : "bars",
        series: A(d.series, 12, (i) => ({ label: S(i.label, 60), value: Number(i.value) || 0 })),
        caption: S(d.caption, 120),
      };
    case "cta":
      // The copy is kept and the contact details are NOT. Every sample routes
      // to a persona that does not exist — jaylen.reed@example.com, a mailto,
      // a cal.com link — and a seed carrying them would publish a real
      // person's page with its Contact button pointing at nobody. The app
      // fills the owner's own address in when it seeds.
      return { heading: S(d.heading, 120), sub: S(d.sub, 200), label: S(d.label, 60), url: "", email: "" };
    default:
      return {};
  }
}

const seeds = {};
let withPortrait = 0;


for (const id of families) {
  const persona = dump[id];
  if (!persona) continue;

  const sections = (persona.sections ?? [])
    .filter((s) => s && BLOCK_TYPES.has(s.blockType) && s.visible !== false)
    .slice(0, MAX_SECTIONS)
    .map((s, index) => ({
      title: String(s.title ?? ""),
      blockType: s.blockType,
      order: index,
      data: normalize(s.blockType, s.data ?? {}),
    }));
  if (!sections.length) continue;

  // Only a path the site actually serves. The rest are /src/assets/… — real
  // files inside the website's bundle, with no public URL to point at, so
  // linking them would give every page a broken image.
  // No portrait is ever seeded. The few samples with a servable photo show a
  // real-looking stranger, and seeded as the page's portrait that face would be
  // published as the owner. The publish check already asks for their own.
  const portrait = null;
  if (portrait) withPortrait += 1;

  seeds[id] = { portraitUrl: portrait, sections };
}
const body = Object.entries(seeds)
  .map(([id, seed]) => `  ${JSON.stringify(id)}: ${JSON.stringify(seed)},`)
  .join("\n");

writeFileSync(
  "src/page/template-seeds.ts",
  `import type { BlockData, BlockType } from "./page-sections";

/**
 * The content a template arrives with.
 *
 * Generated by scripts/build-template-seeds.mjs from the website's own sample
 * personas — do not edit by hand. Each family's sample is role-matched: the
 * job families read as a job application, the sales ones as a sales page.
 *
 * It is EXAMPLE content, not the person's. It goes on a page only while that
 * page has nothing on it, and every section can be edited or removed.
 */
export type TemplateSeed = {
  /** Only ever a path the website serves; null where the sample has none. */
  portraitUrl: string | null;
  sections: { title: string; blockType: BlockType; order: number; data: BlockData }[];
};

export const TEMPLATE_SEEDS: Record<string, TemplateSeed | undefined> = {
${body}
};
`,
);

const bytes = readFileSync("src/page/template-seeds.ts").length;
console.log(`${Object.keys(seeds).length} families seeded`);
console.log(`  portraits seeded: ${withPortrait} (by design — see the note above portrait)`);
console.log(`  ${(bytes / 1024).toFixed(0)} KB`);
