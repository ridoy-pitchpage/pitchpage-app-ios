import { Platform } from "react-native";

import { resolveStyle, type ColorPreset, type StyleFamily } from "@/page/style-families";

/**
 * How a page looks when the app draws it.
 *
 * The website has forty layout components. Cloning them would mean forty more
 * to keep in step, and most of what separates them — asymmetric grids, wide
 * split heroes, full-bleed columns, a sticky side rail — is a wide-screen idea
 * that does not survive a 390pt phone anyway.
 *
 * So the app renders by ARCHETYPE: five distinct treatments that between them
 * cover all thirty families, each combined with the family's own colour and
 * mode. The result reads as the same product and the same style choice without
 * pretending to be a pixel copy, and the real page is always one tap away under
 * "See it live".
 */

export type Archetype =
  /** Serif display at a light weight, hairline rules, no cards, wide measure. */
  | "editorial"
  /** Heavy caps, hard borders, square corners, one loud colour on a flat ground. */
  | "bold"
  /** Monospace throughout, key–value tables, dashed rules, uppercase labels. */
  | "console"
  /** Geometric sans, rounded surfaces, cards, accent used freely. */
  | "soft"
  /** Narrow measure, hairlines, numerals on a rule, almost no colour. */
  | "minimal";

export type TemplateTheme = {
  archetype: Archetype;
  /** The page's own background, independent of the app's appearance. */
  ground: string;
  /** Body text on the ground. */
  ink: string;
  /** Secondary text. */
  inkMuted: string;
  /** Section surfaces, where an archetype uses them. */
  surface: string;
  /** Hairlines and rules. */
  line: string;
  /** The one colour that carries the style, as a fill. */
  accent: string;
  /** Text and icons sitting ON the accent. */
  onAccent: string;
  /**
   * The accent used AS TEXT on the ground. Not the same value: a mid-tone
   * accent that is fine behind white text can fail badly as small text on a
   * pale ground, so this is mixed toward the ground's opposite until it passes.
   */
  accentText: string;
  mode: "light" | "dark";
  family: StyleFamily;
  color: ColorPreset;
};

// ─── colour maths ───────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const value = Number.parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${((1 << 24) | (clamp(r) << 16) | (clamp(g) << 8) | clamp(b)).toString(16).slice(1)}`;
}

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

function mix(from: string, to: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  return rgbToHex(
    r1 + (r2 - r1) * amount,
    g1 + (g2 - g1) * amount,
    b1 + (b2 - b1) * amount,
  );
}

/**
 * The accent, darkened or lightened just enough to be readable as text on the
 * given ground.
 *
 * Steps in 4% increments toward the ground's opposite until it clears 4.5:1,
 * the same approach the web layouts take. Stepping rather than jumping to black
 * keeps the colour recognisable: gold that has to darken should still look like
 * gold, not like brown.
 */
export function readableAccent(accent: string, ground: string): string {
  const target = luminance(ground) > 0.5 ? "#000000" : "#FFFFFF";
  let candidate = accent;
  for (let step = 0; step <= 25; step += 1) {
    if (contrastRatio(candidate, ground) >= 4.5) return candidate;
    candidate = mix(accent, target, step * 0.04);
  }
  return candidate;
}

/** Near-black or near-white on the accent, whichever is further from it. */
/**
 * Text sitting on the accent fill.
 *
 * Near-black rather than pure black is the softer, better-looking choice on a
 * fill, so it is the default dark ink. But the two mid-tone violets — violet
 * #8B5CF6 and indigo #6366F1 — sit almost exactly between the two: white
 * measures 4.23 and 4.47, near-black 4.46 and 4.23, so neither clears the 4.5
 * WCAG needs for text this size, and a CTA label on those accents is normal
 * body text, not large text. Pure black clears both (4.96 and 4.70), so it is
 * the fallback when the softer pair misses. Eighteen of the twenty presets
 * never reach it and keep the near-black.
 */
const AA_TEXT = 4.5;

function inkOnAccent(accent: string): string {
  const onWhite = contrastRatio("#FFFFFF", accent);
  const onSoftBlack = contrastRatio("#111111", accent);
  const best = onWhite >= onSoftBlack ? "#FFFFFF" : "#111111";

  if (Math.max(onWhite, onSoftBlack) >= AA_TEXT) return best;
  return contrastRatio("#000000", accent) >= AA_TEXT ? "#000000" : best;
}

// ─── the grounds ────────────────────────────────────────────────────────────

type Ground = { ground: string; surface: string; ink: string; inkMuted: string; line: string };

