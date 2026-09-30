import type { Archetype } from "@/render/template-theme";

/**
 * The thirty styles a page can wear, and the twenty colours each can take.
 *
 * Copied from `src/lib/style-families.ts` in the web repo and verified against
 * it: the ids, labels, categories, default colours and default modes are all
 * exact, because the stored `template` string is `family__colour[__mode]` and a
 * value the website does not recognise renders through a neutral fallback
 * instead of a designed layout.
 *
 * Nine further families are retired. They still render for pages that already
 * use them, but nobody can pick one, so they are not listed here; a page on a
 * retired family keeps its stored key untouched and simply shows as "Custom".
 *
 * Every active family accepts all twenty colours — checked against the source,
 * not assumed — so the picker never has to hide one.
 */

export type StyleCategory = "business" | "job" | "sales" | "real-estate" | "athlete" | "academic";

export const STYLE_CATEGORY_LABELS: Record<StyleCategory, string> = {
  business: "Business & personal brand",
  job: "Job application",
  sales: "Sales & revenue",
  "real-estate": "Real estate",
  athlete: "Athlete",
  academic: "University & academic",
};

export const STYLE_CATEGORY_ORDER: readonly StyleCategory[] = [
  "business",
  "job",
  "sales",
  "real-estate",
  "athlete",
  "academic",
];

export type StyleFamily = {
  id: string;
  label: string;
  category: StyleCategory;
  /** The colour a page gets when this family is picked. */
  defaultColor: string;
  /** What the page renders as when no mode is chosen. */
  defaultMode: "light" | "dark";
  /** False means the family has one mode only and the toggle is hidden. */
  supportsMode: boolean;
  /**
   * How the app draws it. The website has a bespoke layout per family; the app
   * groups them into five treatments — see `src/render/template-theme.ts` for
   * why, and what each one means.
   */
  archetype: Archetype;
};

/**
 * In the order the picker shows them, which is the web's `FAMILY_DISPLAY_ORDER`
 * rather than the registry's declaration order.
 */
