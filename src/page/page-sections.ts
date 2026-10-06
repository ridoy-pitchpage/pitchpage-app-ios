/**
 * The universal block kit — COPIED from the web repo, kept in step with it.
 *
 * Source: `src/lib/page-sections.ts` in gregadosmond-oss/profile-pride-app,
 * copied 2026-09-30. Only dependency is zod, which is why the app pins zod 3
 * to match the web: this file must copy across unchanged.
 *
 * It is the contract for a page's body — the nine block types, their field
 * limits, and what counts as empty. The app validates against exactly these
 * rules so a page edited on a phone and a page edited in a browser cannot
 * drift. Do not hand-edit; re-copy from the web repo instead.
 */

import { z } from "zod";

// ─── Custom-section engine: the universal block kit (rebuild Step 1) ────────
//
// A pitch page's BODY is an ordered list of PageSections. Each section is an
// AI-named container ("Patient Outcomes", "Projects Delivered") rendering one
// of NINE universal block types. Identity/chrome (name, headline, portrait,
// video, contact) stays on the existing pitch_pages columns — templates anchor
// on chrome and lay the sections out in their own visual vocabulary (Step 2).
//
// Validation rules (input-validation standard):
// - Every string bounded, every array capped. The kit's ONLY URL field is
//   cta.url (safeUrl lives in pitch.functions.ts; here we bound + sanitize the
//   scheme the same way to avoid a circular import — see ctaUrl below).
// - NO zod discriminated union for `data` (the generic clampToSchema can't
//   descend unions): the envelope is validated by SectionEnvelopeSchema and
//   `data` against BLOCK_DATA_SCHEMAS[blockType].
// - clampSections is DEFENSIVE and never throws: it drops what it can't
//   salvage (logged), clamps the rest, dedups ids, reindexes order.

