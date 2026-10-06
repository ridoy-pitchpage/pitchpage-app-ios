import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { appLight, mix, shade, site } from "@/theme/tokens";

/**
 * The branded focal surface used across the app. Its hues come from the
 * existing blue palette; the decorative shapes never carry information.
 */
export function BrandPanel({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: ViewStyle;
}) {
  const upper = mix(appLight.primary, site.primary, 0.34);
  const lower = shade(appLight.primary, -0.2);

  return (
    <View style={[{ borderRadius: 24 }, style]}>
      <LinearGradient
        colors={[upper, lower]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, overflow: "hidden" }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -88,
            right: -58,
            width: 210,
            height: 210,
            borderRadius: 105,
            backgroundColor: "rgba(255,255,255,0.1)",
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: -94,
            right: 44,
            width: 170,
            height: 170,
            borderRadius: 85,
            borderWidth: 24,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />
        <View className={["p-5", className ?? ""].join(" ")}>{children}</View>
      </LinearGradient>
    </View>
  );
}
