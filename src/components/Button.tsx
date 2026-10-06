import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useColors, useTheme } from "@/theme/ThemeProvider";
import { MIN_TAP, RADIUS, mix, shade } from "@/theme/tokens";

/**
 * The one button. Variants match how the web app uses colour: primary for the
 * action a screen exists for, secondary for the alternative, ghost for
 * navigation, destructive for anything that removes something.
 *
 * Subtle tonal fill and a short press response provide emphasis without
 * shadows. Labels wrap and the control grows with the user's text size.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "md" | "lg";

type Props = Omit<PressableProps, "children" | "style"> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Rendered before the label; give it a colour that matches the variant. */
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  /** A short success tap. Off by default; on for publish, accept and similar. */
  haptic?: boolean;
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  fullWidth = true,
  haptic = false,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  className,
  ...rest
}: Props) {
  const colors = useColors();
  const { resolved } = useTheme();
  const isDisabled = disabled === true || loading;
  const height = size === "lg" ? 54 : MIN_TAP + 8;

  const filled = variant === "primary" || variant === "destructive";
  const base = variant === "destructive" ? colors.destructive : colors.primary;
  const gradient: [string, string] =
    variant === "primary"
      ? [mix(base, colors.ring, resolved === "dark" ? 0.04 : 0.12), base]
      : [shade(base, 0.04), base];
  // The spinner and any icon sit ON the fill, so they take the paired
  // foreground rather than a colour of their own.
  const onFill =
    variant === "destructive" ? colors.destructiveForeground : colors.primaryForeground;
  const spinner = filled ? onFill : colors.mutedForeground;
  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Animated.View
      style={[fullWidth ? { width: "100%" } : { alignSelf: "flex-start" }, pressStyle]}
    >
      <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={title}
      disabled={isDisabled}
      onPress={(event) => {
        if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(event);
      }}
      onPressIn={(event) => {
        // Reanimated SharedValue is intentionally mutable inside event handlers.
        // eslint-disable-next-line react-hooks/immutability
        pressScale.value = withSpring(0.985, {
          damping: 25,
          stiffness: 400,
          reduceMotion: ReduceMotion.System,
        });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        // eslint-disable-next-line react-hooks/immutability
        pressScale.value = withSpring(1, {
          damping: 23,
          stiffness: 340,
          reduceMotion: ReduceMotion.System,
        });
        onPressOut?.(event);
      }}
      style={[
        {
          minHeight: height,
          borderRadius: RADIUS.control,
          // Opacity rather than a greyed palette: it reads as "not yet" on
          // both light and dark without inventing a fifth colour.
          opacity: isDisabled ? 0.4 : 1,
        },
        fullWidth ? { width: "100%" } : { alignSelf: "flex-start" },
      ]}
      className={className}
    >
      {({ pressed }) => (
        <GradientOrPlain
          filled={filled}
          gradient={gradient}
          pressed={pressed}
          height={height}
          variant={variant}
          borderColor={colors.border}
          cardColor={colors.card}
        >
          {loading ? (
            <ActivityIndicator size="small" color={spinner} />
          ) : (
            <>
              {icon ? <View>{icon}</View> : null}
              <Text
                className="font-body-bold text-[16px]"
                style={{
                  color: filled ? onFill : variant === "ghost" ? colors.link : colors.foreground,
                  flexShrink: 1,
                  textAlign: "center",
                }}
              >
                {title}
              </Text>
            </>
          )}
        </GradientOrPlain>
      )}
      </Pressable>
    </Animated.View>
  );
}

/**
 * The fill itself.
 *
 * A gradient only where there is a fill to shade. Ghost and secondary stay
 * flat surfaces: shading an almost-transparent control makes a smear, not
 * depth.
 */
function GradientOrPlain({
  filled,
  gradient,
  pressed,
  height,
  variant,
  borderColor,
  cardColor,
  children,
}: {
  filled: boolean;
  gradient: [string, string];
  pressed: boolean;
  height: number;
  variant: ButtonVariant;
  borderColor: string;
  cardColor: string;
  children: React.ReactNode;
}) {
  const inner = {
    minHeight: height,
    borderRadius: RADIUS.control,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  };

  if (filled) {
    return (
      <LinearGradient
        colors={pressed ? [shade(gradient[0], -0.06), shade(gradient[1], -0.06)] : gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[inner, { overflow: "hidden" }]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        inner,
        variant === "secondary"
          ? { backgroundColor: cardColor, borderWidth: 1, borderColor }
          : null,
      ]}
    >
      {children}
    </View>
  );
}
