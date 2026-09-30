import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";
import * as Haptics from "expo-haptics";

import { MIN_TAP } from "@/theme/tokens";

/**
 * The one button. Variants match how the web app uses colour: primary for the
 * action a screen exists for, secondary for the alternative, ghost for
 * navigation, destructive for anything that removes something.
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

const CONTAINER: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "bg-card border border-border",
  ghost: "bg-transparent",
  destructive: "bg-destructive",
};

const LABEL: Record<ButtonVariant, string> = {
  primary: "text-primary-foreground",
  secondary: "text-foreground",
  ghost: "text-primary",
  destructive: "text-destructive-foreground",
};

const SPINNER: Record<ButtonVariant, string> = {
  primary: "#FFFFFF",
  secondary: "#6B5A52",
  ghost: "#6B5A52",
  destructive: "#FFFFFF",
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
  const isDisabled = disabled === true || loading;

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
      style={{ minHeight: size === "lg" ? 52 : MIN_TAP }}
      className={[
        "flex-row items-center justify-center gap-2 rounded-control px-5",
        CONTAINER[variant],
        fullWidth ? "w-full" : "self-start",
        // Opacity rather than a greyed palette: it reads as "not yet" on both
        // light and dark without inventing a fifth colour.
        isDisabled ? "opacity-40" : "active:opacity-80",
        className ?? "",
      ].join(" ")}
    >
      {loading ? (
        <ActivityIndicator size="small" color={SPINNER[variant]} />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Text
            numberOfLines={1}
            className={`font-body-bold text-[16px] ${LABEL[variant]}`}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
