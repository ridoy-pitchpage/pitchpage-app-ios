import type { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";

import { useColors, useTheme } from "@/theme/ThemeProvider";
import { GLASS } from "@/theme/tokens";

/**
 * The bar at the top of a screen that is showing a page underneath.
 *
 * The counterpart to ActionBar, and glass for the same reason: the builder,
 * the preview and the live view all draw a page in its own colours, and a
 * solid header above one is a lid. Frosted, the page runs under it and the
 * screen reads as one surface with a control layer over it rather than two
 * unrelated blocks stacked.
 *
 * The hairline stays: without an edge, a blurred bar over a pale page has no
 * boundary at all and the title appears to float in the content.
 */
export function TopBar({ children, className }: { children: ReactNode; className?: string }) {
  const colors = useColors();
  const { resolved } = useTheme();

  return (
    <View
      style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}
    >
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={GLASS.heavyIntensity}
          tint={resolved === "dark" ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card, opacity: 0.94 }]} />
      )}
      <View className={["flex-row items-center gap-2 px-2 py-1", className ?? ""].join(" ")}>
        {children}
      </View>
    </View>
  );
}
