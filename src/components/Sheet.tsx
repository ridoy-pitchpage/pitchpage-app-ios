import { useCallback, useEffect, useRef, type ReactNode, type RefObject } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { vars } from "nativewind";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  ReduceMotion,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import { H3 } from "./Text";
import { SheetFocusContext } from "./sheet-focus";
import { useColors, useTheme } from "@/theme/ThemeProvider";
import { elevation, paletteVars, surfaceGradient } from "@/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { ModalSurface, useModalSurfaceDimensions } from "./ModalSurface";

/** Room left above a revealed field, so its label shows with it. */
const REVEAL_MARGIN = 56;

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
  const { palette, resolved: mode } = useTheme();
  const surface = useModalSurfaceDimensions();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const scrollY = useRef(0);
  const viewportHeight = useRef(0);

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

  /*
   * Scrolls the focused field into the part of the sheet the keyboard leaves
   * visible. iOS does this for a UITextField in a UIScrollView, but not for a
   * React Native field in a sheet that has just been resized above the
   * keyboard, which is why a section's paragraph box was typed into blind.
   * It only moves when the field is out of view, so tapping a visible field
   * never makes the sheet jump.
   */
  const revealFocused = useCallback(() => {
    if (Platform.OS === "web") return; // the browser scrolls a focused field itself
    const input = TextInput.State.currentlyFocusedInput();
    const scroll = scrollRef.current;
    const content = contentRef.current;
    if (!input || !scroll || !content) return;
    input.measureLayout(
      content,
      (_x, y, _width, height) => {
        const top = scrollY.current;
        const bottom = top + viewportHeight.current;
        if (y - REVEAL_MARGIN < top) {
          scroll.scrollTo({ y: Math.max(0, y - REVEAL_MARGIN), animated: true });
        } else if (y + height + 16 > bottom) {
          scroll.scrollTo({ y: y + height + 16 - viewportHeight.current, animated: true });
        }
      },
      () => undefined,
    );
  }, []);

  /*
   * A field can gain focus before the keyboard is up (the first tap) or while
   * it already is (moving between fields). The first case waits for the
   * keyboard, because the sheet only knows its new height once it has risen;
   * the second has nothing to wait for.
   */
  const pendingReveal = useRef(false);
  const requestReveal = useCallback(() => {
    if (Keyboard.isVisible()) setTimeout(revealFocused, 60);
    else pendingReveal.current = true;
  }, [revealFocused]);

  useEffect(() => {
    if (!visible) return;
    const shown = Keyboard.addListener("keyboardDidShow", () => {
      pendingReveal.current = false;
      revealFocused();
    });
    return () => shown.remove();
  }, [visible, revealFocused]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <ModalSurface>
        {/* A Modal is outside the app root, so gestures in it (dragging a section) need their own. */}
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Animated.View style={[{ ...StyleSheetAbsolute, backgroundColor: "#000" }, scrimStyle]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={{ flex: 1 }}
            />
          </Animated.View>

          {/*
            Lifts the sheet above the keyboard. Without it the keyboard simply
            covered the lower half of the sheet, along with whatever field was
            being typed into. box-none keeps the empty space above the sheet
            passing taps through to the scrim, which is what closes it.
          */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            pointerEvents="box-none"
            style={{ flex: 1, justifyContent: "flex-end", paddingTop: insets.top + 8 }}
          >
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
                // flexShrink lets the sheet give up height to the keyboard instead
                // of pushing its own header off the top of the screen.
                { maxHeight: surface.height * maxHeightRatio, flexShrink: 1 },
                // Cast upward, not down: the sheet is above the page, so its
                // shadow belongs on the edge that meets it.
                {
                  ...elevation("#000000", 3),
                  shadowOffset: { width: 0, height: -10 },
                },
              ]}
              className="overflow-hidden rounded-t-[28px] border-t border-border"
            >
              {/*
                Every layer between the panel and the ScrollView has to be
                allowed to shrink. Otherwise each one grows to the full height
                of the content, the panel clips it, and the ScrollView — which
                believes it is showing everything — never scrolls: the last
                entries in "Add a section" could be dragged into view but
                sprang back out of reach when let go.
              */}
              <LinearGradient
                colors={surfaceGradient(palette.card, mode)}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ flexShrink: 1 }}
              >
              <SafeAreaView edges={["bottom"]} style={{ flexShrink: 1 }}>
                {title ? (
                  <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
                    <H3 className="min-w-0 flex-1">{title}</H3>
                    <Pressable
                      onPress={onClose}
                      accessibilityRole="button"
                      accessibilityLabel="Close"
                      hitSlop={12}
                      style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}
                    >
                      <X size={22} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                ) : null}

                <SheetFocusContext.Provider value={requestReveal}>
                  <ScrollView
                    ref={scrollRef}
                    // The declared type predates React 19 refs, which may hold null.
                    innerViewRef={contentRef as RefObject<View>}
                    style={{ flexShrink: 1 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerClassName="px-4 pb-4 gap-2"
                    scrollEventThrottle={32}
                    onScroll={(event) => {
                      scrollY.current = event.nativeEvent.contentOffset.y;
                    }}
                    onLayout={(event) => {
                      viewportHeight.current = event.nativeEvent.layout.height;
                      // The viewport has just shrunk for the keyboard.
                      if (pendingReveal.current && Keyboard.isVisible()) {
                        pendingReveal.current = false;
                        revealFocused();
                      }
                    }}
                  >
                    {children}
                  </ScrollView>
                </SheetFocusContext.Provider>
              </SafeAreaView>
              </LinearGradient>
            </Animated.View>
          </KeyboardAvoidingView>
        </GestureHandlerRootView>
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