/**
 * Each archetype's own ground and ink, in both modes. These are drawn from the
 * families the archetype stands for — editorial's porcelain and warm cream come
 * from Premium and Ledger, console's near-black from Console, bold's flat black
 * from Arena — so a style still feels like itself.
 */
const GROUNDS: Record<Archetype, Record<"light" | "dark", Ground>> = {
  editorial: {
    light: { ground: "#F4F4F2", surface: "#FFFFFF", ink: "#151517", inkMuted: "#5C5C60", line: "#DEDEDA" },
    dark: { ground: "#0E0E10", surface: "#16161A", ink: "#F6F1E4", inkMuted: "#A09B92", line: "#26262B" },
  },
  bold: {
    light: { ground: "#FAF9F9", surface: "#EDEBEB", ink: "#0A0A0A", inkMuted: "#55524F", line: "#0A0A0A" },
    dark: { ground: "#0A0A0A", surface: "#1A1A1A", ink: "#FAFAFA", inkMuted: "#A3A3A3", line: "#FAFAFA" },
  },
  console: {
    light: { ground: "#E4E8ED", surface: "#FBFCFD", ink: "#10161E", inkMuted: "#59636F", line: "#C8D0D9" },
    dark: { ground: "#05080C", surface: "#0B1016", ink: "#C9D4E0", inkMuted: "#6B7A8A", line: "#1A222C" },
  },
  soft: {
    light: { ground: "#F8FAFC", surface: "#FFFFFF", ink: "#0F172A", inkMuted: "#64748B", line: "#E2E8F0" },
    dark: { ground: "#0B1220", surface: "#131C2B", ink: "#E8EDF5", inkMuted: "#94A3B8", line: "#1E293B" },
  },
  minimal: {
    light: { ground: "#FBFBFA", surface: "#F2F3F1", ink: "#14161A", inkMuted: "#61666B", line: "#E4E6E3" },
    dark: { ground: "#0A0C0B", surface: "#111412", ink: "#F3F5F2", inkMuted: "#8E948F", line: "#1C211E" },
  },
};

/** Resolve a stored `template` string into everything the renderer needs. */
export function themeForTemplate(template: string | null | undefined): TemplateTheme {
  const { family, color, mode } = resolveStyle(template);
  const ground = GROUNDS[family.archetype][mode];

  return {
    archetype: family.archetype,
    ...ground,
    accent: color.hex,
    onAccent: inkOnAccent(color.hex),
    accentText: readableAccent(color.hex, ground.ground),
    mode,
    family,
    color,
  };
}

/**
 * Type for each archetype: which face, and how headings are set.
 *
 * Only two families are bundled — Sora and Manrope, the app's own — so this
 * picks weight, case and tracking rather than loading thirty typefaces. A
 * monospace archetype falls back to the platform's mono, which on iOS is
 * SF Mono and reads correctly.
 */
export type TypeSpec = {
  displayFamily: string;
  bodyFamily: string;
  /** Headings in capitals. */
  displayUppercase: boolean;
  displayTracking: number;
  /** Small uppercase labels above a section, as several archetypes use. */
  eyebrowUppercase: boolean;
};

/** The platform's own monospace face. */
const MONO = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
}) as string;

export const TYPE_SPECS: Record<Archetype, TypeSpec> = {
  editorial: {
    displayFamily: "Sora_600SemiBold",
    bodyFamily: "Manrope_400Regular",
    displayUppercase: false,
    displayTracking: -0.5,
    eyebrowUppercase: true,
  },
  bold: {
    displayFamily: "Sora_700Bold",
    bodyFamily: "Manrope_400Regular",
    displayUppercase: true,
    displayTracking: -1,
    eyebrowUppercase: true,
  },
  console: {
    // Menlo exists on Apple platforms only; elsewhere naming it falls through
    // to the browser default, which is a serif — the opposite of the intent.
    displayFamily: MONO,
    bodyFamily: MONO,
    displayUppercase: false,
    displayTracking: -0.5,
    eyebrowUppercase: true,
  },
  soft: {
    displayFamily: "Sora_700Bold",
    bodyFamily: "Manrope_400Regular",
    displayUppercase: false,
    displayTracking: -0.6,
    eyebrowUppercase: false,
  },
  minimal: {
    displayFamily: "Sora_700Bold",
    bodyFamily: "Manrope_400Regular",
    displayUppercase: false,
    displayTracking: -0.8,
    eyebrowUppercase: true,
  },
};

/** Corner radius per archetype. Bold and console are square by design. */
export const RADIUS_FOR: Record<Archetype, number> = {
  editorial: 0,
  bold: 2,
  console: 4,
  soft: 14,
  minimal: 0,
};
