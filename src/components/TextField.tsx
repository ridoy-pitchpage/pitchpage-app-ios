import { useState } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

import { Label, Muted } from "./Text";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP } from "@/theme/tokens";

type Props = Omit<TextInputProps, "style"> & {
  label?: string;
  hint?: string;
  error?: string | null;
  /** Adds the show/hide control and starts obscured. */
  secure?: boolean;
  /** For a multiline field: how tall it starts. */
  minHeight?: number;
  className?: string;
};

export function TextField({ label, hint, error, secure = false, minHeight, className, ...rest }: Props) {
  const colors = useColors();
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View className={["gap-1.5", className ?? ""].join(" ")}>
      {label ? <Label>{label}</Label> : null}

      <View
        className="flex-row items-center rounded-control border bg-card px-3"
        style={{
          minHeight: minHeight ?? MIN_TAP,
          // The field edge is the only thing marking this as a control, so it
          // carries the raised `input` token (3:1) rather than the hairline.
          borderColor: error ? colors.destructive : focused ? colors.ring : colors.input,
          borderWidth: focused || error ? 2 : 1,
        }}
      >
        <TextInput
          {...rest}
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
          textAlignVertical={rest.multiline ? "top" : "center"}
          className="flex-1 py-2.5 font-body text-[16px] text-foreground"
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
