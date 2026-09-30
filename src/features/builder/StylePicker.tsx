import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { Sheet } from "@/components/Sheet";
import { Segmented } from "@/components/Select";
import { Body, Muted } from "@/components/Text";
import { useDraft } from "@/state/draft-store";
import {
  COLOR_PRESETS,
  encodeStyleSelection,
  KIND_TO_CATEGORY,
  resolveStyle,
  STYLE_FAMILIES,
  type StyleFamily,
} from "@/page/style-families";
import { StyleGallery } from "./StyleGallery";
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

          <StyleGallery
            families={ordered}
            selectedId={current.family.id}
            onSelect={choose}
          />
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
