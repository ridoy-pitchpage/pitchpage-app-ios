import { useCallback, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Plus } from "lucide-react-native";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, Loading } from "@/components/States";
import { Body, H1, H3, Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import {
  useCreatePage,
  useDeletePage,
  useMyCredits,
  useMyPages,
  useUnpublishPage,
} from "@/api/queries";
import type { PageCard as PageCardRow } from "@/api/supabase-direct";
import { creditCount, pageSubtitle, relativeTime } from "@/lib/format";
import { publicPageUrl } from "@/lib/config";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP } from "@/theme/tokens";

/**
 * Pages (S22) — the app's home, replacing the web dashboard.
 *
 * The stats row, recent activity, top sources and the trends banner arrive in
 * M6 with the analytics endpoints. This is the page list and its actions.
 */
export default function PagesScreen() {
  const colors = useColors();
  const toast = useToast();
  const pages = useMyPages();
  const credits = useMyCredits();
  const createPage = useCreatePage();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const refresh = useCallback(() => {
    void pages.refetch();
    void credits.refetch();
  }, [pages, credits]);

  async function create() {
    const name = newName.trim();
    if (!name) {
      toast.error(new Error("Enter a name to get started."));
      return;
    }
    try {
      const { id } = await createPage.mutateAsync(name);
      setCreating(false);
      setNewName("");
      router.push({ pathname: "/(app)/choose-type/[id]", params: { id } });
    } catch (error) {
      toast.error(error);
    }
  }

  if (pages.isPending) {
    return (
      <Screen>
        <Loading label="Getting your pages…" />
      </Screen>
    );
  }

  if (pages.isError) {
    return (
      <Screen>
        <ErrorState error={pages.error} onRetry={() => void pages.refetch()} />
      </Screen>
    );
  }

  const rows = pages.data ?? [];

  return (
    <Screen edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-10 gap-4"
        refreshControl={
          <RefreshControl
            refreshing={pages.isFetching && !pages.isPending}
            onRefresh={refresh}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <View className="flex-row items-center justify-between pt-2">
          <H1>Your pages</H1>
          <Pressable
            onPress={() => setCreating((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel="New page"
            hitSlop={12}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary"
          >
            <Plus size={22} color={colors.primaryForeground} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/(app)/(tabs)/credits")}
          accessibilityRole="button"
          accessibilityLabel="Your credits"
          style={{ minHeight: MIN_TAP }}
          className="justify-center self-start rounded-full border border-border px-4"
        >
          <Muted>
            {credits.isPending
              ? "…"
              : credits.isError
                ? "Credits — couldn't load"
                : creditCount(credits.data?.balance ?? 0)}
          </Muted>
        </Pressable>

        {creating ? (
          <Card className="gap-3">
            <H3>What's your full name or company name?</H3>
            <TextField
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
              autoFocus
              placeholder="Alex Chen"
              returnKeyType="go"
              onSubmitEditing={() => void create()}
            />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => {
                    setCreating(false);
                    setNewName("");
                  }}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Create"
                  loading={createPage.isPending}
                  onPress={() => void create()}
                />
              </View>
            </View>
          </Card>
        ) : null}

        {rows.length === 0 ? (
          <EmptyState
            title="Let's build your pitch page."
            body="Start with your name, then add your résumé and let AI draft the rest."
            action={<Button title="Start here — it's free" onPress={() => setCreating(true)} />}
          />
        ) : (
          rows.map((page) => <PageRow key={page.id} page={page} />)
        )}
      </ScrollView>
    </Screen>
  );
}

function PageRow({ page }: { page: PageCardRow }) {
  const toast = useToast();
  const deletePage = useDeletePage();
  const unpublish = useUnpublishPage();
  const isLive = page.published_at != null;
  const url = page.slug ? publicPageUrl(page.slug) : null;

  function confirmDelete() {
    Alert.alert(
      "Delete this page?",
      isLive
        ? "It will come offline and can't be recovered."
        : "This draft can't be recovered.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Delete page",
          style: "destructive",
          onPress: () => {
            deletePage.mutate(page.id, {
              onSuccess: () => toast.success("Page deleted"),
              onError: (error) => toast.error(error),
            });
          },
        },
      ],
    );
  }

  function confirmUnpublish() {
    Alert.alert(
      "Take this page offline?",
      "The link will stop working. Publishing it again later is free.",
      [
        { text: "Keep it live", style: "cancel" },
        {
          text: "Take it offline",
          style: "destructive",
          onPress: () => {
            unpublish.mutate(page.id, {
              onSuccess: () => toast.success("Page taken offline"),
              onError: (error) => toast.error(error),
            });
          },
        },
      ],
    );
  }

  async function copyLink() {
    if (!url) return;
    await Clipboard.setStringAsync(url);
    toast.success("Link copied");
  }

  return (
    <Card className="gap-3">
      <View className="gap-1">
        <View className="flex-row items-center justify-between gap-2">
          {/* min-w-0 so a long name truncates instead of pushing the badge off. */}
          <H3 numberOfLines={1} className="min-w-0 flex-1">
            {page.full_name ?? "Untitled page"}
          </H3>
          <Badge label={isLive ? "Published" : "Draft"} tone={isLive ? "live" : "draft"} />
        </View>
        <Muted numberOfLines={1}>{pageSubtitle(page)}</Muted>
        <Muted>Updated {relativeTime(page.updated_at)}</Muted>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {isLive && url ? (
          <>
            <RowAction
              label="Edit"
              onPress={() =>
                router.push({ pathname: "/(app)/builder/[id]", params: { id: page.id } })
              }
            />
            <RowAction
              label="Share"
              onPress={() =>
                router.push({ pathname: "/(app)/share/[id]", params: { id: page.id } })
              }
            />
            <RowAction label="Copy link" onPress={() => void copyLink()} />
            <RowAction
              label="Links"
              onPress={() =>
                router.push({
                  pathname: "/(app)/(tabs)/pages/[id]/links",
                  params: { id: page.id },
                })
              }
            />
            <RowAction
              label="See it live"
              onPress={() =>
                router.push({ pathname: "/(app)/live/[id]", params: { id: page.id } })
              }
            />
            <RowAction label="Take offline" onPress={confirmUnpublish} />
          </>
        ) : (
          <>
            <RowAction
              label="Edit"
              onPress={() =>
                router.push({ pathname: "/(app)/builder/[id]", params: { id: page.id } })
              }
            />
            <RowAction
              label="Review & publish"
              onPress={() =>
                router.push({ pathname: "/(app)/preview/[id]", params: { id: page.id } })
              }
            />
          </>
        )}
        <RowAction label="Delete" onPress={confirmDelete} destructive />
      </View>


    </Card>
  );
}

function RowAction({
  label,
  onPress,
  destructive = false,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-h-[44px] justify-center rounded-control border border-border px-3 active:opacity-70"
    >
      <Body className={destructive ? "text-destructive" : "text-foreground"}>{label}</Body>
    </Pressable>
  );
}
