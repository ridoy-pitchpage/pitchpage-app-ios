import { useMemo, useState } from "react";
import { Pressable, View, type DimensionValue, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Check } from "lucide-react-native";

import { Body, Muted } from "@/components/Text";
import { encodeStyleSelection, STYLE_CATEGORY_LABELS, type StyleFamily } from "@/page/style-families";
import { themeForTemplate } from "@/render/template-theme";
import { TEMPLATE_THUMBNAILS } from "@/page/template-thumbnails";
import { useColors } from "@/theme/ThemeProvider";
import { GRID, columnSpan } from "@/theme/tokens";

/**
 * A grid of styles.
 *
 * Shared by the builder's picker and the Examples screen so the two can never
 * show a different set or a different swatch.
 */
export function StyleGallery({
  families,
  selectedId,
  onSelect,
  footer,
  action = "select",
}: {
  families: readonly StyleFamily[];
  selectedId?: string;
  onSelect: (family: StyleFamily) => void;
  /** Optional second line under the name. */
  footer?: (family: StyleFamily) => string;
  /**
   * What a tap does. "select" settles the choice here, which is a radio to
   * VoiceOver; "open" goes somewhere else, which is a button. The template
   * picker opens a preview, and calling that a radio would promise a choice
   * the tap does not actually make.
   */
  action?: "select" | "open";
}) {
  const colors = useColors();
  // Measured rather than taken from the window: this grid is rendered inside
  // a screen with 16pt margins in one place and inside a sheet in another,
  // and a card sized from the window overflows the narrower of the two.
  const [available, setAvailable] = useState(0);
  // Two of the four columns, plus the gutter between them: two cards and one
  // gutter then fill the row exactly.
  const cardWidth = available > 0 ? columnSpan(available, 2) : 0;

  return (
    <View
      onLayout={(event) => setAvailable(event.nativeEvent.layout.width)}
      className="flex-row flex-wrap"
      style={{ gap: GRID.gutter }}
    >
      {families.map((family) => {
        const selected = family.id === selectedId;
        return (
          <Pressable
            key={family.id}
            onPress={() => onSelect(family)}
            accessibilityRole={action === "select" && selectedId !== undefined ? "radio" : "button"}
            accessibilityState={
              action === "select" && selectedId !== undefined ? { selected } : undefined
            }
            accessibilityLabel={[
              `${family.label}, ${STYLE_CATEGORY_LABELS[family.category]}`,
              // The tick is the only thing marking the current one, and a tick
              // is not announced.
              action === "open" && selected ? ", your current template" : "",
            ].join("")}
            // Before the first layout there is nothing to derive from, so the
            // old proportion stands in for one frame.
            style={cardWidth > 0 ? { width: cardWidth } : { flexBasis: "47%", flexGrow: 1 }}
            className={[
              "overflow-hidden rounded-card border",
              selected ? "border-primary" : "border-border",
            ].join(" ")}
          >
            {/*
              The real page, photographed from the website. The swatch below is
              the fallback for a family whose thumbnail has not been generated
              yet — better a rough shape than an empty card.
            */}
            {TEMPLATE_THUMBNAILS[family.id] ? (
              <Image
                source={TEMPLATE_THUMBNAILS[family.id]}
                style={{ width: "100%", aspectRatio: 4 / 3 }}
                contentFit="cover"
                // The top of a page is what distinguishes it; the footer is
                // the same everywhere.
                contentPosition="top"
                transition={120}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            ) : (
              <StyleSwatch family={family} />
            )}
            <View className="gap-0.5 px-2 py-2">
              <View className="flex-row items-center gap-1">
                <Body numberOfLines={1} className="min-w-0 flex-1 text-[14px]">
                  {family.label}
                </Body>
                {selected ? <Check size={15} color={colors.primary} /> : null}
              </View>
              {footer ? <Muted numberOfLines={1} className="text-[11px]">{footer(family)}</Muted> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * A miniature of one style, in ITS OWN default colour and mode.
 *
 * Not the currently-picked colour: rendering thirty cards in one accent on one
 * ground makes them near-identical, which defeats the point of a picker. Each
 * card shows what that style is, and in the builder the live page behind the
 * sheet shows what the current choice actually looks like — the better preview
 * anyway.
 *
 * The shapes differ per archetype rather than being the same three bars tinted
 * differently, because the layout is most of what distinguishes these.
 */
export function StyleSwatch({ family }: { family: StyleFamily }) {
  const theme = useMemo(
    () => themeForTemplate(encodeStyleSelection(family.id, family.defaultColor, family.defaultMode)),
    [family],
  );

  const line = (width: DimensionValue, color: string, height = 3, extra: ViewStyle = {}) => (
    <View style={{ height, width, backgroundColor: color, borderRadius: 1, ...extra }} />
  );

  return (
    <View
      style={{ height: 96, backgroundColor: theme.ground, padding: 11, justifyContent: "center", gap: 5 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
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
