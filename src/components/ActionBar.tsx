import type { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";

import { useColors, useTheme } from "@/theme/ThemeProvider";
import { GLASS } from "@/theme/tokens";

/**
 * The bar that holds a screen's one real action, pinned to the bottom.
 *
 * Four screens each built this out of the same classes — a hairline, a solid
 * card fill, 16pt of padding — which made the bar a slab the content stopped
 * dead against. It is glass now: the page runs under it and blurs, so the
 * button reads as floating above what you were reading rather than as the
 * end of it.
 *
 * On iOS that is a real backdrop sample. Elsewhere it is a translucent fill,
 * because a fallback painted opaque on the wrong ground looks worse than no
 * blur, and because Android and the web preview have no equivalent.
 *
 * It does NOT add a bottom safe-area inset: every screen using it already
 * sits inside a Screen with the bottom edge, and adding it twice leaves a
 * visible band under the button.
 */
export function ActionBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const colors = useColors();
  const { resolved } = useTheme();

  return (
    <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={GLASS.heavyIntensity}
          tint={resolved === "dark" ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.card, opacity: 0.94 }]}
        />
      )}
      <View className={["px-4 pb-2 pt-3", className ?? ""].join(" ")}>{children}</View>
    </View>
  );
}
