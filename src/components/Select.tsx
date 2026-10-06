import { useState } from "react";
import { Pressable, View } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";

import { Sheet } from "./Sheet";
import { Body, Label, Muted } from "./Text";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP } from "@/theme/tokens";

export type SelectOption<T extends string> = { value: T; label: string; hint?: string };

/**
 * A single choice from a list.
 *
 * A sheet rather than the web's inline dropdown: option lists here run to
 * nineteen sports and sixteen trades, and a native list is scrollable,
 * reachable one-handed and readable at the largest text size.
 */
export function Select<T extends string>({
  label,
  placeholder = "Choose one",
  value,
  options,
  onChange,
  hint,
}: {
  label?: string;
  placeholder?: string;
  value: T | null | undefined;
  options: ReadonlyArray<SelectOption<T>>;
  onChange: (value: T) => void;
  hint?: string;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View className="gap-1.5">
      {label ? <Label>{label}</Label> : null}

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}. ${selected?.label ?? placeholder}` : undefined}
        accessibilityState={{ expanded: open }}
        style={{ minHeight: 52, borderColor: colors.input }}
        className="flex-row items-center justify-between rounded-control border bg-card px-3 py-2.5"
      >
        <Body
          className={selected ? "min-w-0 flex-1" : "min-w-0 flex-1 text-muted-foreground"}
        >
          {selected?.label ?? placeholder}
        </Body>
        <ChevronDown size={20} color={colors.mutedForeground} />
      </Pressable>

      {hint ? <Muted>{hint}</Muted> : null}

      <Sheet visible={open} onClose={() => setOpen(false)} title={label ?? placeholder}>
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              style={{ minHeight: MIN_TAP }}
              className="flex-row items-center justify-between gap-3 border-b border-border py-3"
            >
              <View className="min-w-0 flex-1">
                <Body>{option.label}</Body>
                {option.hint ? <Muted>{option.hint}</Muted> : null}
              </View>
              {isSelected ? <Check size={20} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </Sheet>
    </View>
  );
}

/**
 * Two to four choices, all visible at once. For anything longer, or where the
 * options need explaining, use Select.
 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: ReadonlyArray<SelectOption<T>>;
  onChange: (value: T) => void;
}) {
  return (
    <View className="gap-1.5">
      {label ? <Label>{label}</Label> : null}
      <View className="flex-row rounded-control border border-border bg-card p-1">
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={option.label}
              style={{ minHeight: MIN_TAP }}
              className={[
                "flex-1 items-center justify-center rounded-[10px] px-2 py-2",
                isSelected ? "bg-primary" : "bg-transparent",
              ].join(" ")}
            >
              <Body
                className={isSelected ? "text-center text-primary-foreground" : "text-center text-foreground"}
              >
                {option.label}
              </Body>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
