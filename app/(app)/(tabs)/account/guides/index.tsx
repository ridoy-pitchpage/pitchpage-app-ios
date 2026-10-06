import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";

import { BackButton } from "@/components/BackButton";
import { Card } from "@/components/Card";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H3, Muted } from "@/components/Text";
import { APP_GUIDE_PAGES } from "@/content/guide-app-copy";
import { GUIDE_CATEGORIES, type GuideCategory } from "@/content/guide-pages";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP } from "@/theme/tokens";

/**
 * The guides hub.
 *
 * These fifteen articles used to be a link out to the website, which meant
 * leaving the app to read something the app already had — the copy is static
 * and ships in the bundle, so it reads offline and in the app's own type and
 * colours.
 *
 * "All" is the default rather than the first category: fifteen items is a
 * short enough list to scan whole, and starting on a filter hides two thirds
 * of it for no reason.
 */

const ALL = "All" as const;
type Filter = typeof ALL | GuideCategory;

const GUIDES = Object.values(APP_GUIDE_PAGES);

export default function GuidesScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<Filter>(ALL);

  const shown = filter === ALL ? GUIDES : GUIDES.filter((g) => g.category === filter);
  const filters: Filter[] = [ALL, ...GUIDE_CATEGORIES];

  return (
    <Screen edges={["top"]}>
      <ScreenScroll contentClassName="pt-2 gap-5">
        <BackButton />

        <View className="gap-2">
          <H1>Guides</H1>
          <Muted>
            How to put a page together, what to send instead of a resume, and how PitchPage compares
            to the other tools. {GUIDES.length} to read, all offline.
          </Muted>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {filters.map((name) => {
            const on = filter === name;
            return (
              <Pressable
                key={name}
                onPress={() => setFilter(name)}
                accessibilityRole="button"
                accessibilityLabel={`Show ${name === ALL ? "all guides" : name}`}
                accessibilityState={{ selected: on }}
                style={{ minHeight: MIN_TAP }}
                className={[
                  "justify-center rounded-control border px-3",
                  on ? "border-foreground bg-foreground" : "border-border bg-card",
                ].join(" ")}
              >
                {/*
                  The colour is a style, not a class. Body already sets
                  text-foreground, and Tailwind emits its utilities in config
                  order, so `text-background` passed in here loses the tie and
                  the selected chip renders its label in the same colour as its
                  own fill — invisible. A style always wins, on web and native
                  alike.
                */}
                <Body
                  className={on ? "font-body-medium" : ""}
                  style={{ color: on ? colors.background : colors.foreground }}
                >
                  {name}
                </Body>
              </Pressable>
            );
          })}
        </View>

        <View className="gap-2">
          {shown.map((guide) => (
            <Card key={guide.slug} className="p-0">
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(app)/(tabs)/account/guides/[slug]",
                    params: { slug: guide.slug },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={guide.h1}
                style={{ minHeight: MIN_TAP }}
                className="flex-row items-center gap-3 px-4 py-3"
              >
                <View className="min-w-0 flex-1 gap-1">
                  <Muted className="uppercase">{guide.category}</Muted>
                  <H3>{guide.h1}</H3>
                  <Muted numberOfLines={2}>{guide.metaDescription}</Muted>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
              </Pressable>
            </Card>
          ))}
        </View>
      </ScreenScroll>
    </Screen>
  );
}
