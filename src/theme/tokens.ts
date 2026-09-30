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
export const RADIUS = { card: 12, control: 10, pill: 999 } as const;

/** iOS asks for 44pt; every tappable control is at least this tall. */
export const MIN_TAP = 44;
