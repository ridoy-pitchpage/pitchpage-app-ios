import { Pressable } from "react-native";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP } from "@/theme/tokens";

/**
 * The back control.
 *
 * A full 44pt target rather than a 28pt glyph with hit-slop around it. Hit-slop
 * does make the touch area big enough, but it leaves nothing for an inspector —
 * or a person — to see, and this is the control someone reaches for when they
 * are already lost.
 */
export function BackButton({
  onPress,
  label = "Go back",
}: {
  onPress?: () => void;
  label?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ minHeight: MIN_TAP, minWidth: MIN_TAP }}
      className="-ml-2 items-center justify-center self-start rounded-full active:opacity-60"
    >
      <ChevronLeft size={26} color={colors.foreground} />
    </Pressable>
  );
}
