import { useState, type Ref } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

import { Label, Muted } from "./Text";
import { useColors, useTheme } from "@/theme/ThemeProvider";
import { mix, MIN_TAP } from "@/theme/tokens";

type Props = Omit<TextInputProps, "style"> & {
  label?: string;
  inputRef?: Ref<TextInput>;
  hint?: string;
  error?: string | null;
  /** Adds the show/hide control and starts obscured. */
  secure?: boolean;
  /** For a multiline field: how tall it starts. */
  minHeight?: number;
  /** A decorative leading glyph that helps people scan a form quickly. */
  icon?: React.ReactNode;
  className?: string;
};

export function TextField({
  label,
  inputRef,
  hint,
  error,
  secure = false,
  minHeight,
  icon,
  className,
  ...rest
}: Props) {
  const colors = useColors();
  const { resolved } = useTheme();
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);
  const fieldMinHeight = Math.max(minHeight ?? 52, MIN_TAP);
  const multiline = Boolean(rest.multiline);

  return (
    <View className={["gap-1.5", className ?? ""].join(" ")}>
      {label ? <Label>{label}</Label> : null}

      <View
        className={[
          "flex-row rounded-control border px-3",
          multiline ? "items-stretch" : "items-center",
        ].join(" ")}
        style={{
          minHeight: fieldMinHeight,
          // The field edge is the only thing marking this as a control, so it
          // carries the raised `input` token (3:1) rather than the hairline.
          borderColor: error ? colors.destructive : focused ? colors.link : colors.input,
          borderWidth: 1.5,
          // A field is a well, not a card: it sits a shade BELOW the surface
          // around it rather than level with it, which is what stops a form
          // reading as a stack of identical white boxes.
          backgroundColor: mix(colors.card, colors.foreground, resolved === "dark" ? 0.035 : 0.015),
        }}
      >
        {icon ? (
          <View className="mr-2 items-center justify-center" accessibilityElementsHidden>
            {icon}
          </View>
        ) : null}

        <TextInput
          {...rest}
          ref={inputRef}
          // The visible Label is a sibling, not a <label for>, so without this
          // a screen reader reaches the field and announces nothing.
          accessibilityLabel={rest.accessibilityLabel ?? label}
          secureTextEntry={secure && !revealed}
          onFocus={(event) => {
            setFocused(true);
            rest.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            rest.onBlur?.(event);
          }}
          placeholderTextColor={colors.mutedForeground}
          textAlignVertical={multiline ? "top" : "center"}
          style={
            multiline
              ? { minHeight: Math.max(fieldMinHeight - 3, MIN_TAP), alignSelf: "stretch" }
              : undefined
          }
          className="flex-1 border-0 bg-transparent py-2.5 font-body text-[16px] text-foreground outline-none"
        />

        {secure ? (
          <Pressable
            onPress={() => setRevealed((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            style={{ minHeight: MIN_TAP, minWidth: MIN_TAP }}
            className="items-center justify-center"
          >
            {revealed ? (
              <EyeOff size={20} color={colors.mutedForeground} />
            ) : (
              <Eye size={20} color={colors.mutedForeground} />
            )}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Muted className="text-destructive">{error}</Muted>
      ) : hint ? (
        <Muted>{hint}</Muted>
      ) : null}
    </View>
  );
}
