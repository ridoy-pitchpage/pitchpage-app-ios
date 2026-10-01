import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Eye,
  FilePenLine,
  Images,
  ListTree,
  Pencil,
  SwatchBook,
} from "lucide-react-native";

import { Button } from "@/components/Button";
import { TopBar } from "@/components/TopBar";
import { ErrorState, Loading } from "@/components/States";
import { Body, Muted } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { keys, useMyPage } from "@/api/queries";
import { PageRender } from "@/render/PageRender";
import { RenderSurface, type SurfaceTarget } from "@/render/RenderSurface";
import { toPublicData } from "@/render/to-public-data";
import { DetailsSheet } from "@/features/builder/DetailsSheet";
import { SectionSheet } from "@/features/builder/SectionSheet";
import { SectionsSheet } from "@/features/builder/SectionsSheet";
import { StylePicker } from "@/features/builder/StylePicker";
import { MediaSheet } from "@/features/media/MediaSheet";
import { saveLabel, startDraftAutosaveOnBackground, useDraft } from "@/state/draft-store";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP } from "@/theme/tokens";

/**
 * The builder.
 *
 * Built the other way round from the web's, deliberately. There, editing is a
 * form with a preview column beside it — and that column is desktop-only, so a
 * phone user cannot see their page at all while they work. Here the page IS the
 * screen, full width, and editing happens in sheets over it. You are editing a
 * page, not filling in a form that has a page next to it.
 *
 * There is also no Next button and no step index. The web addresses its steps
 * positionally (`?step=3`), which is why it has to keep a skipped step in the
 * list forever so the numbers do not shift. A page is not a queue; it is a
 * document with a few aspects, and the toolbar addresses them by name.
 */
