import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useNavigation, usePreventRemove } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
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
import { themeForTemplate } from "@/render/template-theme";
import { toPublicData } from "@/render/to-public-data";
import { DetailsSheet } from "@/features/builder/DetailsSheet";
import { SectionSheet } from "@/features/builder/SectionSheet";
import { SectionsSheet } from "@/features/builder/SectionsSheet";
import { StylePicker } from "@/features/builder/StylePicker";
import { MediaSheet } from "@/features/media/MediaSheet";
import {
  hasUnsavedChanges,
  saveLabel,
  shouldAdoptServerRow,
  startDraftAutosaveOnBackground,
  useDraft,
} from "@/state/draft-store";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP, elevation } from "@/theme/tokens";

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
  const navigation = useNavigation();
  const leaving = useRef(false);

  const load = useDraft((s) => s.load);
  const flush = useDraft((s) => s.flush);
  const page = useDraft((s) => s.page);
  const status = useDraft((s) => s.status);
  const draftId = useDraft((s) => s.pageId);

  const [mode, setMode] = useState<"edit" | "preview">(
    initialMode === "preview" ? "preview" : "edit",
  );
  // A preview opened from the editor goes back to it; one opened straight
  // from your pages goes back to them, as any screen would.
  const [previewFromEditor, setPreviewFromEditor] = useState(false);
  const backToEditor = mode === "preview" && previewFromEditor;

  // Covers the header, the iOS back gesture, and other navigation removals.
  usePreventRemove(backToEditor || (draftId === id && hasUnsavedChanges(status)), ({ data }) => {
    if (backToEditor) {
      setMode("edit");
      return;
    }
    if (leaving.current) return;
    leaving.current = true;
    void (async () => {
      if (await flush()) {
        navigation.dispatch(data.action);
      } else {
        toast.error(new Error("Your changes aren't saved yet. Stay here and try again when you're connected."));
      }
    })().finally(() => { leaving.current = false; });
  });

  const [sheet, setSheet] = useState<"none" | "details" | "sections" | "style" | "media">("none");
  /** Whether the Sections sheet should open on its "add" pane. */
  const [sectionsOnAdd, setSectionsOnAdd] = useState(false);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [toolbarHeight, setToolbarHeight] = useState(0);

  // Load the row when it is a different page, or a newer save of this one
  // while nothing here is unsaved (shouldAdoptServerRow says why). Publishing,
  // taking offline and "Build my page" refresh this query, so the draft
  // follows them instead of failing its next save against an old baseline.
  useEffect(() => {
    if (query.data && shouldAdoptServerRow(useDraft.getState(), query.data)) load(query.data);
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
      // Never clear before the asynchronous save completes. Keep a failed
      // draft in memory so reopening this editor can recover it.
      if (useDraft.getState().pageId === id) {
        void flush().then((saved) => {
          if (!saved) return;
          void queryClient.invalidateQueries({ queryKey: keys.page(id ?? "") });
          void queryClient.invalidateQueries({ queryKey: keys.pages });
        });
      }
    },
    [flush, id, queryClient],
  );

  function leave() {
    router.back();
  }

  if (query.isError) {
    return (
      <View className="flex-1 bg-background">
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </View>
    );
  }

  if (query.isPending || !page) {
    return (
      <View className="flex-1 bg-background">
        <Loading label="Opening your page…" />
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
          onPress={async () => {
            const result = await query.refetch();
            if (result.isError) toast.error(result.error);
            else if (result.data) load(result.data);
          }}
        />
      </View>
    );
  }

  const editing = mode === "edit";
  // Previewing shows the page and nothing else: no top bar, no toolbar, and
  // the strip under the status bar in the page's own ground.
  const pageTheme = themeForTemplate(page.template);

  return (
    <View className="flex-1" style={editing ? undefined : { backgroundColor: pageTheme.ground }}>
      {editing ? null : <StatusBar style={pageTheme.mode === "dark" ? "light" : "dark"} />}
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
        bottomInset={editing ? toolbarHeight : 0}
        header={
          editing ? (
            <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
              <TopBar className="flex-wrap gap-2 px-3 py-2">
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

                <View className="min-w-[100px] flex-1">
                  <Body numberOfLines={1} className="text-[15px]">
                    {page.full_name || "Your page"}
                  </Body>
                  <Muted className="text-[12px]">Page editor</Muted>
                </View>

                <Button
                  title={page.published_at ? "Update" : "Publish"}
                  fullWidth={false}
                  haptic
                  onPress={async () => {
                    if (!(await flush())) {
                      toast.error(new Error("Your last change hasn't saved yet."));
                      return;
                    }
                    router.push({ pathname: "/(app)/preview/[id]", params: { id: page.id } });
                  }}
                />
              </TopBar>

              <View className="flex-row flex-wrap items-center justify-between gap-2 px-4 pb-2 pt-1">
                <Muted className="min-w-0 flex-1 text-[12px]" accessibilityLiveRegion="polite">
                  {saveLabel(status) || "All changes saved"}
                </Muted>
                <Pressable
                  onPress={() => {
                    setPreviewFromEditor(true);
                    setMode("preview");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Preview your page"
                  style={{ minHeight: MIN_TAP }}
                  className="flex-row items-center gap-2 rounded-full border border-border bg-card px-3"
                >
                  <Eye size={16} color={colors.foreground} />
                  <Body className="text-[14px]">Preview</Body>
                </Pressable>
              </View>
            </SafeAreaView>
          ) : (
            <SafeAreaView edges={["top"]} style={{ backgroundColor: pageTheme.ground }} />
          )
        }
        fallback={
          <PageRender
            page={page}
            editable={editing}
            bottomInset={editing ? toolbarHeight : 0}
            onEditHero={() => setSheet("details")}
            onEditSection={(section) => setSectionId(section.id)}
            onAddSection={() => {
              setSectionsOnAdd(true);
              setSheet("sections");
            }}
          />
        }
      />

      {editing ? (
        <SafeAreaView
          edges={["bottom"]}
          className="absolute inset-x-0 bottom-0"
          onLayout={(event) => setToolbarHeight(event.nativeEvent.layout.height)}
        >
          <View
            className="mx-3 mb-2 flex-row items-stretch gap-2 rounded-[22px] border border-border bg-card p-2"
          >
            <ToolbarButton
              label="Details"
              active={sheet === "details"}
              icon={<FilePenLine size={20} color={colors.link} strokeWidth={2.1} />}
              onPress={() => setSheet("details")}
            />
            <ToolbarButton
              label="Sections"
              active={sheet === "sections"}
              icon={<ListTree size={20} color={colors.link} strokeWidth={2.1} />}
              onPress={() => {
                setSectionsOnAdd(false);
                setSheet("sections");
              }}
            />
            <ToolbarButton
              label="Media"
              active={sheet === "media"}
              icon={<Images size={20} color={colors.link} strokeWidth={2.1} />}
              onPress={() => setSheet("media")}
            />
            <ToolbarButton
              label="Style"
              active={sheet === "style"}
              icon={<SwatchBook size={20} color={colors.link} strokeWidth={2.1} />}
              onPress={() => setSheet("style")}
            />
          </View>
        </SafeAreaView>
      ) : (
        // The page's own way back to editing, kept small and to one side so
        // it covers as little of the page as it can.
        <SafeAreaView
          edges={["bottom"]}
          pointerEvents="box-none"
          className="absolute bottom-0 right-0"
        >
          {/* The spacing is on an inner view, as the toolbar's is: padding
              given to a SafeAreaView is replaced by the inset it computes. */}
          <View className="mb-3 mr-4">
            <Pressable
              onPress={() => setMode("edit")}
              accessibilityRole="button"
              accessibilityLabel="Edit your page"
              style={[{ minHeight: MIN_TAP, backgroundColor: colors.card }, elevation("#000000", 3)]}
              className="flex-row items-center gap-2 rounded-full border border-border px-4"
            >
              <Pencil size={16} color={colors.foreground} />
              <Body className="text-[15px]">Edit</Body>
            </Pressable>
          </View>
        </SafeAreaView>
      )}

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
  active,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded: active }}
      style={{ minHeight: 64, minWidth: MIN_TAP, backgroundColor: active ? colors.secondary : undefined }}
      className="min-w-0 flex-1 items-center justify-center gap-1 rounded-control px-1 py-2 active:bg-secondary"
    >
      <View className="h-7 w-7 items-center justify-center">{icon}</View>
      <Muted className="text-center font-body-bold text-[12px]" style={{ color: colors.foreground }}>
        {label}
      </Muted>
    </Pressable>
  );
}
