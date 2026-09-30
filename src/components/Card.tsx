import { View, type ViewProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useColors, useTheme } from "@/theme/ThemeProvider";
import { RADIUS, elevation, surfaceGradient } from "@/theme/tokens";

/**
 * A card surface: a faint gradient, a hairline border, and a shadow in the
 * palette's own foreground.
 *
 * Deliberately not the web's `.app-card`: that carries a hard-coded steel-blue
 * gradient in `styles.css` which both the site and the signed-in app override
 * back to the plain card colour. The app renders what the user actually sees,
 * not the shared default they never meet.
 *
 * The gradient is the card colour shaded a few percent either side rather
 * than a second colour, so a card still reads as one surface — the difference
 * between a card that looks lit and a card that looks striped is how far
 * apart the stops are. `flat` opts out where cards nest, because a gradient
 * inside a gradient reads as a seam.
 */
export function Card({
  className,
  flat = false,
  level = 1,
  style,
  ...rest
}: ViewProps & {
  className?: string;
  /** No gradient and no shadow — for a card sitting inside another. */
  flat?: boolean;
  /** How far off the page it sits. */
  level?: 1 | 2 | 3;
}) {
  const colors = useColors();
  const { resolved } = useTheme();

  if (flat) {
    return (
      <View
        {...rest}
        style={style}
        className={["rounded-card border border-border bg-card p-4", className ?? ""].join(" ")}
      />
    );
  }

  return (
    <View style={[{ borderRadius: RADIUS.card }, elevation(colors.foreground, level), style]}>
      <LinearGradient
        colors={surfaceGradient(colors.card, resolved)}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ borderRadius: RADIUS.card, overflow: "hidden" }}
      >
        <View
          {...rest}
          className={["rounded-card border border-border p-4", className ?? ""].join(" ")}
        />
      </LinearGradient>
    </View>
  );
}