export default function BuilderScreen() {
  // `mode=preview` opens straight onto the finished page — the Pages list
  // uses it so "Preview" shows what was built rather than the publish
  // checklist, which is still one tap away under Publish.
  const { id, mode: initialMode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const colors = useColors();
  const toast = useToast();
  const queryClient = useQueryClient();
  const query = useMyPage(id);

  const load = useDraft((s) => s.load);
  const clear = useDraft((s) => s.clear);
  const flush = useDraft((s) => s.flush);
  const page = useDraft((s) => s.page);
  const status = useDraft((s) => s.status);
  const draftId = useDraft((s) => s.pageId);

  const [mode, setMode] = useState<"edit" | "preview">(
    initialMode === "preview" ? "preview" : "edit",
  );
  const [sheet, setSheet] = useState<"none" | "details" | "sections" | "style" | "media">("none");
  /** Whether the Sections sheet should open on its "add" pane. */
  const [sectionsOnAdd, setSectionsOnAdd] = useState(false);
  const [sectionId, setSectionId] = useState<string | null>(null);

  // Load the row into the draft store once, and only when it is a different
  // page — re-loading on every refetch would discard unsaved keystrokes.
  useEffect(() => {
    if (query.data && query.data.id !== draftId) load(query.data);
  }, [query.data, draftId, load]);

  useEffect(() => startDraftAutosaveOnBackground(), []);

  // The draft in the shape the website's renderer takes. Memoised: the
  // builder re-renders on every save-state change, and each new object would
  // otherwise re-send an identical page to /app-render.
  const publicData = useMemo(
    () => (page ? toPublicData(page, query.data) : null),
    [page, query.data],
  );

  useEffect(
    () => () => {
      void flush();
      clear();
    },
    [flush, clear],
  );

  async function leave() {
    await flush();
    await queryClient.invalidateQueries({ queryKey: keys.page(id ?? "") });
    await queryClient.invalidateQueries({ queryKey: keys.pages });
    router.back();
  }

  if (query.isPending || !page) {
    return (
      <View className="flex-1 bg-background">
        <Loading label="Opening your page…" />
      </View>
    );
  }

  if (query.isError) {
    return (
      <View className="flex-1 bg-background">
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </View>
    );
  }

  if (status === "conflict") {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
        <Body className="text-center">This page was updated somewhere else.</Body>
        <Muted className="text-center">
          Reload to get the latest version. Anything you changed here since then
          hasn't been saved.
        </Muted>
        <Button
          title="Reload"
          onPress={() => {
            clear();
            void query.refetch();
          }}
        />
      </View>
    );
  }

  const editing = mode === "edit";

  return (
    <View className="flex-1">
      {/*
        The website's own rendering of the draft, so the builder looks exactly
        like the template that was picked. PageRender stays as the fallback:
        it is what shows until /app-render answers, and the whole time if it
        never does — before it is published, offline, or on a slow first
        load — so this screen is never blank.
      */}
      <RenderSurface
        page={publicData!}
        editing={editing}
        onTap={(target: SurfaceTarget) => {
          if (target.kind === "section") setSectionId(target.sectionId);
          else if (target.kind === "details") setSheet("details");
          else setSheet("media");
        }}
        bottomInset={104}
        header={
          <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
            <TopBar className="gap-1">
              <Pressable
                onPress={() => void leave()}
                accessibilityRole="button"
                accessibilityLabel="Back to your pages"
                hitSlop={10}
                style={{ minHeight: MIN_TAP, minWidth: MIN_TAP }}
                className="items-center justify-center"
              >
                <ChevronLeft size={26} color={colors.foreground} />
              </Pressable>

              <View className="min-w-0 flex-1">
                <Body numberOfLines={1} className="text-[15px]">
                  {page.full_name || "Your page"}
                </Body>
                {/* Live save state, so nobody has to wonder whether it stuck. */}
                <Muted className="text-[12px]">{saveLabel(status) || "Up to date"}</Muted>
              </View>

              <Pressable
                onPress={() => setMode(editing ? "preview" : "edit")}
                accessibilityRole="button"
                accessibilityLabel={editing ? "Preview your page" : "Back to editing"}
                style={{ minHeight: MIN_TAP }}
                className="flex-row items-center gap-1.5 rounded-control border border-border px-3"
              >
                {editing ? (
                  <Eye size={16} color={colors.foreground} />
                ) : (
                  <Pencil size={16} color={colors.foreground} />
                )}
                <Body className="text-[14px]">{editing ? "Preview" : "Edit"}</Body>
              </Pressable>
            </TopBar>
          </SafeAreaView>
        }
        fallback={
          <PageRender
            page={page}
            editable={editing}
            onEditHero={() => setSheet("details")}
            onEditSection={(section) => setSectionId(section.id)}
            onAddSection={() => {
              setSectionsOnAdd(true);
              setSheet("sections");
            }}
          />
        }
      />

      <SafeAreaView
        edges={["bottom"]}
        style={{ backgroundColor: colors.card }}
        className="absolute inset-x-0 bottom-0 border-t border-border"
      >
        <View className="flex-row items-center gap-1 px-2 py-2">
          <ToolbarButton
            label="Details"
            icon={<FilePenLine size={19} color={colors.link} strokeWidth={2.1} />}
            onPress={() => setSheet("details")}
          />
          <ToolbarButton
            label="Sections"
            icon={<ListTree size={19} color={colors.link} strokeWidth={2.1} />}
            onPress={() => {
              setSectionsOnAdd(false);
              setSheet("sections");
            }}
          />
          <ToolbarButton
            label="Media"
            icon={<Images size={19} color={colors.link} strokeWidth={2.1} />}
            onPress={() => setSheet("media")}
          />
          <ToolbarButton
            label="Style"
            icon={<SwatchBook size={19} color={colors.link} strokeWidth={2.1} />}
            onPress={() => setSheet("style")}
          />
          <View className="w-[112px] pl-1">
            <Button
              title={page.published_at ? "Update" : "Publish"}
              haptic
              onPress={async () => {
                await flush();
                if (status === "error") {
                  toast.error(new Error("Your last change hasn't saved yet."));
                  return;
                }
                router.push({ pathname: "/(app)/preview/[id]", params: { id: page.id } });
              }}
            />
          </View>
        </View>
      </SafeAreaView>

      <DetailsSheet visible={sheet === "details"} onClose={() => setSheet("none")} />
      <SectionsSheet
        visible={sheet === "sections"}
        onClose={() => setSheet("none")}
        onEditSection={(section) => setSectionId(section.id)}
        startOnAdd={sectionsOnAdd}
      />
      <StylePicker visible={sheet === "style"} onClose={() => setSheet("none")} />
      <MediaSheet visible={sheet === "media"} onClose={() => setSheet("none")} />
      <SectionSheet sectionId={sectionId} onClose={() => setSectionId(null)} />
    </View>
  );
}

function ToolbarButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ minHeight: 58, minWidth: MIN_TAP }}
      className="flex-1 items-center justify-center gap-1 rounded-control active:bg-secondary"
    >
      <View className="h-7 w-7 items-center justify-center rounded-full bg-secondary">{icon}</View>
      <Muted className="font-body-medium text-[11px]" style={{ color: colors.foreground }}>
        {label}
      </Muted>
    </Pressable>
  );
}
