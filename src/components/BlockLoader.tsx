import { useEffect } from "react";
import { View, type DimensionValue } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { Muted } from "./Text";
import { useColors } from "@/theme/ThemeProvider";

/**
 * Loading, drawn as the thing that is loading: a page, in blocks.
 *
 * It replaced the system spinner everywhere (2026-10-09). A spinner only says
 * "wait"; an outline of a page says what is coming, in the same shapes the
 * page will have. Only opacity and transform animate, one shared clock drives
 * every block, and with Reduce Motion on the blocks hold still.
 *
 * The blocks are the theme's muted ink at low opacity rather than a colour of
 * their own, so they read on the app's grounds and on a template's alike.
 */

/** One trip of the wave down the page. */
const PULSE_MS = 1400;
/** One assembly of the page, from the first block to the last and away again. */
const BUILD_MS = 2600;
/** How many blocks the page outline has. */
const PAGE_BLOCKS = 8;

type Mode = "pulse" | "build";

/** A clock that runs 0→1 and starts again, or holds at 0 under Reduce Motion. */
function useLoop(duration: number, still: boolean): SharedValue<number> {
  const clock = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    clock.value = 0;
    clock.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(clock);
  }, [clock, duration, still]);
  return clock;
}

function Block({
  clock,
  index,
  mode,
  still,
  color,
  width,
  height,
  radius = 4,
  grow,
}: {
  clock: SharedValue<number>;
  index: number;
  mode: Mode;
  still: boolean;
  color: string;
  width?: DimensionValue;
  height: number;
  radius?: number;
  grow?: boolean;
}) {
  const animated = useAnimatedStyle(() => {
    if (still) return { opacity: 0.3, transform: [{ translateY: 0 }] };
    if (mode === "build") {
      // Each block lands in turn over the first three quarters, they all
      // stand together for a moment, then go and the page starts again.
      const start = (index / PAGE_BLOCKS) * 0.72;
      const landed = Math.min(Math.max((clock.value - start) / 0.1, 0), 1);
      const leaving = Math.min(Math.max((1 - clock.value) / 0.08, 0), 1);
      return {
        opacity: 0.08 + 0.32 * landed * leaving,
        transform: [{ translateY: (1 - landed) * 6 }],
      };
    }
    // A wave running down the page, top block first.
    const wave = 0.5 + 0.5 * Math.cos(2 * Math.PI * (clock.value - index / PAGE_BLOCKS));
    return { opacity: 0.14 + 0.22 * wave, transform: [{ translateY: 0 }] };
  });

  return (
    <Animated.View
      style={[
        { backgroundColor: color, height, borderRadius: radius },
        width != null ? { width } : null,
        grow ? { flex: 1 } : null,
        animated,
      ]}
    />
  );
}

/**
 * A page outline whose blocks pulse, or, with `mode="build"`, land one at a
 * time, for a page that is being built. One VoiceOver element that reads its
 * label; the label also shows under the outline.
 */
export function BlockLoader({
  label,
  mode = "pulse",
  color,
}: {
  label: string;
  mode?: Mode;
  /** Ink for the blocks and the label. The theme's muted ink by default. */
  color?: string;
}) {
  const colors = useColors();
  const still = useReducedMotion();
  const clock = useLoop(mode === "build" ? BUILD_MS : PULSE_MS, still);
  const shared = { clock, mode, still, color: color ?? colors.mutedForeground };

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      className="items-center gap-4"
    >
      <View style={{ width: 208, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Block {...shared} index={0} width={40} height={40} radius={20} />
          <View style={{ flex: 1, gap: 7 }}>
            <Block {...shared} index={1} width="82%" height={10} />
            <Block {...shared} index={2} width="52%" height={8} />
          </View>
        </View>
        <Block {...shared} index={3} height={66} radius={12} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Block {...shared} index={4} height={46} radius={10} grow />
          <Block {...shared} index={5} height={46} radius={10} grow />
        </View>
        <Block {...shared} index={6} width="100%" height={8} />
        <Block {...shared} index={7} width="70%" height={8} />
      </View>
      <Muted className="text-center" style={color ? { color } : undefined}>
        {label}
      </Muted>
    </View>
  );
}

function Dot({ clock, index, still, color }: { clock: SharedValue<number>; index: number; still: boolean; color: string }) {
  const animated = useAnimatedStyle(() => {
    if (still) return { opacity: 0.7, transform: [{ scale: 1 }] };
    const wave = 0.5 + 0.5 * Math.cos(2 * Math.PI * (clock.value - index / 3));
    return { opacity: 0.35 + 0.65 * wave, transform: [{ scale: 0.78 + 0.22 * wave }] };
  });
  return <Animated.View style={[{ width: 7, height: 7, borderRadius: 2, backgroundColor: color }, animated]} />;
}

/**
 * Three small blocks pulsing in turn, for a control that is busy. Hidden from
 * VoiceOver: the control itself says it is busy.
 */
export function BlockDots({ color }: { color: string }) {
  const still = useReducedMotion();
  const clock = useLoop(1000, still);
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: 5, height: 20 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {[0, 1, 2].map((index) => (
        <Dot key={index} clock={clock} index={index} still={still} color={color} />
      ))}
    </View>
  );
}
