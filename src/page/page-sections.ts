/**
 * The universal block kit — COPIED from the web repo, kept in step with it.
 *
 * Source: `src/lib/page-sections.ts` in gregadosmond-oss/profile-pride-app,
 * copied 2026-10-24 (commit ae7dfbe). Only dependency is zod, which is why the
 * app pins zod 3 to match the web: this file must copy across unchanged.
 *
 * It is the contract for a page's body — the nine block types, their field
 * limits, what counts as empty, and (since 2026-10-23) the stable ids on
 * timeline and cards rows that the web's Proof feature attaches to. The app
 * validates against exactly these rules so a page edited on a phone and a
 * page edited in a browser cannot drift. Do not hand-edit; re-copy from the
 * web repo instead. The builder-only list lives in sections-for-editing.ts.
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

// ─── Stable entry ids (Proof, 2026-10-23) ───────────────────────────────────
// A timeline or cards ITEM can carry an id, so proof can be attached to one
// entry (proof.ts: attach { type: "entry", sectionId, itemId }). Optional and
// additive: rows saved before this have none, and render exactly as before.
//
// A missing id is filled DETERMINISTICALLY, from the section id and the item's
// index, everywhere the server reads or writes sections (clampSections, and
// ensureEntryIds for the builder's load). So the same stored page resolves to
// the same ids on every read: SSR and the client never disagree, and the
// public page, the builder and the save-time proof check all agree. Random ids
// (freshEntryId) are only for the builder creating a NEW row. An id the item
// already has is always kept; a generated one never takes an id a later item
// in the same section already holds.
//
// Ids are identity, not content: blockIsEmpty ignores them, the size backstop
// does not count them, and Paige's section fingerprint strips them.
export const ENTRY_ID_BLOCKS = ["timeline", "cards"] as const;
const ENTRY_ID = /^[A-Za-z0-9_-]{1,60}$/;

/** The id an item may keep: 1-60 of [A-Za-z0-9_-], else undefined. */
export function validEntryId(v: unknown): string | undefined {
  return typeof v === "string" && ENTRY_ID.test(v) ? v : undefined;
}

const entryId = z.preprocess((v) => validEntryId(v), z.string().optional());

