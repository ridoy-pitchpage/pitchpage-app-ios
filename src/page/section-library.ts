import type { BlockData, BlockType, PageSection } from "./page-sections";

/**
 * What someone picks from when adding a section.
 *
 * The nine block types are DATA SHAPES — "metric_grid", "quote_list",
 * "logo_row". Nobody building a page thinks in those terms; they think "I want
 * to show my certifications". So a preset maps a purpose onto a shape, and the
 * picker offers the purpose.
 *
 * Every preset ships EMPTY, with a couple of blank rows and never example copy.
 * A preset that arrived pre-filled with "Service one — describe what you offer"
 * would publish that sentence verbatim for anyone who added it and never came
 * back, and a published page is the thing being sent to an employer. Blank rows
 * give the editor something to render; an unfinished section costs nothing
 * because an empty one never appears on the page.
 *
 * Copied from `src/lib/section-library.ts` in the web repo.
 */

export type PresetGroup = "Story" | "Proof" | "Skills" | "Background";

export const PRESET_GROUPS: readonly PresetGroup[] = ["Story", "Proof", "Skills", "Background"];

export type SectionPreset = {
  /** Stable key — never shown. */
  id: string;
  /** The section title the user gets, and what the picker calls it. */
  title: string;
  /** One line under the title: what this is for. */
  about: string;
  blockType: BlockType;
  group: PresetGroup;
  /** Seeded into the section's hint — what a follow-up question should ask. */
  hint: string;
  data: BlockData;
};

const rows = <T,>(row: T, n: number): T[] => Array.from({ length: n }, () => ({ ...row }));
const card = { title: "", body: "", icon: "" };
const metric = { value: "", label: "", sub: "" };
const period = { period: "", title: "", org: "", bullets: [] as string[] };
const quote = { quote: "", name: "", role: "" };

export const SECTION_PRESETS: readonly SectionPreset[] = [
  // ── Story ────────────────────────────────────────────────────────────────
  { id: "about", title: "About me", about: "A short introduction in your own words.", blockType: "text_block", group: "Story", hint: "Who you are, what you do, and what you are looking for.", data: { heading: "", paragraphs: ["", ""], bullets: [], format: "paragraph" } },
  { id: "approach", title: "How I work", about: "Two or three things that describe the way you work.", blockType: "cards", group: "Story", hint: "What someone gets when they work with you that they would not get elsewhere.", data: { items: rows(card, 3) } },
  { id: "services", title: "What I offer", about: "The services or work you take on.", blockType: "cards", group: "Story", hint: "The services you offer, and who each one is for.", data: { items: rows(card, 3) } },
  { id: "availability", title: "Availability", about: "When you can start, and how you prefer to work.", blockType: "text_block", group: "Story", hint: "Start date, notice period, location, remote or on-site, hours.", data: { heading: "", paragraphs: [""], bullets: [], format: "paragraph" } },

  // ── Proof ────────────────────────────────────────────────────────────────
  { id: "numbers", title: "By the numbers", about: "Your results as figures.", blockType: "metric_grid", group: "Proof", hint: "Real figures from your own record — only numbers you can stand behind.", data: { items: rows(metric, 4) } },
  { id: "projects", title: "Selected work", about: "Projects or pieces of work worth showing.", blockType: "cards", group: "Proof", hint: "What the project was, what you did on it, and how it turned out.", data: { items: rows(card, 3) } },
  { id: "testimonials", title: "What people say", about: "Quotes from people you have worked with.", blockType: "quote_list", group: "Proof", hint: "Who said it, their role, and their exact words — copied from a review, letter or email.", data: { items: rows(quote, 2) } },
  { id: "clients", title: "Clients and employers", about: "The organisations you have worked with.", blockType: "logo_row", group: "Proof", hint: "Organisations you have genuinely worked with or for.", data: { heading: "", names: ["", "", ""] } },
  { id: "awards", title: "Awards and recognition", about: "Awards, honours or standout mentions.", blockType: "cards", group: "Proof", hint: "What the award was, who gave it, and when.", data: { items: rows(card, 2) } },
  { id: "trend", title: "Results over time", about: "A simple chart of a figure that moved.", blockType: "chart", group: "Proof", hint: "A figure you can show year by year or month by month, with real values.", data: { variant: "bars", series: [], caption: "" } },

  // ── Skills ───────────────────────────────────────────────────────────────
  { id: "skills", title: "Skills", about: "What you are good at, as short labels.", blockType: "tag_list", group: "Skills", hint: "The skills a hiring manager in your field would scan for.", data: { heading: "", tags: ["", "", ""] } },
  { id: "tools", title: "Tools and software", about: "The systems and tools you use.", blockType: "tag_list", group: "Skills", hint: "Software, systems, machinery or platforms you actually use.", data: { heading: "", tags: ["", "", ""] } },
  { id: "certifications", title: "Certifications and licences", about: "Qualifications you hold.", blockType: "tag_list", group: "Skills", hint: "Certifications and licences you currently hold.", data: { heading: "", tags: ["", ""] } },
  { id: "languages", title: "Languages", about: "Languages you speak, and how well.", blockType: "tag_list", group: "Skills", hint: "Each language and your level in it.", data: { heading: "", tags: ["", ""] } },

  // ── Background ───────────────────────────────────────────────────────────
  { id: "experience", title: "Experience", about: "Where you have worked, most recent first.", blockType: "timeline", group: "Background", hint: "Dates, job title, employer, and what you were responsible for.", data: { location: "", items: rows(period, 3) } },
  { id: "education", title: "Education", about: "Your schooling and training.", blockType: "timeline", group: "Background", hint: "Dates, qualification, institution, and anything notable.", data: { location: "", items: rows(period, 2) } },
  { id: "volunteering", title: "Volunteering", about: "Unpaid work and community roles.", blockType: "timeline", group: "Background", hint: "Dates, the role, the organisation, and what you did.", data: { location: "", items: rows(period, 2) } },
  { id: "speaking", title: "Talks and publications", about: "Things you have written or presented.", blockType: "cards", group: "Background", hint: "The title, where it appeared, and when.", data: { items: rows(card, 2) } },
];

function freshId(): string {
  const cryptoRef = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (typeof cryptoRef?.randomUUID === "function") return cryptoRef.randomUUID();
  return `sec-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/** A new section from a preset. The data is cloned so presets stay pristine. */
export function sectionFromPreset(preset: SectionPreset, order: number): PageSection {
  return {
    id: freshId(),
    title: preset.title,
    blockType: preset.blockType,
    data: JSON.parse(JSON.stringify(preset.data)) as BlockData,
    order,
    visible: true,
    hint: preset.hint,
  };
}
