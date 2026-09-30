import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";

import { Card } from "@/components/Card";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H3, Muted } from "@/components/Text";
import { EmptyState, ErrorState, Loading } from "@/components/States";
import { useMyPages } from "@/api/queries";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP } from "@/theme/tokens";

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
        <ScreenScroll contentClassName="pt-2 gap-4">
          <H1>Analytics</H1>
          <Loading label="Loading your pages…" />
        </ScreenScroll>
      </Screen>
    );
  }

  if (pages.isError) {
    return (
      <Screen edges={["top"]}>
        <ScreenScroll contentClassName="pt-2 gap-4">
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
      <ScreenScroll contentClassName="pt-2 gap-5">
        <H1>Analytics</H1>

        {all.length === 0 ? (
          <EmptyState
            title="No pages yet"
            body="Once you publish a page, everyone who opens it shows up here."
          />
        ) : null}

        {live.length > 0 ? (
          <View className="gap-2">
            <Muted>Tap a page to see how it's doing.</Muted>
            {live.map((page) => (
              <Card key={page.id} className="p-0">
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
                  className="flex-row items-center gap-3 px-4 py-3"
                >
                  <View className="min-w-0 flex-1 gap-0.5">
                    <H3 numberOfLines={1}>{page.full_name || "Untitled page"}</H3>
                    {page.headline ? <Muted numberOfLines={1}>{page.headline}</Muted> : null}
                  </View>
                  <ChevronRight size={18} color={colors.mutedForeground} />
                </Pressable>
              </Card>
            ))}
          </View>
        ) : null}

        {drafts.length > 0 ? (
          <View className="gap-2">
            <Muted className="uppercase">Not published yet</Muted>
            {drafts.map((page) => (
              <Card key={page.id} className="gap-0.5 opacity-60">
                <Body numberOfLines={1}>{page.full_name || "Untitled page"}</Body>
                <Muted>Publish it and visits will show up here.</Muted>
              </Card>
            ))}
          </View>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}
