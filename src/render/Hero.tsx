import { Text, View } from "react-native";
import { Image } from "expo-image";

import { RADIUS_FOR, type TemplateTheme, type TypeSpec } from "./template-theme";
import type { PageModel } from "@/page/page-model";

/**
 * The top of a page, drawn the way its own family opens.
 *
 * Archetypes alone put thirteen families on one treatment and nine on
 * another, so twenty-two of the thirty templates opened identically and the
 * builder could not show which one had been chosen. Where the name sits, and
 * whether it is reversed out of a band or ruled like a letterhead, is the
 * first thing anyone notices about a page — so it is picked per family here
 * rather than per archetype.
 *
 * This is still not the website's own layout. Matching that needs the render
 * surface in MASTER_PLAN §14, which does not exist yet; see
 * docs/app-render-spec.md. What this does is stop two different templates
 * from looking like the same one.
 *
 * The pieces below are functions returning elements rather than components,
 * because a component declared inside a render is a new type on every pass:
 * React would unmount and remount the subtree each time, losing image state.
 */
export function Hero({
  page,
  theme,
  spec,
  portrait,
  portraitFailed,
  onPortraitError,
}: {
  page: PageModel;
  theme: TemplateTheme;
  spec: TypeSpec;
  portrait: string | null;
  portraitFailed: boolean;
  onPortraitError: () => void;
}) {
  const name = page.full_name || "Your name";
  const meta = [page.location, page.email].filter(Boolean).join("  ·  ");
  const hasPortrait = Boolean(portrait) && !portraitFailed;

  function portraitAt(size: number, round: number) {
    if (!hasPortrait) return null;
    return (
      <Image
        source={{ uri: portrait as string }}
        onError={onPortraitError}
        style={{ width: size, height: size, borderRadius: round, backgroundColor: theme.surface }}
        contentFit="cover"
        transition={200}
        accessibilityLabel={`Portrait of ${page.full_name ?? "the page owner"}`}
      />
    );
  }

  function nameAt(size: number, align: "left" | "center" = "left", upper = spec.displayUppercase) {
    const long = name.length > 18;
    return (
      <Text
        style={{
          color: theme.ink,
          fontFamily: spec.displayFamily,
          // A long name takes a smaller size rather than a broken line.
          fontSize: long ? size - 8 : size,
          lineHeight: long ? size - 1 : size + 6,
          letterSpacing: spec.displayTracking,
          textTransform: upper ? "uppercase" : "none",
          textAlign: align,
        }}
      >
        {name}
      </Text>
    );
  }

  function headlineIn(color: string, align: "left" | "center" = "left") {
    if (!page.headline?.trim()) return null;
    return (
      <Text
        style={{ color, fontFamily: spec.bodyFamily, fontSize: 16, lineHeight: 23, textAlign: align }}
      >
        {page.headline}
      </Text>
    );
  }

  function bodyText(align: "left" | "center" = "left") {
    if (!page.bio?.trim()) return null;
    return (
      <Text
        style={{
          color: theme.ink,
          fontFamily: spec.bodyFamily,
          fontSize: 15,
          lineHeight: 24,
          textAlign: align,
        }}
      >
        {page.bio}
      </Text>
    );
  }

  function metaText(align: "left" | "center" = "left") {
    if (!meta) return null;
    return (
      <Text
        style={{ color: theme.inkMuted, fontFamily: spec.bodyFamily, fontSize: 13, textAlign: align }}
      >
        {meta}
      </Text>
    );
  }

  switch (theme.hero) {
    /* The name reversed out of a full-width band of the family's colour. */
    case "banner":
      return (
        <View style={{ gap: 12 }}>
          <View
            style={{
              // Pulled out to the screen edges: the band is the point, and a
              // band with a margin around it reads as a card.
              marginHorizontal: -20,
              marginTop: -8,
              backgroundColor: theme.accent,
              paddingHorizontal: 20,
              paddingVertical: 22,
              gap: 10,
            }}
          >
            {portraitAt(64, 32)}
            <Text
              style={{
                color: theme.onAccent,
                fontFamily: spec.displayFamily,
                fontSize: name.length > 18 ? 28 : 34,
                lineHeight: name.length > 18 ? 34 : 40,
                letterSpacing: spec.displayTracking,
                textTransform: spec.displayUppercase ? "uppercase" : "none",
              }}
            >
              {name}
            </Text>
            {headlineIn(theme.onAccent)}
          </View>
          {bodyText()}
          {metaText()}
        </View>
      );

    /* Centred and ruled, the way a letter opens. */
    case "letterhead":
      return (
        <View style={{ gap: 12, alignItems: "center" }}>
          {portraitAt(72, 36)}
          <View style={{ height: 1, width: "100%", backgroundColor: theme.line }} />
          {nameAt(32, "center")}
          {headlineIn(theme.accentText, "center")}
          <View style={{ height: 1, width: "100%", backgroundColor: theme.line }} />
          {bodyText("center")}
          {metaText("center")}
        </View>
      );

    /* Oversized capitals over a slab of colour. */
    case "poster":
      return (
        <View style={{ gap: 12 }}>
          {nameAt(48, "left", true)}
          <View style={{ height: 10, width: "42%", backgroundColor: theme.accent }} />
          {headlineIn(theme.ink)}
          {portraitAt(96, RADIUS_FOR[theme.archetype])}
          {bodyText()}
          {metaText()}
        </View>
      );

    /* Portrait beside the name rather than above it. */
    case "split":
      return (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            {portraitAt(84, RADIUS_FOR[theme.archetype])}
            <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
              {nameAt(28)}
              {headlineIn(theme.accentText)}
            </View>
          </View>
          <View style={{ height: 2, width: 64, backgroundColor: theme.accent }} />
          {bodyText()}
          {metaText()}
        </View>
      );

    /* A centred portrait inside a ring of the family's colour. */
    case "ring":
      return (
        <View style={{ gap: 12, alignItems: "center" }}>
          {hasPortrait ? (
            <View style={{ padding: 4, borderRadius: 60, borderWidth: 2, borderColor: theme.accent }}>
              {portraitAt(96, 48)}
            </View>
          ) : (
            <View style={{ height: 2, width: 64, backgroundColor: theme.accent }} />
          )}
          {nameAt(32, "center")}
          {headlineIn(theme.accentText, "center")}
          {bodyText("center")}
          {metaText("center")}
        </View>
      );

    /* A bracketed label and a dashed rule, as a terminal would. */
    case "console":
      return (
        <View style={{ gap: 10 }}>
          <Text
            style={{
              color: theme.accentText,
              fontFamily: spec.bodyFamily,
              fontSize: 12,
              letterSpacing: 1.4,
              textTransform: "uppercase",
            }}
          >
            {`> ${page.headline?.trim() || "profile"}`}
          </Text>
          {nameAt(30)}
          <View style={{ borderTopWidth: 1, borderStyle: "dashed", borderColor: theme.line }} />
          {portraitAt(80, 4)}
          {bodyText()}
          {metaText()}
        </View>
      );

    /* Name, space, and nothing that is not needed. */
    case "plain":
      return (
        <View style={{ gap: 14 }}>
          {portraitAt(64, 32)}
          {nameAt(30)}
          {headlineIn(theme.inkMuted)}
          {bodyText()}
          {metaText()}
        </View>
      );

    /* The accent hairline under the name. */
    case "rule":
    default:
      return (
        <View style={{ gap: 12 }}>
          {portraitAt(88, theme.archetype === "soft" ? 44 : 4)}
          {nameAt(38)}
          {headlineIn(theme.accentText)}
          {bodyText()}
          {metaText()}
          <View style={{ height: 2, width: 64, backgroundColor: theme.accent, marginTop: 4 }} />
        </View>
      );
  }
}
