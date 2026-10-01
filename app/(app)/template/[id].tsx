import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { ActionBar } from "@/components/ActionBar";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, Muted } from "@/components/Text";
import { ErrorState, Loading } from "@/components/States";
import { StyleGallery } from "@/features/builder/StyleGallery";
import { useApplyTemplate } from "@/features/builder/use-apply-template";
import { useMyPage } from "@/api/queries";
import { currentPitchKind } from "@/page/apply-kind";
import {
  KIND_TO_CATEGORY,
  STYLE_CATEGORY_ORDER,
  STYLE_CATEGORY_SHORT,
  STYLE_FAMILIES,
  resolveStyle,
  type StyleCategory,
  type StyleFamily,
} from "@/page/style-families";
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const page = useMyPage(id);

  const kind = currentPitchKind(page.data?.wizard_meta);
  const suggested = kind ? KIND_TO_CATEGORY[kind] : undefined;

  const [filter, setFilter] = useState<Filter | null>(null);

  // Hooks cannot sit below the early returns, and the row is not loaded yet,
  // so the fallback stands in until it is. Nothing can apply a template while
  // the screen is still showing its spinner.
  const { apply, busy } = useApplyTemplate(
    page.data ?? {
      id: id ?? "",
      template: null,
      updated_at: null,
      wizard_meta: null,
      sections: null,
      portrait_url: null,
      email: null,
    },
  );

  const current = useMemo(() => resolveStyle(page.data?.template), [page.data?.template]);
  // Null until the page loads, so the first render does not settle on "All"
  // before the page's own type is known.
  const active: Filter = filter ?? suggested ?? ALL;
  const selectedId = current.family.id;

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

  const filters: Filter[] = [ALL, ...STYLE_CATEGORY_ORDER];

  return (
    <Screen edges={["top"]}>
      <ScreenScroll contentClassName="pt-2 gap-5">
        <BackButton />

        <View className="gap-2">
          <H1>Pick a template</H1>
          <Muted>
            How your page looks. Tap one to see the real page it makes. You can change it any time
            from Style in the builder, so this is a starting point, not a commitment.
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
          action="open"
          onSelect={(family: StyleFamily) =>
            router.push({
              pathname: "/(app)/template-preview/[id]",
              params: { id: row.id, family: family.id },
            })
          }
        />
      </ScreenScroll>

      <ActionBar>
        <Button
          title={`Continue with ${current.family.label}`}
          loading={busy}
          onPress={() => void apply(selectedId)}
        />
      </ActionBar>
    </Screen>
  );
}