export const STYLE_FAMILIES: readonly StyleFamily[] = [
  { id: "spotlight", label: "Spotlight", category: "business", defaultColor: "amber", defaultMode: "dark", supportsMode: true, archetype: "soft" },
  { id: "arch", label: "Editorial Arch", category: "business", defaultColor: "bronze", defaultMode: "light", supportsMode: true, archetype: "editorial" },
  { id: "framed", label: "Poster", category: "business", defaultColor: "red", defaultMode: "light", supportsMode: true, archetype: "bold" },
  { id: "ring", label: "Accent Ring", category: "business", defaultColor: "teal", defaultMode: "light", supportsMode: true, archetype: "soft" },
  { id: "split", label: "Hard Split", category: "business", defaultColor: "blue", defaultMode: "light", supportsMode: true, archetype: "soft" },
  { id: "banner", label: "Cover Banner", category: "job", defaultColor: "blue", defaultMode: "dark", supportsMode: true, archetype: "soft" },
  { id: "tiles", label: "Offset Tiles", category: "business", defaultColor: "orange", defaultMode: "light", supportsMode: true, archetype: "bold" },
  { id: "momentum", label: "Momentum", category: "job", defaultColor: "violet", defaultMode: "dark", supportsMode: true, archetype: "soft" },
  { id: "letterhead", label: "Letterhead", category: "job", defaultColor: "teal", defaultMode: "light", supportsMode: true, archetype: "editorial" },
  { id: "exhibit", label: "Exhibit", category: "business", defaultColor: "bronze", defaultMode: "dark", supportsMode: true, archetype: "editorial" },
  { id: "feature", label: "Magazine", category: "business", defaultColor: "indigo", defaultMode: "light", supportsMode: true, archetype: "editorial" },
  { id: "corporate", label: "Corporate", category: "job", defaultColor: "blue", defaultMode: "light", supportsMode: true, archetype: "soft" },
  { id: "personal", label: "Personal Brand", category: "business", defaultColor: "orange", defaultMode: "light", supportsMode: true, archetype: "soft" },
  { id: "premium", label: "Premium", category: "business", defaultColor: "gold", defaultMode: "light", supportsMode: true, archetype: "editorial" },
  { id: "startup", label: "Pitch Deck", category: "business", defaultColor: "lime", defaultMode: "light", supportsMode: true, archetype: "soft" },
  { id: "interactive", label: "Interactive", category: "business", defaultColor: "cyan", defaultMode: "dark", supportsMode: true, archetype: "soft" },
  { id: "trades", label: "Trades", category: "business", defaultColor: "amber", defaultMode: "dark", supportsMode: true, archetype: "bold" },
  // The one family with a single mode: Skyline is dark only.
  { id: "skyline", label: "Skyline", category: "business", defaultColor: "yellow", defaultMode: "dark", supportsMode: false, archetype: "soft" },
  { id: "scorecard", label: "Scorecard", category: "sales", defaultColor: "emerald", defaultMode: "light", supportsMode: true, archetype: "soft" },
  { id: "recruit", label: "Recruit", category: "athlete", defaultColor: "amber", defaultMode: "dark", supportsMode: true, archetype: "bold" },
  { id: "scholar", label: "Scholar", category: "academic", defaultColor: "emerald", defaultMode: "light", supportsMode: true, archetype: "minimal" },
  { id: "campus", label: "Campus", category: "academic", defaultColor: "violet", defaultMode: "light", supportsMode: true, archetype: "soft" },
  { id: "arena", label: "Arena", category: "athlete", defaultColor: "magenta", defaultMode: "dark", supportsMode: true, archetype: "bold" },
  { id: "broadsheet", label: "Broadsheet", category: "academic", defaultColor: "red", defaultMode: "light", supportsMode: true, archetype: "editorial" },
  { id: "ledger", label: "Ledger", category: "job", defaultColor: "gold", defaultMode: "dark", supportsMode: true, archetype: "editorial" },
  { id: "console", label: "Console", category: "job", defaultColor: "cyan", defaultMode: "dark", supportsMode: true, archetype: "console" },
  { id: "listing", label: "Listing", category: "real-estate", defaultColor: "teal", defaultMode: "light", supportsMode: true, archetype: "soft" },
  { id: "sightline", label: "Sightline", category: "real-estate", defaultColor: "emerald", defaultMode: "light", supportsMode: true, archetype: "editorial" },
  { id: "estate", label: "Estate", category: "real-estate", defaultColor: "bronze", defaultMode: "light", supportsMode: true, archetype: "editorial" },
  { id: "parcel", label: "Parcel", category: "real-estate", defaultColor: "teal", defaultMode: "dark", supportsMode: true, archetype: "console" },
];

export const FAMILY_BY_ID: Record<string, StyleFamily> = Object.fromEntries(
  STYLE_FAMILIES.map((family) => [family.id, family]),
);

/** The style a new page starts on, matching the web's DEFAULT_TEMPLATE. */
export const DEFAULT_TEMPLATE = "corporate__blue__light";

// ─── colours ────────────────────────────────────────────────────────────────

export type ColorPreset = {
  id: string;
  label: string;
  hex: string;
  /**
   * Whether text sitting ON this colour should be near-black or near-white.
   * Taken from the web's own measured value rather than recomputed, so a button
   * label reads identically in both places.
   */
  ink: "light" | "dark";
};

/**
 * A colour preset carries exactly one colour. Grounds and body inks belong to
 * the style, not the colour — which is why the same accent looks so different
 * across families.
 */
