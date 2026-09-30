/**
 * The palettes, copied value for value from the web repo.
 *
 * Sources of truth:
 *   appLight / appDark  → web `src/lib/app-theme.ts` (the signed-in app, `.pp-app`)
 *   site                → web `src/lib/site-theme.ts` (marketing + published pages)
 *
 * The brand moved from forest to a four-step blue on 2026-09-27. Several docs in
 * the web repo still describe the old forest/teal palettes; those are stale and
 * the code above is what ships. Do not take token values from prose.
 *
 * Two deliberate departures from a naive copy, both inherited from the web:
 *   - `input` is raised well above the brand hairline. It is the only thing
 *     identifying a text field as a control, and WCAG 1.4.11 asks 3:1 for that;
 *     the brand value measures 1.44:1 against a card. `border` stays the brand
 *     hairline because a card is already told apart by its own surface.
 *   - `primary` inverts in dark. Dark blue on near-navy is invisible, so dark
 *     takes the swatch's brightest step with the dark-navy ink on top (9.40:1).
 */

export type Palette = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  muted: string;
  mutedForeground: string;
  secondary: string;
  secondaryForeground: string;
  primary: string;
  primaryForeground: string;
  /** Text that acts as a link. See the note on `link` below. */
  link: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
};

/** Signed-in app, light. */
export const appLight: Palette = {
  background: "#F5EBDD",
  foreground: "#413333",
  card: "#FFFDF9",
  cardForeground: "#413333",
  popover: "#FFFDF9",
  popoverForeground: "#413333",
  muted: "#EDE0CE",
  mutedForeground: "#6B5A52",
  secondary: "#EDE0CE",
  secondaryForeground: "#413333",
  primary: "#0D47A1",
  primaryForeground: "#FFFFFF",
  link: "#0D47A1",
  accent: "#F2765E",
  accentForeground: "#332424",
  destructive: "#A32017",
  destructiveForeground: "#FFFFFF",
  border: "rgba(65,51,51,0.16)",
  input: "rgba(65,51,51,0.60)",
  ring: "#2196F3",
};

/** Signed-in app, dark. A deep navy ground, so light and dark read as one product. */
export const appDark: Palette = {
  background: "#0A141F",
  foreground: "#F1E8DC",
  card: "#101C2A",
  cardForeground: "#F1E8DC",
  popover: "#101C2A",
  popoverForeground: "#F1E8DC",
  muted: "#172536",
  mutedForeground: "#A6B0BC",
  secondary: "#172536",
  secondaryForeground: "#F1E8DC",
  primary: "#90CAF9",
  primaryForeground: "#0A2038",
  link: "#90CAF9",
  accent: "#F2765E",
  accentForeground: "#2A130E",
  destructive: "#F2675B",
  destructiveForeground: "#2A0F0C",
  border: "rgba(209,220,232,0.16)",
  input: "rgba(209,220,232,0.45)",
  ring: "#90CAF9",
};

/**
 * Signed-out screens (welcome, sign-in, examples, pricing…), matching the
 * marketing site. It has one palette only: the web gives marketing pages no
 * dark mode, and the app follows so a signed-out screen looks like the site a
 * new user just came from.
 */
export const site: Palette = {
  ...appLight,
  primary: "#2196F3",
  primaryForeground: "#0A2038",
  // NOT the primary above. #2196F3 is the marketing palette's button fill and
  // measures 2.4:1 as text on the cream ground — unreadable, and it was.
  // Links take the darker step, which clears 8:1.
  link: "#0D47A1",
  accent: "#0D47A1",
  accentForeground: "#FFFFFF",
  ring: "#90CAF9",
  // The brand hairline. The raised `input` above is scoped to the signed-in app
  // on the web, and the same contrast defect is still live on the public forms
  // there; the app keeps its forms readable instead of copying the defect.
  input: "rgba(65,51,51,0.60)",
};

/** The CSS variable names the Tailwind config reads. */
export const VAR_NAMES: Record<keyof Palette, string> = {
  background: "--pp-background",
  foreground: "--pp-foreground",
  card: "--pp-card",
  cardForeground: "--pp-card-foreground",
  popover: "--pp-popover",
  popoverForeground: "--pp-popover-foreground",
  muted: "--pp-muted",
  mutedForeground: "--pp-muted-foreground",
  secondary: "--pp-secondary",
  secondaryForeground: "--pp-secondary-foreground",
  primary: "--pp-primary",
  primaryForeground: "--pp-primary-foreground",
  link: "--pp-link",
  accent: "--pp-accent",
  accentForeground: "--pp-accent-foreground",
  destructive: "--pp-destructive",
  destructiveForeground: "--pp-destructive-foreground",
  border: "--pp-border",
  input: "--pp-input",
  ring: "--pp-ring",
};