/** For the builder when it creates a new row (PR 2). Never used by the server. */
export function freshEntryId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `e-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  }
}

// FNV-1a, 32-bit: tiny, synchronous and stable across runtimes. Not security —
// only a short, deterministic spelling of "section X, item n".
function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/** The deterministic id for item `index` of section `sectionId`. `attempt` > 0
 *  only on a collision. */
export function derivedEntryId(sectionId: string, index: number, attempt = 0): string {
  return `e${fnv1a(attempt ? `${sectionId}#${index}#${attempt}` : `${sectionId}#${index}`)}`;
}

/**
 * Give every item an id. Items that already hold a valid id keep it (the
 * first holder, when two share one); the rest get derivedEntryId, skipping any
 * id already taken in this section. Idempotent: a second pass changes nothing.
 * Returns the same array when nothing needed filling.
 */
export function fillEntryIds<T extends object>(sectionId: string, items: readonly T[]): T[] {
  const kept = new Set<string>();
  const keep: Array<string | undefined> = items.map((it) => {
    const id = validEntryId((it as { id?: unknown }).id);
    if (!id || kept.has(id)) return undefined;
    kept.add(id);
    return id;
  });
  if (keep.every((id) => id !== undefined)) return items as T[];
  return items.map((it, i) => {
    if (keep[i] !== undefined) return it;
    let attempt = 0;
    let id = derivedEntryId(sectionId, i, attempt);
    while (kept.has(id)) id = derivedEntryId(sectionId, i, ++attempt);
    kept.add(id);
    return { ...it, id };
  });
}

/**
 * Item ids carried from `prev` onto `next`, for an edit that rewrote a
 * section's items wholesale (an AI rewrite returns items with no ids). An
 * item in `next` keeps a valid id it already has when `prev` holds it and no
 * earlier item claimed it; otherwise it takes the id of the first unclaimed
 * `prev` item with the same title (and org, for timeline). Items that match
 * nothing get no id here; fillEntryIds gives them one on save.
 */
export function carryEntryIds<T extends object>(prev: readonly object[], next: readonly T[]): T[] {
  const key = (it: object) => {
    const r = it as { title?: unknown; org?: unknown };
    const t = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");
    return `${t(r.title)}\u0000${t(r.org)}`;
  };
  const prevIds = prev.map((it) => validEntryId((it as { id?: unknown }).id));
  const claimed = new Set<string>();
  // First the ids next already holds that prev knows, so a later match by
  // title cannot take an id an item is explicitly carrying.
  const own = next.map((it) => {
    const id = validEntryId((it as { id?: unknown }).id);
    if (!id || claimed.has(id) || !prevIds.includes(id)) return undefined;
    claimed.add(id);
    return id;
  });
  return next.map((it, i) => {
    if (own[i]) return it;
    const k = key(it);
    const j = prev.findIndex((p, pi) => {
      const pid = prevIds[pi];
      return pid !== undefined && !claimed.has(pid) && key(p) === k;
    });
    const { id: _drop, ...rest } = it as T & { id?: unknown };
    void _drop;
    if (j < 0) return rest as T;
    claimed.add(prevIds[j]!);
    return { ...rest, id: prevIds[j] } as T;
  });
}

/**
 * The builder's rule for an AI edit that rewrote a section's rows (a draft, a
 * rewrite from the material, Finishing touches): carry the rows' ids across
 * from what the section held (carryEntryIds), then give any row still without
 * one a fresh id, so every row the builder holds can have proof attached.
 * Blocks other than timeline / cards pass through untouched.
 */
export function withCarriedEntryIds<D>(blockType: string, prevData: unknown, nextData: D): D {
  if (!(ENTRY_ID_BLOCKS as readonly string[]).includes(blockType)) return nextData;
  const nextItems = (nextData as { items?: unknown } | null)?.items;
  if (!Array.isArray(nextItems) || !nextItems.every((it) => it && typeof it === "object")) {
    return nextData;
  }
  const prevItems = (prevData as { items?: unknown } | null)?.items;
  const prev = Array.isArray(prevItems)
    ? prevItems.filter((it): it is object => !!it && typeof it === "object")
    : [];
  const items = carryEntryIds(prev, nextItems as object[]).map((it) =>
    validEntryId((it as { id?: unknown }).id) ? it : { ...it, id: freshEntryId() },
  );
  return { ...(nextData as object), items } as D;
}

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
        id: entryId,
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
    items: arr(z.object({ id: entryId, title: str(80), body: str(320), icon: str(24) }), 20),
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
      data: withEntryIds(env.data.blockType, id, dataParsed.data as BlockData),
      order: out.length,
      visible: env.data.visible,
      ...(env.data.hint ? { hint: env.data.hint } : {}),
    });
  }

  if (dropped > 0) console.error(`clampSections: dropped ${dropped} invalid section(s)`);

  // Size backstop: trim from the end until under the serialized cap. Entry
  // ids do not count toward it: they were added after the cap was set, and a
  // page that fit before must never lose a section because its rows gained
  // ids (worst case ~14 KB: 16 sections of 20 rows, each a 36-character
  // builder id; derived ids are 7-8 characters).
  while (out.length > 0 && JSON.stringify(out).length - entryIdBytes(out) > MAX_SERIALIZED_BYTES) {
    out.pop();
    console.error("clampSections: trimmed a section to stay under the size cap");
  }
  return out;
}

function isEntryIdBlock(blockType: unknown): boolean {
  return (ENTRY_ID_BLOCKS as readonly unknown[]).includes(blockType);
}

function withEntryIds(blockType: BlockType, sectionId: string, data: BlockData): BlockData {
  if (!isEntryIdBlock(blockType)) return data;
  const items = (data as { items?: object[] }).items;
  if (!Array.isArray(items)) return data;
  const filled = fillEntryIds(sectionId, items);
  return filled === items ? data : ({ ...data, items: filled } as BlockData);
}

// What the items' ids add to JSON.stringify(sections): `"id":"<id>",` each.
function entryIdBytes(sections: PageSection[]): number {
  let n = 0;
  for (const s of sections) {
    if (!isEntryIdBlock(s.blockType)) continue;
    for (const it of (s.data as { items?: Array<{ id?: unknown }> }).items ?? []) {
      if (typeof it.id === "string") n += it.id.length + 8;
    }
  }
  return n;
}

/**
 * The builder's load path (getMyPitchPage): the stored sections exactly as
 * they are, plus an id on every timeline and cards item that lacks one —
 * the SAME id clampSections would give it, so what the builder holds, what a
 * save stores and what the public page resolves all agree. Touches nothing
 * else: no section is dropped, clamped or reordered here.
 */
export function ensureEntryIds(sections: unknown): unknown {
  if (!Array.isArray(sections)) return sections;
  const seen = new Set<string>();
  let changed = false;
  const out = sections.map((raw) => {
    if (!raw || typeof raw !== "object") return raw;
    const sec = raw as { id?: unknown; blockType?: unknown; data?: unknown };
    if (!(BLOCK_TYPES as readonly unknown[]).includes(sec.blockType)) return raw;
    const id = typeof sec.id === "string" && sec.id.length > 0 && sec.id.length <= 60 ? sec.id : "";
    // clampSections gives a missing or repeated section id a fresh random one,
    // so there is nothing stable to derive from: those rows get their ids at
    // the next save instead.
    if (!id || seen.has(id)) return raw;
    seen.add(id);
    if (!isEntryIdBlock(sec.blockType) || !sec.data || typeof sec.data !== "object") return raw;
    const items = (sec.data as { items?: unknown }).items;
    if (!Array.isArray(items) || !items.every((it) => it && typeof it === "object")) return raw;
    const filled = fillEntryIds(id, items as object[]);
    if (filled === items) return raw;
    changed = true;
    return { ...sec, data: { ...(sec.data as object), items: filled } };
  });
  return changed ? out : sections;
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
      // An entry id is identity, not content: a row holding only an id is
      // still an empty row.
      return !items.some((it) =>
        Object.entries(it).some(
          ([k, v]) => k !== "id" && (Array.isArray(v) ? v.some(Boolean) : !!String(v ?? "").trim()),
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
 * Where Projects & Proof goes: the id of the section it FOLLOWS, or null when
 * there are no sections. Spec 2026-10-23-proof-media, "The Projects & Proof
 * section": right after Experience; with no Experience, after the first
 * timeline section; with no timeline, after About, else after the first
 * section. Pass the sections in display order: the builder's own list for its
 * fixed row, sectionsForLayout() for the public page.
 */
export function proofSectionAnchor(
  sections: readonly Pick<PageSection, "id" | "title" | "blockType">[],
): string | null {
  const titled = (re: RegExp) => (s: { title: string }) => re.test(s.title ?? "");
  const pick =
    sections.find((s) => s.blockType === "timeline" && titled(/experience/i)(s)) ??
    sections.find((s) => s.blockType === "timeline") ??
    sections.find(titled(/\babout\b/i)) ??
    sections[0];
  return pick?.id ?? null;
}

/** Where a layout draws the public Projects & Proof section. */
export type ProjectsProofPlacement =
  | { kind: "after-section"; sectionId: string }
  | { kind: "after-hero" };

/**
 * Where the public Projects & Proof section goes (spec 2026-10-23-proof-media,
 * "The public page (PR 3)"), for the layouts that place proof themselves.
 * Pass the sections the page renders (sectionsForLayout) and
 * proofPlacement(kind):
 *   - "top" pages (athlete, real-estate, listing) get it directly under the
 *     hero gallery (decided 2026-10-24);
 *   - every other page gets it after proofSectionAnchor's pick among the BODY
 *     sections (the closing CTA band is never an anchor);
 *   - a page with no body sections at all gets it under the hero, so it is
 *     never at the very bottom.
 * `placement` is passed in rather than computed from the kind so this file
 * does not import the proof helpers.
 */
export function projectsProofPlacement(
  sections: readonly Pick<PageSection, "id" | "title" | "blockType">[],
  placement: "top" | "middle",
): ProjectsProofPlacement {
  if (placement === "top") return { kind: "after-hero" };
  const id = proofSectionAnchor(sections.filter((s) => s.blockType !== "cta"));
  return id ? { kind: "after-section", sectionId: id } : { kind: "after-hero" };
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
