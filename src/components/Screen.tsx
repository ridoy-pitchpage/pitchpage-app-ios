import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View, type ScrollViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { useColors, useTheme } from "@/theme/ThemeProvider";
import { surfaceGradient } from "@/theme/tokens";

/**
 * The frame every screen sits in: safe-area insets, the background colour and
 * a consistent 16pt side gutter.
 */
export function Screen({
  children,
  edges = ["top", "bottom"],
  className,
}: {
  children: ReactNode;
  edges?: readonly Edge[];
  className?: string;
}) {
  const colors = useColors();
  const { resolved } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      {/*
        The ground is lit rather than painted: the background colour shaded a
        few percent either side, so a screen has a top and a bottom instead of
        being one flat slab. Faint on purpose — anything stronger competes
        with the cards standing on it.
      */}
      <LinearGradient
        colors={surfaceGradient(colors.background, resolved)}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={edges} className={["flex-1", className ?? ""].join(" ")}>
        {children}
      </SafeAreaView>
    </View>
  );
}

/** A scrolling body. `contentClassName` styles the content, not the viewport. */
export function ScreenScroll({
  children,
  contentClassName,
  ...rest
}: ScrollViewProps & { children: ReactNode; contentClassName?: string }) {
  return (
    <ScrollView
      {...rest}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      className="flex-1"
      contentContainerClassName={["px-4 pb-10 gap-4", contentClassName ?? ""].join(" ")}
    >
      {children}
    </ScrollView>
  );
}

/** Vertical rhythm between blocks inside a screen. */
export function Stack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <View className={["gap-3", className ?? ""].join(" ")}>{children}</View>;
}
