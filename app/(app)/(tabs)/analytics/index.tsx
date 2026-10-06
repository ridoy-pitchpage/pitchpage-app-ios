import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { ChartColumnBig, ChevronRight, FileText } from "lucide-react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { MotionEntrance } from "@/components/MotionEntrance";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H3, Muted } from "@/components/Text";
import { EmptyState, ErrorState, Loading } from "@/components/States";
import { useMyPages } from "@/api/queries";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP, mix } from "@/theme/tokens";

/**
 * Analytics (S79) — which page to look at.
 *
 * A published page is the only one with anything to show: view events are
 * recorded on the public page, so a draft has none by definition. Drafts are
 * still listed, greyed and unpressable, because "my other page isn't here" is
 * a worse question than "that one isn't published yet".
 */
export default function AnalyticsScreen() {
  const colors = useColors();
  const pages = useMyPages();

  if (pages.isPending) {
    return (
      <Screen edges={["top"]}>
        <ScreenScroll contentClassName="pt-3 gap-4" contentContainerStyle={{ paddingBottom: 24 }}>
          <H1>Analytics</H1>
          <Loading label="Loading your pages…" />
        </ScreenScroll>
      </Screen>
    );
  }

  if (pages.isError) {
    return (
      <Screen edges={["top"]}>
        <ScreenScroll contentClassName="pt-3 gap-4" contentContainerStyle={{ paddingBottom: 24 }}>
          <H1>Analytics</H1>
          <ErrorState error={pages.error} onRetry={() => void pages.refetch()} />
        </ScreenScroll>
      </Screen>
    );
  }

  const all = pages.data ?? [];
  const live = all.filter((page) => page.published_at != null);
  const drafts = all.filter((page) => page.published_at == null);

  return (
    <Screen edges={["top"]}>
      <ScreenScroll contentClassName="pt-3 gap-5" contentContainerStyle={{ paddingBottom: 24 }}>
        <MotionEntrance className="gap-1">
          <Muted className="font-body-bold text-[11px] tracking-[1.5px]" style={{ color: colors.primary }}>
            YOUR REACH
          </Muted>
          <H1>Analytics</H1>
          <Muted>See what happens after you share.</Muted>
        </MotionEntrance>

        {live.length > 0 ? (
          <MotionEntrance index={1}>
            <Card className="flex-row items-center gap-4">
              <View
                className="h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: mix(colors.card, colors.primary, 0.1) }}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <ChartColumnBig size={23} color={colors.primary} />
              </View>
              <View className="min-w-0 flex-1 gap-1">
                <H3>{live.length} {live.length === 1 ? "page" : "pages"} out in the world</H3>
                <Muted>Choose a page below to explore its visits.</Muted>
              </View>
            </Card>
          </MotionEntrance>
        ) : null}

        {all.length === 0 ? (
          <EmptyState
            title="No pages yet"
            body="Create and publish your first page, then explore the visits it receives."
            icon={<FileText size={28} color={colors.primary} />}
            action={<Button title="Go to your pages" onPress={() => router.push("/(app)/(tabs)/pages")} />}
          />
        ) : null}

        {live.length > 0 ? (
          <View className="gap-2">
            <H3>Published pages</H3>
            {live.map((page, index) => (
              <MotionEntrance key={page.id} index={index + 2}>
              <Card className="p-0">
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/(tabs)/analytics/[id]",
                      params: { id: page.id },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Analytics for ${page.full_name || "your page"}`}
                  style={{ minHeight: MIN_TAP }}
                  className="flex-row items-center gap-3 px-4 py-4"
                >
                  <View
                    className="h-11 w-11 shrink-0 items-center justify-center rounded-control"
                    style={{ backgroundColor: mix(colors.card, colors.primary, 0.08) }}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    <ChartColumnBig size={20} color={colors.primary} />
                  </View>
                  <View className="min-w-0 flex-1 gap-0.5">
                    <H3>{page.full_name || "Untitled page"}</H3>
                    {page.headline ? <Muted>{page.headline}</Muted> : null}
                  </View>
                  <ChevronRight size={18} color={colors.mutedForeground} />
                </Pressable>
              </Card>
              </MotionEntrance>
            ))}
          </View>
        ) : null}

        {drafts.length > 0 ? (
          <View className="gap-2">
            <H3>Not published yet</H3>
            {drafts.map((page) => (
              <Card key={page.id} className="flex-row items-center gap-3">
                <View
                  className="h-10 w-10 shrink-0 items-center justify-center rounded-control bg-secondary"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <FileText size={19} color={colors.mutedForeground} />
                </View>
                <View className="min-w-0 flex-1">
                  <Body>{page.full_name || "Untitled page"}</Body>
                  <Muted>Publish it and visits will show up here.</Muted>
                </View>
              </Card>
            ))}
          </View>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}
