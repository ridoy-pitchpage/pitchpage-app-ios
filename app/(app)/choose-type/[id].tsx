import { useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react-native";

import { Card } from "@/components/Card";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { useConfirm } from "@/components/Confirm";
import { ErrorState, Loading } from "@/components/States";
import { Body, H1, H3, Muted } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { keys, useMyPage } from "@/api/queries";
import { clampSections } from "@/page/page-sections";
import { PITCH_KIND_TILES, RESEEDING_KINDS, type PitchKind } from "@/page/page-types";
import { applyPitchKind, currentPitchKind, hasSectionContent, reseedForKind } from "@/page/apply-kind";
import { useColors } from "@/theme/ThemeProvider";

/**
 * Choose page type (S27).
 *
 * Only two of the eight need anything else asked before the builder opens
 * (university and listing ask one question; the four verticals ask two), so
 * the others go straight through.
 */
export default function ChooseTypeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const page = useMyPage(id);
  const [busy, setBusy] = useState<PitchKind | null>(null);

  if (page.isPending) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (page.isError || !page.data) {
    return (
      <Screen>
        <ErrorState error={page.error} onRetry={() => void page.refetch()} />
      </Screen>
    );
  }

  const row = page.data;
  const existingKind = currentPitchKind(row.wizard_meta);
  const hasContent = hasSectionContent(clampSections(row.sections));

  /*
   * Choosing a type records it and then asks for the look, which is the order
   * the website uses and the right one: what a page will look like changes
   * what somebody writes for it, and picking the template afterwards means
   * reading it all again to see whether it still fits.
   *
   * The kind is applied here rather than after intake so the template step can
   * lead with the templates that suit it. The kinds that ask questions get
   * their answers on the step after the template, and applying the kind again
   * there with those answers is what seeds the sections properly.
   */
  async function choose(kind: PitchKind, options?: { reseed?: boolean }) {
    setBusy(kind);
    try {
      if (options?.reseed) await reseedForKind(row, kind);
      else await applyPitchKind(row, kind);
      await queryClient.invalidateQueries({ queryKey: keys.page(row.id) });
      await queryClient.invalidateQueries({ queryKey: keys.pages });
      router.push({ pathname: "/(app)/template/[id]", params: { id: row.id } });
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(null);
    }
  }

  async function onTile(kind: PitchKind) {
    const switching = existingKind != null && kind !== existingKind && hasContent;

    if (switching && RESEEDING_KINDS.has(kind)) {
      const ok = await confirm({
        title: "Switch page type and replace your sections?",
        message:
          "This page already has content in its sections. Switching to a different type replaces those sections with a fresh set for the new type — what you've written in them won't carry over.",
        confirmLabel: "Switch & replace sections",
        cancelLabel: "Keep my sections",
        destructive: true,
      });
      if (ok) await choose(kind, { reseed: true });
      return;
    }

    if (switching) {
      const ok = await confirm({
        title: "Your current sections will come with you",
        message:
          "This page already has sections that were set up for a different kind of pitch. This type doesn't replace them, so they'll carry over as they are — you can edit or remove any that don't fit once you're in the builder.",
        confirmLabel: "Continue",
        cancelLabel: "Go back",
      });
      if (ok) await choose(kind);
      return;
    }

    void choose(kind);
  }

  return (
    <Screen>
      <ScreenScroll contentClassName="pt-2 gap-4">
        <BackButton />

        <View className="gap-2">
          <H1>What kind of pitch page?</H1>
          <Body className="text-muted-foreground">
            Pick a type to get started. You can always change styles later.
          </Body>
        </View>

        <View className="gap-3">
          {PITCH_KIND_TILES.map((tile) => {
            // The icon set is the same one the published page uses, so a tile
            // and its page agree.
            const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[tile.icon] ?? Icons.Shapes;
            const isCurrent = existingKind === tile.key;

            return (
              <Pressable
                key={tile.key}
                onPress={() => onTile(tile.key)}
                disabled={busy != null}
                accessibilityRole="button"
                accessibilityLabel={`${tile.title}. ${tile.description}`}
                accessibilityState={{ selected: isCurrent, disabled: busy != null }}
              >
                <Card
                  className={[
                    "flex-row items-start gap-3",
                    isCurrent ? "border-primary" : "",
                    busy === tile.key ? "opacity-50" : "",
                  ].join(" ")}
                >
                  <View className="mt-0.5">
                    <Icon size={22} color={colors.primary} />
                  </View>
                  <View className="min-w-0 flex-1 gap-1">
                    <H3>{tile.title}</H3>
                    <Muted>{tile.description}</Muted>
                    {isCurrent ? <Muted className="text-link">Current type</Muted> : null}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      </ScreenScroll>
    </Screen>
  );
}
