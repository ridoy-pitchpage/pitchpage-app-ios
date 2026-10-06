/**
 * Colour names map 1:1 onto the web app's CSS custom properties
 * (`src/lib/app-theme.ts` and `src/lib/site-theme.ts` in the web repo).
 *
 * Each name resolves to a CSS variable holding a complete colour string, not an
 * "r g b" triple, because two of the web's tokens (--border and --input) are
 * deliberately translucent and flattening them would change how a field edge
 * reads against a card. The cost is that `bg-primary/50` style opacity
 * modifiers do not work on these names; use an explicit opacity style instead.
 *
 * The values themselves are in src/theme/tokens.ts, applied by ThemeProvider.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  /*
   * Class, not the default "media".
   *
   * Nothing here uses a `dark:` variant — light and dark are two sets of CSS
   * variables that ThemeProvider swaps with vars() — so this looks like it
   * should not matter. It does, on web, and it crashes the app.
   *
   * react-native-css-interop watches <head> for the stylesheet, reads this
   * flag out of it, and then calls colorScheme.set(). That setter throws
   * outright when the flag says "media", so the first paint of the web build
   * raises "Cannot manually set color scheme, as dark mode is type 'media'".
   * It is loudest under `expo start --web`, where the stylesheet arrives after
   * the observer is watching.
   */
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "var(--pp-background)",
        foreground: "var(--pp-foreground)",
        card: "var(--pp-card)",
        "card-foreground": "var(--pp-card-foreground)",
        popover: "var(--pp-popover)",
        "popover-foreground": "var(--pp-popover-foreground)",
        muted: "var(--pp-muted)",
        "muted-foreground": "var(--pp-muted-foreground)",
        secondary: "var(--pp-secondary)",
        "secondary-foreground": "var(--pp-secondary-foreground)",
        primary: "var(--pp-primary)",
        "primary-foreground": "var(--pp-primary-foreground)",
        link: "var(--pp-link)",
        accent: "var(--pp-accent)",
        "accent-foreground": "var(--pp-accent-foreground)",
        destructive: "var(--pp-destructive)",
        "destructive-foreground": "var(--pp-destructive-foreground)",
        border: "var(--pp-border)",
        input: "var(--pp-input)",
        ring: "var(--pp-ring)",
      },
      fontFamily: {
        // Sora for headings, Manrope for body — the web app's pairing (§19).
        // Headings are bold and never italic: the web's global h1/h2/h3 rule is
        // Lora italic, which every heading there overrides per element.
        heading: ["Sora_700Bold"],
        "heading-semi": ["Sora_600SemiBold"],
        body: ["Manrope_400Regular"],
        "body-medium": ["Manrope_500Medium"],
        "body-bold": ["Manrope_700Bold"],
      },
      // Softer than the web's 12/10: a phone holds a card at arm's length,
      // and iOS has moved to noticeably rounder surfaces. Kept in step with
      // RADIUS in src/theme/tokens.ts.
      borderRadius: { card: "18px", control: "14px" },
    },
  },
  plugins: [],
};
