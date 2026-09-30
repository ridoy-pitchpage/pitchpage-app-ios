import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { useColors, useTheme } from "@/theme/ThemeProvider";
import { MIN_TAP, RADIUS, controlGradient, elevation, shade } from "@/theme/tokens";

/**
 * The one button. Variants match how the web app uses colour: primary for the
 * action a screen exists for, secondary for the alternative, ghost for
 * navigation, destructive for anything that removes something.
 *
 * A filled variant is a gradient rather than a flat fill, and carries a
 * shadow tinted with the palette's own foreground. Both are derived from the
 * token, not picked: the fill is the same colour with light falling across
 * it, which is what separates a control that looks pressed-in from one that
 * looks painted on. A neutral black shadow over a cream ground is the single
 * thing that makes an interface look cheap, so the shadow is warm on cream
 * and cold on navy without either being a new value.
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

const LABEL: Record<ButtonVariant, string> = {
  primary: "text-primary-foreground",
  secondary: "text-foreground",
  ghost: "text-primary",
  destructive: "text-destructive-foreground",
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
  className,
  ...rest
}: Props) {
  const colors = useColors();
  const { resolved } = useTheme();
  const isDisabled = disabled === true || loading;
  const height = size === "lg" ? 52 : MIN_TAP;

  const filled = variant === "primary" || variant === "destructive";
  const base = variant === "destructive" ? colors.destructive : colors.primary;
  const gradient = controlGradient(base, resolved);
  // The spinner and any icon sit ON the fill, so they take the paired
  // foreground rather than a colour of their own.
  const onFill =
    variant === "destructive" ? colors.destructiveForeground : colors.primaryForeground;
  const spinner = filled ? onFill : colors.mutedForeground;

  return (
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
      style={({ pressed }) => [
        {
          minHeight: height,
          borderRadius: RADIUS.control,
          // Opacity rather than a greyed palette: it reads as "not yet" on
          // both light and dark without inventing a fifth colour.
          opacity: isDisabled ? 0.4 : 1,
        },
        // A pressed control sinks: the shadow goes with it rather than the
        // whole button fading, which is what a flat opacity press looks like.
        filled && !isDisabled ? elevation(colors.foreground, pressed ? 1 : 2) : null,
        pressed && !isDisabled ? { transform: [{ scale: 0.985 }] } : null,
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
                numberOfLines={1}
                className={`font-body-bold text-[16px] ${LABEL[variant]}`}
                style={filled ? { color: onFill } : undefined}
              >
                {title}
              </Text>
            </>
          )}
        </GradientOrPlain>
      )}
    </Pressable>
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
  };

  if (filled) {
    return (
      <LinearGradient
        colors={pressed ? [shade(gradient[0], -0.06), shade(gradient[1], -0.06)] : gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
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
