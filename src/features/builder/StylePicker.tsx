import { useMemo, useState } from "react";
import { Pressable, ScrollView, View, type DimensionValue, type ViewStyle } from "react-native";
import { Check } from "lucide-react-native";

import { Sheet } from "@/components/Sheet";
import { Segmented } from "@/components/Select";
import { Body, Muted } from "@/components/Text";
import { useDraft } from "@/state/draft-store";
import {
  COLOR_PRESETS,
  encodeStyleSelection,
  KIND_TO_CATEGORY,
  resolveStyle,
  STYLE_CATEGORY_LABELS,
  STYLE_FAMILIES,
  type StyleFamily,
} from "@/page/style-families";
import { themeForTemplate } from "@/render/template-theme";
import { currentPitchKind } from "@/page/apply-kind";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP } from "@/theme/tokens";

/**
 * Picking a style: the family, then its colour, then light or dark.
 *
 * Each family shows a small live swatch drawn with the same renderer the page
 * uses, so what is on the card is what the page becomes. The web ships 240px
 * screenshots per family; a real miniature is both smaller to carry and always
 * current.
 *
 * Colour circles are 34pt. The web's are 14px, which is not a hittable target.
 */
export function StylePicker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const page = useDraft((s) => s.page);
  const patch = useDraft((s) => s.patch);

  const current = useMemo(() => resolveStyle(page?.template), [page?.template]);
  const pitchKind = currentPitchKind(page?.wizard_meta);
  const [tab, setTab] = useState<"style" | "colour">("style");

  if (!page) return null;

  /** Families the page's own kind suits first, then the rest. */
  const preferred = KIND_TO_CATEGORY[pitchKind ?? "other"];
  const ordered = [...STYLE_FAMILIES].sort((a, b) => {
    const aPref = a.category === preferred ? 0 : 1;
    const bPref = b.category === preferred ? 0 : 1;
    return aPref - bPref;
  });

  function choose(family: StyleFamily) {
    // Keep the colour when the family changes, so switching style does not
    // silently undo a colour choice.
    const colour = current.color.id;
    patch({
      template: encodeStyleSelection(
        family.id,
        colour,
        family.supportsMode ? current.mode : family.defaultMode,
      ),
    });
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Style" maxHeightRatio={0.6}>
      <Segmented
        value={tab}
        options={[
          { value: "style", label: "Style" },
          { value: "colour", label: "Colour" },
        ]}
        onChange={(next) => setTab(next)}
      />

      {tab === "style" ? (
        <View className="gap-3 pt-3">
          {current.family.supportsMode ? (
            <Segmented
              label="Light or dark"
              value={current.mode}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
              onChange={(mode) =>
                patch({
                  template: encodeStyleSelection(current.family.id, current.color.id, mode),
                })
              }
            />
          ) : (
            <Muted>{current.family.label} comes in one mode only.</Muted>
          )}

          <View className="flex-row flex-wrap" style={{ gap: 10 }}>
            {ordered.map((family) => {
              const selected = family.id === current.family.id;
              return (
                <Pressable
                  key={family.id}
                  onPress={() => choose(family)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${family.label}, ${STYLE_CATEGORY_LABELS[family.category]}`}
                  style={{ flexBasis: "47%", flexGrow: 1 }}
                  className={[
                    "overflow-hidden rounded-card border",
                    selected ? "border-primary" : "border-border",
                  ].join(" ")}
                >
                  <StyleSwatch family={family} />
                  <View className="flex-row items-center gap-1 px-2 py-2">
                    <Body numberOfLines={1} className="min-w-0 flex-1 text-[14px]">
                      {family.label}
                    </Body>
                    {selected ? <Check size={15} color={colors.primary} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <View className="gap-3 pt-3">
          <Muted>The one colour that carries your style.</Muted>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 10, paddingVertical: 4 }}>
              {COLOR_PRESETS.map((preset) => {
                const selected = preset.id === current.color.id;
                return (
                  <Pressable
                    key={preset.id}
                    onPress={() =>
                      patch({
                        template: encodeStyleSelection(
                          current.family.id,
                          preset.id,
                          current.family.supportsMode ? current.mode : null,
                        ),
                      })
                    }
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={preset.label}
                    style={{ width: MIN_TAP, height: MIN_TAP }}
                    className="items-center justify-center"
                  >
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: preset.hex,
                        borderWidth: selected ? 3 : 1,
                        borderColor: selected ? colors.foreground : colors.border,
                      }}
                    />
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          <Body>{current.color.label}</Body>
        </View>
      )}
    </Sheet>
  );
}

/**
 * A miniature of one style, in ITS OWN default colour and mode.
 *
 * Not the currently-picked colour: rendering thirty cards in one accent on one
 * ground makes them near-identical, which defeats the point of a picker. Each
 * card shows what that style is, and the live page behind the sheet shows what
 * the current choice actually looks like — which is the better preview anyway.
 *
 * The shapes differ per archetype rather than being the same three bars tinted
 * differently, because the layout is most of what distinguishes these.
 */
function StyleSwatch({ family }: { family: StyleFamily }) {
  const theme = useMemo(
    () => themeForTemplate(encodeStyleSelection(family.id, family.defaultColor, family.defaultMode)),
    [family],
  );

  const line = (width: DimensionValue, color: string, height = 3, extra: ViewStyle = {}) => (
    <View style={{ height, width, backgroundColor: color, borderRadius: 1, ...extra }} />
  );

  return (
    <View style={{ height: 96, backgroundColor: theme.ground, padding: 11, justifyContent: "center", gap: 5 }}>
      {theme.archetype === "editorial" ? (
        <>
          {line("38%", theme.accent, 2)}
          {line("72%", theme.ink, 9)}
          <View style={{ height: 1, backgroundColor: theme.line, marginVertical: 3 }} />
          {line("88%", theme.inkMuted, 2.5, { opacity: 0.6 })}
          {line("64%", theme.inkMuted, 2.5, { opacity: 0.6 })}
        </>
      ) : null}

      {theme.archetype === "bold" ? (
        <>
          {line("84%", theme.ink, 13)}
          {line("52%", theme.ink, 13)}
          <View style={{ height: 6, width: "34%", backgroundColor: theme.accent, marginTop: 3 }} />
        </>
      ) : null}

      {theme.archetype === "console" ? (
        <>
          <View className="flex-row" style={{ gap: 4, alignItems: "center" }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: theme.accent }} />
            {line("44%", theme.ink, 5)}
          </View>
          {line("80%", theme.inkMuted, 2.5, { opacity: 0.7 })}
          {line("66%", theme.inkMuted, 2.5, { opacity: 0.7 })}
          {line("30%", theme.accent, 2.5)}
        </>
      ) : null}

      {theme.archetype === "soft" ? (
        <>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: theme.surface }} />
            {line("48%", theme.ink, 7)}
          </View>
          <View style={{ backgroundColor: theme.surface, borderRadius: 7, padding: 7, gap: 4, marginTop: 2 }}>
            {line("74%", theme.inkMuted, 2.5, { opacity: 0.65 })}
            {line("40%", theme.accent, 2.5)}
          </View>
        </>
      ) : null}

      {theme.archetype === "minimal" ? (
        <>
          {line("56%", theme.ink, 7)}
          <View style={{ height: 1, width: "22%", backgroundColor: theme.accent, marginVertical: 6 }} />
          {line("70%", theme.inkMuted, 2, { opacity: 0.55 })}
        </>
      ) : null}
    </View>
  );
}
