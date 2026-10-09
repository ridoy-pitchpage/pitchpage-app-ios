import { useCallback, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import {
  ArrowUpRight,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Link2,
  MoreHorizontal,
  PencilLine,
  Plus,
  Share2,
  Trash2,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { MotionEntrance } from "@/components/MotionEntrance";
import { Screen } from "@/components/Screen";
import { Sheet } from "@/components/Sheet";
import { EmptyState, ErrorState, Loading } from "@/components/States";
import { Body, H1, H3, Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useConfirm } from "@/components/Confirm";
import { useToast } from "@/components/Toast";
import {
  useCreatePage,
  useDeletePage,
  useMyPages,
  useUnpublishPage,
} from "@/api/queries";
import type { PageCard as PageCardRow } from "@/api/supabase-direct";
import { pageSubtitle, relativeTime } from "@/lib/format";
import { publicPageUrl } from "@/lib/config";
import { useColors } from "@/theme/ThemeProvider";
import { mix } from "@/theme/tokens";

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
  const createPage = useCreatePage();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const creatingRequest = useRef(false);

  const refresh = useCallback(() => {
    void pages.refetch();
  }, [pages]);

  async function create() {
    // State updates render later; this also blocks a second keyboard submit
    // in the same frame as the first tap.
    if (creatingRequest.current) return;
    const name = newName.trim();
    if (!name) {
      toast.error(new Error("Enter a name to get started."));
      return;
    }
    creatingRequest.current = true;
    try {
      const { id } = await createPage.mutateAsync(name);
      setCreating(false);
      setNewName("");
      router.push({ pathname: "/(app)/choose-type/[id]", params: { id } });
    } catch (error) {
      toast.error(error);
    } finally {
      creatingRequest.current = false;
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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-3 gap-4"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={pages.isFetching && !pages.isPending}
            onRefresh={refresh}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <MotionEntrance className="gap-4">
          <View className="gap-1">
            <Muted className="font-body-bold text-[11px] tracking-[1.5px]" style={{ color: colors.primary }}>
              YOUR WORKSPACE
            </Muted>
            <H1>Your pages</H1>
            <Muted>A little more you. All in one link.</Muted>
          </View>
          {creating ? null : (
            <Button
              title="New page"
              icon={<Plus size={19} color={colors.primaryForeground} />}
              onPress={() => setCreating(true)}
            />
          )}
          <Muted>
            {rows.length === 0
              ? "Make your first impression count."
              : `${rows.length} ${rows.length === 1 ? "page" : "pages"} in your workspace`}
          </Muted>
        </MotionEntrance>

        {creating ? (
          <MotionEntrance index={1}>
          <Card className="gap-3">
            <H3>What's your full name or company name?</H3>
            <TextField
              accessibilityLabel="Full name or company name"
              editable={!createPage.isPending}
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
                  disabled={createPage.isPending}
                  onPress={() => {
                    if (creatingRequest.current) return;
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
          </MotionEntrance>
        ) : null}

        {rows.length === 0 && !creating ? (
          <EmptyState
            title="Let's build your pitch page."
            body="Start with your name, add your resume, then build your story section by section."
            icon={<FileText size={28} color={colors.primary} />}
          />
        ) : (
          rows.map((page, index) => (
            <MotionEntrance key={page.id} index={index + 1}>
              <PageRow page={page} />
            </MotionEntrance>
          ))
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function PageRow({ page }: { page: PageCardRow }) {
  const colors = useColors();
  const toast = useToast();
  const confirm = useConfirm();
  const [moreOpen, setMoreOpen] = useState(false);
  const deletePage = useDeletePage();
  const unpublish = useUnpublishPage();
  const isLive = page.published_at != null;
  const url = page.slug ? publicPageUrl(page.slug) : null;

  async function confirmDelete() {
    const ok = await confirm({
      title: "Delete this page?",
      message: isLive
        ? "It will come offline and can't be recovered."
        : "This draft can't be recovered.",
      confirmLabel: "Delete page",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (!ok) return;
    deletePage.mutate(page.id, {
      onSuccess: () => toast.success("Page deleted"),
      onError: (error) => toast.error(error),
    });
  }

  async function confirmUnpublish() {
    const ok = await confirm({
      title: "Take this page offline?",
      message: "The link will stop working. Publishing it again later is free.",
      confirmLabel: "Take it offline",
      cancelLabel: "Keep it live",
      destructive: true,
    });
    if (!ok) return;
    unpublish.mutate(page.id, {
      onSuccess: () => toast.success("Page taken offline"),
      onError: (error) => toast.error(error),
    });
  }

  async function copyLink() {
    if (!url) return;
    await Clipboard.setStringAsync(url);
    toast.success("Link copied");
  }

  function fromMore(action: () => void) {
    setMoreOpen(false);
    requestAnimationFrame(action);
  }

  return (
    <>
      <Card className="gap-4">
        <View className="flex-row items-start gap-3">
          <View
            className="h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: mix(colors.card, isLive ? colors.primary : colors.accent, 0.1) }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Body adjustsFontSizeToFit numberOfLines={1} className="font-heading text-[20px]" style={{ color: isLive ? colors.primary : colors.foreground }}>
              {(page.full_name?.trim() || "P").charAt(0).toUpperCase()}
            </Body>
          </View>
          <View className="min-w-0 flex-1 gap-1">
            <H3>{page.full_name ?? "Untitled page"}</H3>
            <Muted>{pageSubtitle(page)}</Muted>
          </View>
        </View>

        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <Badge label={isLive ? "Published" : "Draft"} tone={isLive ? "live" : "draft"} />
          <View className="flex-row items-center gap-1.5">
            <Clock3 size={13} color={colors.mutedForeground} />
            <Muted className="text-[12px]">Updated {relativeTime(page.updated_at)}</Muted>
          </View>
        </View>

        <View className="flex-row gap-2 border-t border-border pt-3">
          <RowAction
            label="Edit"
            Icon={PencilLine}
            prominent
            onPress={() =>
              router.push({ pathname: "/(app)/builder/[id]", params: { id: page.id } })
            }
          />
          <RowAction
            label={isLive ? "Share" : "Preview"}
            Icon={isLive ? Share2 : Eye}
            onPress={() =>
              isLive
                ? router.push({ pathname: "/(app)/share/[id]", params: { id: page.id } })
                : // The page as built, in its real template — not the publish
                  // checklist, which Publish in the builder still leads to.
                  router.push({
                    pathname: "/(app)/builder/[id]",
                    params: { id: page.id, mode: "preview" },
                  })
            }
          />
          <Pressable
            onPress={() => setMoreOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`More actions for ${page.full_name || "your page"}`}
            className="min-h-[48px] w-12 items-center justify-center self-stretch rounded-control border border-border bg-card"
          >
            <MoreHorizontal size={21} color={colors.foreground} />
          </Pressable>
        </View>
      </Card>
      <Sheet visible={moreOpen} onClose={() => setMoreOpen(false)} title="Page actions">
        {isLive && url ? (
          <>
            <MoreOption label="Copy link" Icon={Copy} onPress={() => fromMore(() => void copyLink())} />
            <MoreOption
              label="Links"
              Icon={Link2}
              onPress={() =>
                fromMore(() =>
                  router.push({ pathname: "/(app)/(tabs)/pages/[id]/links", params: { id: page.id } }),
                )
              }
            />
            <MoreOption
              label="See it live"
              Icon={ExternalLink}
              onPress={() =>
                fromMore(() =>
                  router.push({ pathname: "/(app)/live/[id]", params: { id: page.id } }),
                )
              }
            />
            <MoreOption
              label="Take offline"
              Icon={ArrowUpRight}
              onPress={() => fromMore(() => void confirmUnpublish())}
            />
          </>
        ) : null}
        <MoreOption
          label="Delete"
          Icon={Trash2}
          destructive
          onPress={() => fromMore(() => void confirmDelete())}
        />
      </Sheet>
    </>
  );
}

function RowAction({
  label,
  onPress,
  Icon,
  prominent = false,
}: {
  label: string;
  onPress: () => void;
  Icon: LucideIcon;
  prominent?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={[
        "min-h-[48px] min-w-0 flex-1 flex-row items-center justify-center gap-2 rounded-control px-2 py-2 active:opacity-70",
        prominent ? "" : "border border-border bg-card",
      ].join(" ")}
      style={prominent ? { backgroundColor: mix(colors.card, colors.primary, 0.1) } : undefined}
    >
      <Icon size={17} color={prominent ? colors.primary : colors.foreground} />
      <Body
        className="shrink font-body-bold text-center text-[14px]"
        style={{ color: prominent ? colors.primary : colors.foreground }}
      >
        {label}
      </Body>
    </Pressable>
  );
}

function MoreOption({
  label,
  Icon,
  onPress,
  destructive = false,
}: {
  label: string;
  Icon: LucideIcon;
  onPress: () => void;
  destructive?: boolean;
}) {
  const colors = useColors();
  const tint = destructive ? colors.destructive : colors.foreground;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-h-[52px] flex-row items-center gap-3 border-b border-border py-2"
    >
      <Icon size={19} color={tint} />
      <Body style={{ color: tint }}>{label}</Body>
    </Pressable>
  );
}