export const COLOR_PRESETS: readonly ColorPreset[] = [
  { id: "magenta", label: "Magenta", hex: "#E84393", ink: "light" },
  { id: "blue", label: "Blue", hex: "#3B82F6", ink: "light" },
  { id: "cyan", label: "Cyan", hex: "#06B6D4", ink: "dark" },
  { id: "violet", label: "Violet", hex: "#8B5CF6", ink: "light" },
  { id: "white", label: "White", hex: "#FAFAFA", ink: "dark" },
  { id: "gold", label: "Gold", hex: "#C9A84C", ink: "dark" },
  { id: "emerald", label: "Emerald", hex: "#10B981", ink: "dark" },
  { id: "rose", label: "Rose", hex: "#E8A0A8", ink: "dark" },
  { id: "red", label: "Red", hex: "#DC2626", ink: "light" },
  { id: "orange", label: "Orange", hex: "#FF6B35", ink: "light" },
  { id: "lime", label: "Lime", hex: "#84CC16", ink: "dark" },
  { id: "amber", label: "Amber", hex: "#F59E0B", ink: "dark" },
  { id: "bronze", label: "Bronze", hex: "#B97E4A", ink: "light" },
  { id: "teal", label: "Teal", hex: "#14B8A6", ink: "dark" },
  { id: "cream", label: "Cream", hex: "#EDE6D8", ink: "dark" },
  { id: "silver", label: "Silver", hex: "#C0C0C0", ink: "dark" },
  { id: "yellow", label: "Yellow", hex: "#FACC15", ink: "dark" },
  { id: "pink", label: "Pink", hex: "#F472B6", ink: "dark" },
  { id: "indigo", label: "Indigo", hex: "#6366F1", ink: "light" },
  { id: "green", label: "Green", hex: "#22D17A", ink: "dark" },
];

export const COLOR_BY_ID: Record<string, ColorPreset> = Object.fromEntries(
  COLOR_PRESETS.map((color) => [color.id, color]),
);

// ─── the stored key ─────────────────────────────────────────────────────────

export type StyleSelection = {
  family: StyleFamily | null;
  color: ColorPreset | null;
  mode: "light" | "dark" | null;
  raw: string | null;
};

/**
 * Read a stored `template` value.
 *
 * Unknown ids resolve to null rather than a guess, which is what lets a page on
 * a retired family keep rendering without the picker claiming it is something
 * it is not.
 */
export function parseStyleSelection(key: string | null | undefined): StyleSelection {
  if (!key) return { family: null, color: null, mode: null, raw: null };
  const [familyId, colorId, modeId] = key.split("__");
  if (!familyId || !colorId) return { family: null, color: null, mode: null, raw: key };
  return {
    family: FAMILY_BY_ID[familyId] ?? null,
    color: COLOR_BY_ID[colorId] ?? null,
    mode: modeId === "light" || modeId === "dark" ? modeId : null,
    raw: key,
  };
}

/**
 * Build a stored value. The mode segment is only appended when one was chosen,
 * so a two-segment key stays byte-identical to what the website would write.
 */
export function encodeStyleSelection(
  familyId: string,
  colorId: string,
  mode?: "light" | "dark" | null,
): string {
  return mode ? `${familyId}__${colorId}__${mode}` : `${familyId}__${colorId}`;
}

/** What a page actually renders as, once defaults are folded in. */
export function resolveStyle(key: string | null | undefined): {
  family: StyleFamily;
  color: ColorPreset;
  mode: "light" | "dark";
} {
  const parsed = parseStyleSelection(key);
  const family = parsed.family ?? FAMILY_BY_ID.corporate!;
  const color = parsed.color ?? COLOR_BY_ID[family.defaultColor] ?? COLOR_PRESETS[1]!;
  const mode = family.supportsMode ? (parsed.mode ?? family.defaultMode) : family.defaultMode;
  return { family, color, mode };
}

/** Which category to show first, given the kind of page being built. */
export const KIND_TO_CATEGORY: Record<string, StyleCategory> = {
  job: "job",
  university: "academic",
  athlete: "athlete",
  "real-estate": "real-estate",
  listing: "real-estate",
  contractor: "business",
  sales: "sales",
  other: "business",
};

export function familiesByCategory(): Array<{ category: StyleCategory; families: StyleFamily[] }> {
  return STYLE_CATEGORY_ORDER.map((category) => ({
    category,
    families: STYLE_FAMILIES.filter((family) => family.category === category),
  })).filter((group) => group.families.length > 0);
}
