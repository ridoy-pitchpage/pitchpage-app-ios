import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Pencil } from "lucide-react-native";

import { BlockBody, SectionHeading } from "./blocks";
import { Reveal } from "./Reveal";
import { RADIUS_FOR, TYPE_SPECS, themeForTemplate, type TemplateTheme } from "./template-theme";
import { MAX_SECTIONS, sectionsForLayout, type PageSection } from "@/page/page-sections";
import type { PageModel } from "@/page/page-model";
import { SITE_URL } from "@/lib/config";
import { MIN_TAP } from "@/theme/tokens";

/**
 * A pitch page, drawn natively.
 *
 * This exists because of a gap in the web builder rather than to duplicate it:
 * there, the live preview is a desktop-only column, so someone building a page
 * on a phone cannot see it at all while they work. Here the page is the screen,
 * and editing happens over it.
 *
 * In edit mode every section carries a light, permanent affordance. Hover does
 * not exist on a touch screen, so the web's hover outline would mean the first
 * tap fires blind; a visible dotted edge and a pencil chip say "tappable"
 * before anything is touched.
 */

/** Page data holds relative paths like `/people/x.webp`, served by the site. */
function absoluteUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function PageRender({
  page,
  editable = false,
  onEditSection,
  onEditHero,
  /** Drawn above the page — used by the builder for its toolbar. */
  header,
  /** Extra space at the bottom, so a sheet does not cover the last section. */
  bottomInset = 0,
  onAddSection,
}: {
  page: PageModel;
  editable?: boolean;
  onEditSection?: (section: PageSection) => void;
  onEditHero?: () => void;
  header?: React.ReactNode;
  bottomInset?: number;
  /** Offered at the end of the page while editing. */
  onAddSection?: () => void;
}) {
  const theme = useMemo(() => themeForTemplate(page.template), [page.template]);
  const sections = useMemo(() => sectionsForLayout(page), [page]);
  const spec = TYPE_SPECS[theme.archetype];

  const portrait = absoluteUrl(page.portrait_url);
  const hero = absoluteUrl(page.hero_image_url);
  // A portrait that fails to load should leave nothing behind. An empty box
  // where a face should be reads as a broken page, which is worse than no
  // portrait at all.
  const [portraitFailed, setPortraitFailed] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: theme.ground }}>
      {header}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomInset + 48 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {hero ? (
          <Image
            source={{ uri: hero }}
            style={{ width: "100%", height: 160 }}
            contentFit="cover"
            transition={200}
          />
        ) : null}

        {/*
          The horizontal padding sits OUTSIDE the editable region. The region
          pulls itself 8pt wider so its dashed edge sits just outside the text,
          and with the padding inside that widening would push it past the
          screen.
        */}
        <View style={{ paddingHorizontal: 20, paddingTop: hero ? 20 : 32 }}>
          <EditableRegion
            editable={editable}
            onPress={onEditHero}
            theme={theme}
            label="Edit your details"
          >
            <View style={{ gap: 12 }}>
            {portrait && !portraitFailed ? (
              <Image
                source={{ uri: portrait }}
                onError={() => setPortraitFailed(true)}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: theme.archetype === "soft" ? 44 : 4,
                  backgroundColor: theme.surface,
                }}
                contentFit="cover"
                transition={200}
                accessibilityLabel={`Portrait of ${page.full_name ?? "the page owner"}`}
              />
            ) : null}

            <Text
              style={{
                color: theme.ink,
                fontFamily: spec.displayFamily,
                // Long names get a smaller size rather than a broken line.
                fontSize: (page.full_name ?? "").length > 18 ? 30 : 38,
                lineHeight: (page.full_name ?? "").length > 18 ? 36 : 44,
                letterSpacing: spec.displayTracking,
                textTransform: spec.displayUppercase ? "uppercase" : "none",
              }}
            >
              {page.full_name || "Your name"}
            </Text>

            {page.headline?.trim() ? (
              <Text
                style={{
                  color: theme.accentText,
                  fontFamily: spec.bodyFamily,
                  fontSize: 16,
                  lineHeight: 23,
                }}
              >
                {page.headline}
              </Text>
            ) : null}

            {page.bio?.trim() ? (
              <Text
                style={{
                  color: theme.ink,
                  fontFamily: spec.bodyFamily,
                  fontSize: 15,
                  lineHeight: 24,
                }}
              >
                {page.bio}
              </Text>
            ) : null}

            {page.location?.trim() || page.email?.trim() ? (
              <Text style={{ color: theme.inkMuted, fontFamily: spec.bodyFamily, fontSize: 13 }}>
                {[page.location, page.email].filter(Boolean).join("  ·  ")}
              </Text>
            ) : null}

              {/* The accent hairline every editorial family uses under the name. */}
              <View style={{ height: 2, width: 64, backgroundColor: theme.accent, marginTop: 4 }} />
            </View>
          </EditableRegion>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 28, gap: 28 }}>
          {sections.map((section, index) => (
            <Reveal key={section.id} index={index}>
              <EditableRegion
                editable={editable}
                onPress={() => onEditSection?.(section)}
                theme={theme}
                label={`Edit ${section.title || "this section"}`}
              >
                <View>
                  {section.title?.trim() ? (
                    <SectionHeading theme={theme}>{section.title}</SectionHeading>
                  ) : null}
                  <BlockBody section={section} theme={theme} />
                </View>
              </EditableRegion>
            </Reveal>
          ))}

          {/*
            A page with two sections used to end in a screenful of empty
            ground, with the only way to add anything hidden in the toolbar.
            The invitation now sits where the eye already is — at the end of
            what you have written — and is drawn in the page's own theme
            rather than the app's, because it is standing in for the section
            it would create.

            It is not shown once the page is full: an affordance that cannot
            do anything is worse than none.
          */}
          {/*
            Preview mode gets words instead of a control: there is nothing to
            tap here, but a page that is genuinely empty must not preview as a
            blank screen that reads as broken.
          */}
          {!editable && sections.length === 0 ? (
            <Text
              style={{
                color: theme.inkMuted,
                fontFamily: spec.bodyFamily,
                fontSize: 15,
                lineHeight: 23,
              }}
            >
              Nothing on your page yet. Add a section and it appears here.
            </Text>
          ) : null}

          {editable && onAddSection && sections.length < MAX_SECTIONS ? (
            <Pressable
              onPress={onAddSection}
              accessibilityRole="button"
              accessibilityLabel={
                sections.length === 0
                  ? "Add your first section"
                  : "Add another section to your page"
              }
              style={({ pressed }) => ({
                minHeight: MIN_TAP,
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                paddingVertical: 22,
                borderRadius: RADIUS_FOR[theme.archetype],
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: theme.line,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                style={{
                  color: theme.accentText,
                  fontFamily: spec.bodyFamily,
                  fontSize: 15,
                  lineHeight: 23,
                }}
              >
                + Add a section
              </Text>
              {sections.length === 0 ? (
                <Text
                  style={{
                    color: theme.inkMuted,
                    fontFamily: spec.bodyFamily,
                    fontSize: 13,
                    lineHeight: 19,
                    textAlign: "center",
                  }}
                >
                  Nothing on your page yet — whatever you add appears here.
                </Text>
              ) : null}
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Wraps a tappable part of the page while editing. Outside edit mode it adds
 * nothing at all — not a wrapper view, not a press target — so the preview is
 * exactly what a visitor would see.
 */
function EditableRegion({
  editable,
  onPress,
  theme,
  label,
  children,
}: {
  editable: boolean;
  onPress?: () => void;
  theme: TemplateTheme;
  label: string;
  children: React.ReactNode;
}) {
  if (!editable || !onPress) return <>{children}</>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Opens the editor for this part of your page"
      style={({ pressed }) => ({
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: pressed ? theme.accent : theme.line,
        borderRadius: 8,
        marginHorizontal: -8,
        paddingHorizontal: 8,
        paddingVertical: 8,
        backgroundColor: pressed ? `${theme.accent}14` : "transparent",
      })}
    >
      {children}
      <View
        style={{
          position: "absolute",
          top: 4,
          right: 4,
          backgroundColor: theme.accent,
          borderRadius: 999,
          padding: 4,
        }}
      >
        <Pencil size={11} color={theme.onAccent} />
      </View>
    </Pressable>
  );
}
