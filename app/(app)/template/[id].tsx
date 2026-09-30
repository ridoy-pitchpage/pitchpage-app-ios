import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, Muted } from "@/components/Text";
import { ErrorState, Loading } from "@/components/States";
import { useToast } from "@/components/Toast";
import { StyleGallery } from "@/features/builder/StyleGallery";
import { keys, useMyPage } from "@/api/queries";
import { savePage } from "@/api/supabase-direct";
import { currentPitchKind } from "@/page/apply-kind";
import {
  KIND_TO_CATEGORY,
  STYLE_CATEGORY_ORDER,
  STYLE_CATEGORY_SHORT,
  STYLE_FAMILIES,
  encodeStyleSelection,
  resolveStyle,
  type StyleCategory,
  type StyleFamily,
} from "@/page/style-families";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP } from "@/theme/tokens";

/**
 * Pick a template, between choosing a page type and filling it in.
 *
 * The website asks for the look before the words, and it is the right order:
 * what a page will look like changes what someone writes for it, and choosing
 * it afterwards means reading everything again to see whether it still fits.
 * The app used to bury this in a sheet inside the builder, so most people
 * never found it and published whatever the seed happened to pick.
 *
 * The filter opens on the category that matches the page's own type — job
 * templates for a job application — because that is the answer almost
 * everybody wants, while "All" stays one tap away for the ones who do not.
 */

const ALL = "all" as const;
type Filter = typeof ALL | StyleCategory;

export default function TemplateScreen() {
  const colors = useColors();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const page = useMyPage(id);

  const kind = currentPitchKind(page.data?.wizard_meta);
  const suggested = kind ? KIND_TO_CATEGORY[kind] : undefined;

  const [filter, setFilter] = useState<Filter | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const current = useMemo(() => resolveStyle(page.data?.template), [page.data?.template]);
  // Null until the page loads, so the first render does not settle on "All"
  // before the page's own type is known.
  const active: Filter = filter ?? suggested ?? ALL;
  const selectedId = chosen ?? current.family.id;

  const families = useMemo(
    () => (active === ALL ? STYLE_FAMILIES : STYLE_FAMILIES.filter((f) => f.category === active)),
    [active],
  );

  if (page.isPending) {
    return (
      <Screen>
        <Loading label="Loading your page…" />
      </Screen>
    );
  }

  if (page.isError || !page.data) {
    return (
      <Screen>
        <ScreenScroll contentClassName="pt-2 gap-4">
          <BackButton />
          <ErrorState error={page.error} onRetry={() => void page.refetch()} />
        </ScreenScroll>
      </Screen>
    );
  }

  const row = page.data;

  async function applyTemplate() {
    const family = STYLE_FAMILIES.find((f) => f.id === selectedId) ?? current.family;
    setBusy(true);
    try {
      await savePage(
        row.id,
        {
          template: encodeStyleSelection(
            family.id,
            current.color.id,
            family.supportsMode ? current.mode : family.defaultMode,
          ),
        },
        row.updated_at,
      );
      await queryClient.invalidateQueries({ queryKey: keys.page(row.id) });
      await queryClient.invalidateQueries({ queryKey: keys.pages });
      // Next comes what goes ON the page. The kinds that ask their own
      // questions do that first; the rest go straight to the CV and links.
      if (kind && kind !== "job" && kind !== "other") {
        router.push({ pathname: "/(app)/intake/[kind]/[id]", params: { kind, id: row.id } });
      } else {
        router.push({ pathname: "/(app)/build/[id]", params: { id: row.id } });
      }
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(false);
    }
  }

  const filters: Filter[] = [ALL, ...STYLE_CATEGORY_ORDER];

  return (
    <Screen edges={["top"]}>
      <ScreenScroll contentClassName="pt-2 gap-5">
        <BackButton />

        <View className="gap-2">
          <H1>Pick a template</H1>
          <Muted>
            How your page looks. You can change it any time from Style in the builder, so this is a
            starting point, not a commitment.
          </Muted>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {filters.map((name) => {
            const on = active === name;
            const label = name === ALL ? "All" : STYLE_CATEGORY_SHORT[name];
            const count =
              name === ALL
                ? STYLE_FAMILIES.length
                : STYLE_FAMILIES.filter((f) => f.category === name).length;
            return (
              <Pressable
                key={name}
                onPress={() => setFilter(name)}
                accessibilityRole="button"
                accessibilityLabel={`Show ${label} templates, ${count} of them`}
                accessibilityState={{ selected: on }}
                style={{ minHeight: MIN_TAP }}
                className={[
                  "justify-center rounded-control border px-3",
                  on ? "border-foreground bg-foreground" : "border-border bg-card",
                ].join(" ")}
              >
                {/* Colour as a style, not a class — see Text.tsx on why. */}
                <Body
                  className={on ? "font-body-medium" : ""}
                  style={{ color: on ? colors.background : colors.foreground }}
                >
                  {label}
                </Body>
              </Pressable>
            );
          })}
        </View>

        {suggested && active === suggested ? (
          <Muted>
            These suit a {STYLE_CATEGORY_SHORT[suggested].toLowerCase()} page. Tap All to see every
            template.
          </Muted>
        ) : null}

        <StyleGallery
          families={families}
          selectedId={selectedId}
          onSelect={(family: StyleFamily) => setChosen(family.id)}
        />
      </ScreenScroll>

      <View className="border-t border-border bg-card px-4 py-3">
        <Button
          title="Use this template"
          loading={busy}
          onPress={() => void applyTemplate()}
        />
      </View>
    </Screen>
  );
}
