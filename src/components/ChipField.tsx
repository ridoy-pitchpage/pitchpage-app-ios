import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { X } from "lucide-react-native";

import { Body, Label, Muted } from "./Text";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP } from "@/theme/tokens";

/**
 * A list of short values, entered as chips.
 *
 * The web asks for these in a textarea, one per line. That is a keyboard idiom:
 * on a phone the return key is often "done", autocorrect fights line
 * boundaries, and removing one entry means selecting text. A chip commits on
 * return or comma, backspace removes the last one, and each chip has its own
 * 44pt remove target.
 */
export function ChipField({
  label,
  value,
  onChange,
  placeholder = "Type and press return",
  max,
  maxLength,
  hint,
}: {
  label?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max: number;
  maxLength: number;
  hint?: string;
}) {
  const colors = useColors();
  const [draft, setDraft] = useState("");
  const atMax = value.length >= max;

  function commit(raw: string) {
    // A pasted "a, b, c" becomes three chips rather than one long one.
    const parts = raw
      .split(",")
      .map((part) => part.trim().slice(0, maxLength))
      .filter(Boolean);
    if (parts.length === 0) return;
    onChange([...value, ...parts].slice(0, max));
    setDraft("");
  }

  return (
    <View className="gap-1.5">
      {label ? <Label>{label}</Label> : null}

      {value.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {value.map((chip, index) => (
            <View
              key={`${chip}-${index}`}
              className="flex-row items-center gap-1 rounded-full border border-border bg-muted px-3"
              style={{ minHeight: 36 }}
            >
              <Body className="text-[14px]">{chip}</Body>
              <Pressable
                onPress={() => onChange(value.filter((_, i) => i !== index))}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${chip}`}
                hitSlop={10}
                className="p-1"
              >
                <X size={14} color={colors.mutedForeground} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {atMax ? (
        <Muted>That's the maximum of {max}.</Muted>
      ) : (
        <TextInput
          value={draft}
          onChangeText={(text) => {
            // Committing on comma as well as return means a list can be typed
            // in one go without reaching for the return key each time.
            if (text.endsWith(",")) commit(text);
            else setDraft(text);
          }}
          onSubmitEditing={() => commit(draft)}
          onBlur={() => commit(draft)}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === "Backspace" && draft === "" && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="done"
          blurOnSubmit={false}
          maxLength={maxLength}
          style={{ minHeight: MIN_TAP, borderColor: colors.input }}
          className="rounded-control border bg-card px-3 py-2.5 font-body text-[16px] text-foreground"
        />
      )}

      {hint && !atMax ? <Muted>{hint}</Muted> : null}
    </View>
  );
}

/**
 * A list of longer lines — paragraphs or bullets — each its own field.
 *
 * Same reasoning as the chips: the web's newline-delimited textarea gives no
 * way to reorder or remove one line without text selection.
 */
export function LineList({
  label,
  value,
  onChange,
  placeholder,
  max,
  maxLength,
  multiline = true,
  addLabel = "Add another",
}: {
  label?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max: number;
  maxLength: number;
  multiline?: boolean;
  addLabel?: string;
}) {
  const colors = useColors();
  // Always offer one empty field, so there is somewhere to start typing.
  const rows = value.length > 0 ? value : [""];

  function update(index: number, text: string) {
    const next = [...rows];
    next[index] = text.slice(0, maxLength);
    onChange(next);
  }

  return (
    <View className="gap-2">
      {label ? <Label>{label}</Label> : null}

      {rows.map((line, index) => (
        <View key={index} className="flex-row items-start gap-2">
          <TextInput
            value={line}
            onChangeText={(text) => update(index, text)}
            placeholder={index === 0 ? placeholder : undefined}
            placeholderTextColor={colors.mutedForeground}
            multiline={multiline}
            maxLength={maxLength}
            style={{ minHeight: multiline ? 72 : MIN_TAP, borderColor: colors.input }}
            className="flex-1 rounded-control border bg-card px-3 py-2.5 font-body text-[16px] text-foreground"
            textAlignVertical="top"
          />
          {rows.length > 1 ? (
            <Pressable
              onPress={() => onChange(rows.filter((_, i) => i !== index))}
              accessibilityRole="button"
              accessibilityLabel={`Remove line ${index + 1}`}
              hitSlop={8}
              style={{ minHeight: MIN_TAP, minWidth: MIN_TAP }}
              className="items-center justify-center"
            >
              <X size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      ))}

      {rows.length < max ? (
        <Pressable
          onPress={() => onChange([...rows, ""])}
          accessibilityRole="button"
          accessibilityLabel={addLabel}
          style={{ minHeight: MIN_TAP }}
          className="items-center justify-center rounded-control border border-dashed border-border"
        >
          <Body className="text-primary">{addLabel}</Body>
        </Pressable>
      ) : null}
    </View>
  );
}
