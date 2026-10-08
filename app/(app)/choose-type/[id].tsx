import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Briefcase, Building2, Check, ChevronRight, GraduationCap, Home, Megaphone,
  Shapes, Trophy, Wrench, type LucideIcon,
} from "lucide-react-native";

import { Card } from "@/components/Card";
import { MotionEntrance } from "@/components/MotionEntrance";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { useConfirm } from "@/components/Confirm";
import { ErrorState, Loading } from "@/components/States";
import { H1, H3, Muted } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { keys, useMyPage } from "@/api/queries";
import { clampSections } from "@/page/page-sections";
import { PITCH_KIND_TILES, RESEEDING_KINDS, type PitchKind } from "@/page/page-types";
import { applyPitchKind, currentPitchKind, hasSectionContent, reseedForKind } from "@/page/apply-kind";
import { useColors } from "@/theme/ThemeProvider";
import { mix } from "@/theme/tokens";

const TYPE_GROUPS: ReadonlyArray<{ title: string; kinds: readonly PitchKind[] }> = [
  { title: "Personal goals", kinds: ["job", "university", "athlete"] },
  { title: "Business & property", kinds: ["real-estate", "listing", "contractor", "sales"] },
  { title: "Your own idea", kinds: ["other"] },
];

const TYPE_ICONS: Record<PitchKind, LucideIcon> = {
  job: Briefcase,
  university: GraduationCap,
  athlete: Trophy,
  "real-estate": Home,
  listing: Building2,
  contractor: Wrench,
  sales: Megaphone,
  other: Shapes,
};

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
      <ScreenScroll contentClassName="pt-2 gap-5">
        <View className="flex-row items-center justify-between gap-3">
          <BackButton />
          <Muted className="min-w-0 flex-1 text-right font-body-bold text-[12px]" style={{ color: colors.link }}>
            SET UP YOUR PAGE · 1 OF 3
          </Muted>
        </View>

        <MotionEntrance>
          <View className="gap-3">
            <View
              className="flex-row gap-1.5"
              accessibilityRole="progressbar"
              accessibilityLabel="Page type. Step 1 of 3: page type, design, content."
              accessibilityValue={{ min: 1, max: 3, now: 1 }}
            >
              {[0, 1, 2].map((step) => (
                <View key={step} className="h-1 flex-1 rounded-full"
                  style={{ backgroundColor: step === 0 ? colors.primary : colors.muted }} />
              ))}
            </View>
            <H1>What’s your page for?</H1>
            <Muted>Choose a starting point. We’ll set up the sections that fit your goal.</Muted>
          </View>
        </MotionEntrance>

        {TYPE_GROUPS.map((group, groupIndex) => (
          <MotionEntrance key={group.title} index={groupIndex + 1}>
            <View className="gap-2">
              <Muted className="px-1 font-body-bold text-[12px]">{group.title}</Muted>
              <Card flat style={{ padding: 0 }} className="overflow-hidden">
                {group.kinds.map((kind, index) => {
                  const tile = PITCH_KIND_TILES.find((item) => item.key === kind)!;
                  const Icon = TYPE_ICONS[tile.key];
                  const isCurrent = existingKind === tile.key;

                  return (
                    <Pressable
                      key={tile.key}
                      onPress={() => void onTile(tile.key)}
                      disabled={busy != null}
                      accessibilityRole="button"
                      accessibilityLabel={`${tile.title}. ${tile.description}`}
                      accessibilityState={{ selected: isCurrent, disabled: busy != null, busy: busy === tile.key }}
                    >
                      {/* The row's look lives on an inner View: on iOS a style function on Pressable is dropped (see eslint.config.js). */}
                      {({ pressed }) => (
                        <View
                          className="flex-row items-center gap-3"
                          style={{
                            minHeight: 84,
                            padding: 16,
                            borderBottomWidth: index === group.kinds.length - 1 ? 0 : 1,
                            borderBottomColor: colors.border,
                            backgroundColor: pressed ? colors.secondary : isCurrent ? mix(colors.card, colors.primary, 0.06) : undefined,
                          }}
                        >
                          <View className="h-11 w-11 items-center justify-center rounded-control"
                            style={{ backgroundColor: mix(colors.card, colors.primary, 0.1) }}>
                            <Icon size={22} color={colors.link} strokeWidth={1.8} />
                          </View>
                          <View className="min-w-0 flex-1 gap-1">
                            <H3>{tile.title}</H3>
                            <Muted>{tile.description}</Muted>
                          </View>
                          {busy === tile.key ? <ActivityIndicator color={colors.primary} /> : isCurrent ? (
                            <Check size={20} color={colors.primary} />
                          ) : <ChevronRight size={18} color={colors.mutedForeground} />}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </Card>
            </View>
          </MotionEntrance>
        ))}
      </ScreenScroll>
    </Screen>
  );
}