export const BLOCK_TYPES = [
  "metric_grid",
  "text_block",
  "timeline",
  "cards",
  "quote_list",
  "logo_row",
  "tag_list",
  "chart",
  "cta",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

// Same scheme guard as pitch.functions.ts' safeUrl, kept dependency-free:
// normalizes bare domains and rejects script-executing schemes.
const ctaUrl = z.preprocess((v) => {
  if (typeof v !== "string") return "";
  const s = v.trim().slice(0, 500);
  if (!s) return "";
  if (/^(javascript|data|file|vbscript|blob):/i.test(s)) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w.-]+\.[a-z]{2,}([/?#].*)?$/i.test(s)) return `https://${s}`;
  return "";
}, z.string().max(500).default(""));

// Clamp-then-validate: slice to the cap BEFORE .max() so over-long AI values
// are trimmed, never thrown (input-validation standard's clamp-before-parse).
const str = (max: number) =>
  z.preprocess((v) => (v == null ? "" : String(v).slice(0, max)), z.string().max(max).default(""));

// Same clamp-before-parse rule for ARRAYS: slice to the cap in a preprocess so
// an over-cap list is TRIMMED instead of failing .max() — a failed data parse
// makes clampSections drop the whole section (silent data loss on save).
// Non-array values (null, undefined, a scalar, an object) coerce to [] the same
// way str() coerces null to "" — otherwise a single null array field would fail
// validation and clampSections would drop the WHOLE section.
const arr = <T extends z.ZodTypeAny>(schema: T, max: number) =>
  z.preprocess(
    (v) => (Array.isArray(v) ? v.slice(0, max) : []),
    z.array(schema).max(max).default([]),
  ) as unknown as z.ZodType<z.infer<T>[], z.ZodTypeDef, unknown>;

export const BLOCK_DATA_SCHEMAS = {
  metric_grid: z.object({
    items: arr(z.object({ value: str(24), label: str(60), sub: str(80) }), 8),
  }),
  text_block: z.object({
    heading: str(120),
    paragraphs: arr(str(800), 4),
    // Optional bullet rendition of the same content (per-section, text_block
    // only). Additive: absent on every existing row, so `format` defaults to
    // "paragraph" and paragraphs stays the source of truth with zero data loss.
    bullets: arr(str(240), 8),
    format: z.preprocess(
      (v) => (v === "bullets" ? "bullets" : "paragraph"),
      z.enum(["paragraph", "bullets"]).default("paragraph"),
    ),
  }),
  timeline: z.object({
    // Optional per-section location (e.g. "Toronto, Canada"). SkylineLayout
    // uses it for the paired city-skyline card's "Based in …" caption; other
    // layouts ignore it. Backward-compatible: absent = "".
    location: str(120),
    items: arr(
      z.object({
        period: str(60),
        title: str(120),
        org: str(160),
        bullets: arr(str(300), 6),
      }),
      8,
    ),
  }),
  cards: z.object({
    // 20, not 4. Four was the tightest cap in the kit and the only one people
    // actually hit: a resume with five relevant roles lost the fifth SILENTLY,
    // because arr() slices to the cap rather than complaining, so the save
    // succeeded and the page did not change. Every template renders cards with
    // a plain map into a flowing grid (1fr 1fr, repeat(3,1fr), or auto-fit), so
    // extra cards simply wrap onto more rows — none of them slices to 4.
    //
    // It is not unlimited, and cannot be: clampSections drops WHOLE SECTIONS
    // from the end once the serialized page passes MAX_SERIALIZED_BYTES, which
    // is a far worse failure than a trimmed list. A full card is ~470 bytes, so
    // 20 is ~9 KB per section — several full card sections still sit well
    // inside the 64 KB budget. In practice 20 is unreachable: the sections
    // people fill hold three to eight.
    items: arr(z.object({ title: str(80), body: str(320), icon: str(24) }), 20),
  }),
  quote_list: z.object({
    items: arr(z.object({ quote: str(400), name: str(80), role: str(120) }), 6),
  }),
  logo_row: z.object({
    heading: str(80),
    names: arr(str(60), 12),
  }),
  tag_list: z.object({
    heading: str(80),
    // 80 chars (was 50): fits full certification / product names without
    // truncation; compose still favors short 1-4 word tags.
    tags: arr(str(80), 16),
  }),
  chart: z.object({
    variant: z.preprocess(
      (v) => (v === "line" || v === "donut" || v === "bars" ? v : "bars"),
      z.enum(["line", "donut", "bars"]).default("bars"),
    ),
    series: arr(z.object({ label: str(60), value: z.coerce.number().default(0) }), 12),
    caption: str(120),
  }),
  cta: z.object({
    heading: str(120),
    sub: str(200),
    label: str(60),
    url: ctaUrl,
    email: str(200),
  }),
} satisfies Record<BlockType, z.ZodTypeAny>;

export type BlockData = {
  [K in BlockType]: z.infer<(typeof BLOCK_DATA_SCHEMAS)[K]>;
}[BlockType];

export type PageSection = {
  id: string;
  title: string;
  blockType: BlockType;
  data: BlockData;
  order: number;
  visible: boolean;
  hint?: string;
};

const SectionEnvelopeSchema = z.object({
  id: z.string().max(60).default(""),
  title: str(80),
  blockType: z.enum(BLOCK_TYPES),
  order: z.coerce.number().int().min(0).max(99).default(0),
  visible: z.preprocess((v) => v !== false, z.boolean().default(true)),
  hint: str(200),
});

export const MAX_SECTIONS = 16;
const MAX_SERIALIZED_BYTES = 64 * 1024;

function freshId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `sec-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  }
}

/**
 * Defensive clamp + parse for an unknown sections payload (AI output or
 * client input). NEVER throws: invalid items are dropped (count logged),
 * ids deduped/regenerated, order reindexed 0..n-1, list capped. The result
 * always satisfies PageSection[].
 */
export function clampSections(input: unknown): PageSection[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: PageSection[] = [];
  let dropped = 0;

  for (const raw of input.slice(0, MAX_SECTIONS)) {
    if (!raw || typeof raw !== "object") {
      dropped++;
      continue;
    }
    const env = SectionEnvelopeSchema.safeParse(raw);
    if (!env.success) {
      dropped++;
      continue;
    }
    const dataSchema = BLOCK_DATA_SCHEMAS[env.data.blockType];
    const dataParsed = dataSchema.safeParse((raw as { data?: unknown }).data ?? {});
    if (!dataParsed.success) {
      dropped++;
      continue;
    }
    let id = env.data.id;
    if (!id || seen.has(id)) id = freshId();
    seen.add(id);
    out.push({
      id,
      title: env.data.title,
      blockType: env.data.blockType,
      data: dataParsed.data as BlockData,
      order: out.length,
      visible: env.data.visible,
      ...(env.data.hint ? { hint: env.data.hint } : {}),
    });
  }

  if (dropped > 0) console.error(`clampSections: dropped ${dropped} invalid section(s)`);

  // Size backstop: trim from the end until under the serialized cap.
  while (out.length > 0 && JSON.stringify(out).length > MAX_SERIALIZED_BYTES) {
    out.pop();
    console.error("clampSections: trimmed a section to stay under the size cap");
  }
  return out;
}

/** Zod wrapper for save paths: preprocess through the defensive clamp. */
export const SectionsSchema = z.preprocess(
  (v) => clampSections(v),
  z.array(z.any()).max(MAX_SECTIONS),
) as unknown as z.ZodType<PageSection[]>;

/**
 * The self-hide predicate: true when a block has no renderable content.
 * Renderers (and the Step-3 wizard's completion state) share this.
 */
export function blockIsEmpty(blockType: BlockType, data: BlockData): boolean {
  const d = data as Record<string, unknown>;
  switch (blockType) {
    case "metric_grid":
    case "timeline":
    case "cards":
    case "quote_list": {
      const items = (d.items as Array<Record<string, string>>) ?? [];
      return !items.some((it) =>
        Object.values(it).some((v) =>
          Array.isArray(v) ? v.some(Boolean) : !!String(v ?? "").trim(),
        ),
      );
    }
    case "text_block":
      // A heading with nothing under it is NOT content: a pre-seeded section
      // the user never filled in used to publish as a bare heading (e.g.
      // "Schooling & Certifications" followed by nothing). Only paragraphs or
      // bullets count.
      return (
        !((d.paragraphs as string[]) ?? []).some((p) => p.trim()) &&
        !((d.bullets as string[]) ?? []).some((b) => b.trim())
      );
    case "logo_row":
      return !((d.names as string[]) ?? []).some((n) => n.trim());
    case "tag_list":
      return !((d.tags as string[]) ?? []).some((t) => t.trim());
    case "chart":
      return !((d.series as Array<{ label: string; value: number }>) ?? []).some(
        (p) => p.label.trim() || p.value !== 0,
      );
    case "cta":
      // A CTA nobody can act on is NOT content. Every intake seeds `heading`
      // (and often `label`) but leaves `url`/`email` blank, which used to
      // publish as a "Reach out below" heading with no button and no address.
      // Either a url OR an email alone is actionable and still renders.
      return !String(d.url ?? "").trim() && !String(d.email ?? "").trim();
  }
}

/**
 * The Step-2 layout contract in one place: the sections a template should
 * render — visible, non-empty, in order. A layout renders the sections body
 * when this is non-empty, else its legacy-columns body.
 */
export function sectionsForLayout(data: { sections?: PageSection[] | null }): PageSection[] {
  return (data.sections ?? [])
    .filter((s) => s.visible && !blockIsEmpty(s.blockType, s.data) && !isQuoteListWithoutQuotes(s))
    .sort((a, b) => a.order - b.order);
}

/**
 * The same list, for the BUILDER rather than a page.
 *
 * sectionsForLayout drops empty sections because a published page must not
 * show a heading over nothing. Applied while editing, that hid the entire
 * outline a template seeds: About Me, Experience, Skills, By the Numbers and
 * What People Say all start empty, so the only thing left on screen was
 * Contact, which is the one seed carrying copy. Every template opened as the
 * same near-blank page, and the sections that were supposed to be filled in
 * could not be reached to fill in.
 *
 * So the builder keeps them. Emptiness is still what decides whether a
 * section is published; it is not what decides whether its owner can see it.
 */
export function sectionsForEditing(data: { sections?: PageSection[] | null }): PageSection[] {
  return (data.sections ?? []).filter((s) => s.visible).sort((a, b) => a.order - b.order);
}

/**
 * A quote section none of whose items has a quote. Every layout renders a
 * quote item only when it HAS a quote — measured across all 40, a name-only
 * reference is never shown — so such a section rendered as its heading over
 * nothing on 38 of them. It is still real data (a reference the source named
 * without quoting), which is why blockIsEmpty keeps counting it as content:
 * the composers decide what to keep with blockIsEmpty, and the names must be
 * kept. This is the RENDER decision only.
 *
 * Section-reading analytics are unaffected: they take the page's section
 * list from clampSections, not from here, so a section hidden this way is
 * still a current section there (reached by nobody) — never a removed one.
 */
function isQuoteListWithoutQuotes(s: PageSection): boolean {
  if (s.blockType !== "quote_list") return false;
  const items = (s.data as { items?: Array<{ quote?: string }> }).items ?? [];
  return !items.some((it) => String(it.quote ?? "").trim());
}

// ─── BLOCK_SPEC: the generic interview registry ─────────────────────────────
// The kit's equivalent of the old fixed SECTION_SPEC: what each block is for,
// the JSON shape the AI must return, and whether composition may PRE-FILL it
// from the source text (never-invent policy: numeric blocks only verbatim
// numbers; cta only an email actually present).
export const BLOCK_SPEC: Record<
  BlockType,
  {
    about: string;
    whenToUse: string;
    schemaHint: string;
    prefill: "facts" | "verbatim-numbers" | "verbatim-quotes" | "email-only";
  }
> = {
  metric_grid: {
    about: "A grid of 3-8 headline numbers (value + label + optional context line).",
    whenToUse: "The person's biggest quantified wins. ONLY if the source contains real numbers.",
    schemaHint: `{ "items": [ { "value": "98.4%", "label": "First-visit fix rate", "sub": "2,400+ calls" } ] }`,
    prefill: "verbatim-numbers",
  },
  text_block: {
    about: "A heading plus 1-4 short paragraphs of prose.",
    whenToUse: "Narrative content: about, philosophy, approach, a story.",
    schemaHint: `{ "heading": "How I work", "paragraphs": ["..."] }`,
    prefill: "facts",
  },
  timeline: {
    about: "Dated rows: period, title, organization, up to 6 bullets each.",
    whenToUse: "Career history, project history, education path.",
    schemaHint: `{ "items": [ { "period": "2022 — Present", "title": "Charge Nurse", "org": "St. Mary's ICU", "bullets": ["..."] } ] }`,
    prefill: "facts",
  },
  cards: {
    about:
      "A grid of cards, each a short title with a 1-2 sentence body and an optional icon word. Write one per distinct thing the source actually supports — usually three to eight, and never padded out to fill space.",
    whenToUse: "Differentiators, services, specialties, value propositions.",
    schemaHint: `{ "items": [ { "title": "Calm under pressure", "body": "...", "icon": "shield" } ] }`,
    prefill: "facts",
  },
  quote_list: {
    about:
      "People who vouch for the person: each item is the speaker's name, their role or company, and a quote. A reference with no quote is still a valid item — its quote stays empty.",
    whenToUse:
      "References, testimonials, recommendations, patient/client feedback — with a quote ONLY where the source contains one word for word.",
    schemaHint: `{ "items": [ { "quote": "...exact words from the source, or empty...", "name": "Jane Doe", "role": "Nurse Manager, St. Mary's" } ] }`,
    // Transcribe-only, and for WORDS rather than numbers: see
    // quote-provenance.ts, which enforces this on every model output.
    prefill: "verbatim-quotes",
  },
  logo_row: {
    about: "A row of organization names rendered as wordmarks, with an optional heading.",
    whenToUse: "Employers, clients, care settings, sites served.",
    schemaHint: `{ "heading": "Care settings", "names": ["St. Mary's", "Cedar Clinic"] }`,
    prefill: "facts",
  },
  tag_list: {
    about: "Short chips with an optional heading.",
    whenToUse: "Skills, tools, certifications, languages, specialties.",
    schemaHint: `{ "heading": "Certifications", "tags": ["BLS", "ACLS"] }`,
    prefill: "facts",
  },
  chart: {
    about: "One simple chart: line, donut, or bars over a labelled numeric series.",
    whenToUse: "A trend or distribution. ONLY if the source contains the actual numbers.",
    schemaHint: `{ "variant": "bars", "series": [ { "label": "2023", "value": 94 } ], "caption": "Fix rate by year" }`,
    prefill: "verbatim-numbers",
  },
  cta: {
    about: "The closing call to action: heading, sub-line, button label + URL, contact email.",
    whenToUse: "Always last — how to reach the person.",
    schemaHint: `{ "heading": "Let's talk", "sub": "...", "label": "Book a call", "url": "https://...", "email": "x@y.com" }`,
    prefill: "email-only",
  },
};
