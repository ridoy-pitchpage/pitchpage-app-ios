import type { ReactNode } from "react";
import { ScrollView, View, type ScrollViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

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
  return (
    <SafeAreaView edges={edges} className={["flex-1 bg-background", className ?? ""].join(" ")}>
      {children}
    </SafeAreaView>
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