/** A palette as the `{ "--pp-x": value }` map NativeWind's vars() wants. */
export function paletteVars(palette: Palette): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, name] of Object.entries(VAR_NAMES)) {
    out[name] = palette[key as keyof Palette];
  }
  return out;
}

/** Shape, spacing and motion constants shared by the design-system components. */
export const RADIUS = { card: 18, control: 14, pill: 999 } as const;

/** iOS asks for 44pt; every tappable control is at least this tall. */
export const MIN_TAP = 44;

/**
 * The iOS layout grid, from the 393×852 spec: four stretch columns, a 16pt
 * margin either side and a 16pt gutter between them.
 *
 * A two-up card spans two columns plus the gutter between them, which is why
 * anything laying out cards derives its width from these rather than guessing
 * a percentage — a percentage cannot know about the gutter, so it either
 * overflows or leaves a ragged edge.
 */
export const GRID = { columns: 4, margin: 16, gutter: 16 } as const;

/** The width of `span` columns inside a container `available` points wide. */
export function columnSpan(available: number, span: number): number {
  const column = (available - GRID.gutter * (GRID.columns - 1)) / GRID.columns;
  return column * span + GRID.gutter * (span - 1);
}

// ─── depth, glass and gradient ──────────────────────────────────────────────

/**
 * Everything below is DERIVED from the palette above, never picked by eye.
 *
 * A modern surface is not a new colour, it is the same colour with light
 * falling on it: a gradient a few percent either side of the token, a shadow
 * the ground's own darkness, a translucent layer over whatever is behind. So
 * these take a palette in and mix, rather than introducing hues that would
 * then have to be kept in step with the web's.
 */

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** `t` of 0 returns `from`, 1 returns `to`. */
export function mix(from: string, to: string, t: number): string {
  const [r1, g1, b1] = parseHex(from);
  const [r2, g2, b2] = parseHex(to);
  const c = (a: number, b: number) => clamp255(a + (b - a) * t);
  return `#${[c(r1, r2), c(g1, g2), c(b1, b2)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Lighten toward white; negative darkens toward black. */
export function shade(hex: string, amount: number): string {
  return amount >= 0 ? mix(hex, "#FFFFFF", amount) : mix(hex, "#000000", -amount);
}

/**
 * Two stops, a few percent apart, for a fill that catches light at the top.
 *
 * Light mode lifts the top edge; dark mode lifts it less and drops the bottom
 * further, because on a near-black ground a bright top reads as plastic.
 */
export function surfaceGradient(hex: string, mode: "light" | "dark"): [string, string] {
  return mode === "light"
    ? [shade(hex, 0.06), shade(hex, -0.03)]
    : [shade(hex, 0.05), shade(hex, -0.05)];
}

/** The same, for a filled control: a touch more separation so it reads raised. */
export function controlGradient(hex: string, mode: "light" | "dark"): [string, string] {
  return mode === "light"
    ? [shade(hex, 0.14), shade(hex, -0.08)]
    : [shade(hex, 0.1), shade(hex, -0.12)];
}

/**
 * Shadows, as iOS draws them: wide and faint rather than tight and dark.
 *
 * The colour is the palette's own foreground, so a shadow on cream is warm
 * and a shadow on navy is cold — a neutral black over a warm ground is the
 * single thing that makes an interface look cheap.
 */
export function elevation(foreground: string, level: 1 | 2 | 3) {
  const spec = {
    1: { opacity: 0.06, radius: 10, offset: 3 },
    2: { opacity: 0.1, radius: 20, offset: 8 },
    3: { opacity: 0.16, radius: 32, offset: 14 },
  }[level];
  return {
    shadowColor: foreground,
    shadowOpacity: spec.opacity,
    shadowRadius: spec.radius,
    shadowOffset: { width: 0, height: spec.offset },
    // Android reads elevation only; the value tracks the blur radius.
    elevation: spec.offset,
  };
}

/** How strong the blur behind a glass surface is, per platform norm. */
export const GLASS = { intensity: 28, heavyIntensity: 48 } as const;
