import { useEffect, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { vars } from "nativewind";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  ReduceMotion,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import { H3 } from "./Text";
import { useColors, useTheme } from "@/theme/ThemeProvider";
import { paletteVars } from "@/theme/tokens";
import { ModalSurface, useModalSurfaceDimensions } from "./ModalSurface";

/**
 * A sheet that rises from the bottom — the phone's answer to the web builder's
 * dialogs, which assume a pointer and a wide window.
 *
 * Only transform and opacity animate, and both respect Reduce Motion, which is
 * the same rule the web's motion follows.
 */
export function Sheet({
  visible,
  onClose,
  title,
  children,
  /** Cap the sheet's height as a fraction of the screen. */
  maxHeightRatio = 0.85,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxHeightRatio?: number;
}) {
  const colors = useColors();
  const { palette } = useTheme();
  const surface = useModalSurfaceDimensions();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = visible
      ? withSpring(1, { damping: 22, stiffness: 240, reduceMotion: ReduceMotion.System })
      : withTiming(0, { duration: 160, reduceMotion: ReduceMotion.System });
  }, [visible, progress]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 24 }],
    opacity: progress.value,
  }));

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value * 0.45 }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <ModalSurface>
        <View className="flex-1 justify-end">
          <Animated.View style={[{ ...StyleSheetAbsolute, backgroundColor: "#000" }, scrimStyle]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={{ flex: 1 }}
            />
          </Animated.View>

          {/*
            A Modal renders in its own root, outside the tree ThemeProvider set
            the palette variables on, so every themed class inside would resolve
            to nothing and the panel would come out transparent. The variables
            have to be re-applied here.
          */}
          <Animated.View
            style={[
              panelStyle,
              vars(paletteVars(palette)),
              { maxHeight: surface.height * maxHeightRatio, backgroundColor: palette.card },
            ]}
            className="rounded-t-[20px] border-t border-border"
          >
            <SafeAreaView edges={["bottom"]}>
              {/* The grabber reads as "this can be dismissed" before anything is read. */}
              <View className="items-center pt-2">
                <View
                  className="h-1 w-10 rounded-full"
                  style={{ backgroundColor: colors.mutedForeground, opacity: 0.35 }}
                />
              </View>

              {title ? (
                <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
                  <H3 className="min-w-0 flex-1">{title}</H3>
                  <Pressable
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    hitSlop={12}
                    className="p-1"
                  >
                    <X size={22} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              ) : null}

              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerClassName="px-4 pb-4 gap-2"
              >
                {children}
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </View>
      </ModalSurface>
    </Modal>
  );
}

/** `position: absolute; inset: 0` without pulling in StyleSheet for one value. */
const StyleSheetAbsolute = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
