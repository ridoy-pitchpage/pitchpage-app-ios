import { useMemo } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { ErrorState, Loading } from "@/components/States";
import { Body, H1, H3, Muted } from "@/components/Text";
import { useConfirm } from "@/components/Confirm";
import { useToast } from "@/components/Toast";
import { useMyPage, usePublishPage } from "@/api/queries";
import { FREE_LIVE_PAGES, isPublishCapError } from "@/api/supabase-direct";
import { sectionsForLayout } from "@/page/page-sections";
import { toPageModel } from "@/page/page-model";
import { checkPageHealth, pageIsEmpty, EMPTY_PAGE_MESSAGE } from "@/page/page-health";

/**
 * Review and publish (S74/S75/S68).
 *
 * A glance at the page, then the one button that moves it on: Publish. This
 * screen used to show each part's text and then every section by name above
 * that button, so on a real page the button sat below the fold and the screen
 * read as a form with no way out (2026-10-08). The glance is one line per
 * part, added or not, and a section count, short enough that the button is
 * always in view; the page itself is checked in the builder, where it can be
 * fixed. What a visitor would notice first still comes up, as a question, when
 * Publish is tapped. Once published, "See it live" opens the real page.
 *
 * Publishing from the app is free (2026-10-09). The app sells nothing, so
 * this screen no longer reads a balance or a company's eligibility, and has
 * no "Get a credit".
 */
export default function PreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const confirm = useConfirm();

  const page = useMyPage(id);
  const isLive = page.data?.published_at != null;
  const publish = usePublishPage();

  // `sections` is jsonb, so the row has to go through the model — which runs
  // the web's clampSections — before any of the page logic can read it.
  const model = useMemo(() => (page.data ? toPageModel(page.data) : null), [page.data]);
  const health = useMemo(() => (model ? checkPageHealth(model) : null), [model]);
  const empty = useMemo(() => (model ? pageIsEmpty(model) : false), [model]);
  // What a visitor would see, so a section left empty is not counted.
  const sectionCount = useMemo(() => (model ? sectionsForLayout(model).length : 0), [model]);

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

  function doPublish() {
    if (!id) return;
    publish.mutate(id, {
      onSuccess: () => {
        toast.success("Your page is live");
        router.replace({ pathname: "/(app)/share/[id]", params: { id } });
      },
      onError: (error) => {
        if (!isPublishCapError(error)) {
          toast.error(error);
          return;
        }
        // A toast is gone in four seconds, and the fix for this one is on
        // another screen, so it waits to be read and offers the way there.
        // dismissTo goes back to the tabs already open rather than stacking
        // a second set above this screen.
        void confirm({
          title: `You have ${FREE_LIVE_PAGES} pages live from the app`,
          message: `Publishing from the app is free for up to ${FREE_LIVE_PAGES} live pages at a time. Take one offline, then publish this one.`,
          confirmLabel: "See your pages",
          cancelLabel: "Not now",
        }).then((go) => {
          if (go) router.dismissTo("/(app)/(tabs)/pages");
        });
      },
    });
  }

  async function attemptPublish() {
    if (empty) {
      void confirm({
        title: "Nothing to publish yet",
        message: EMPTY_PAGE_MESSAGE,
        confirmLabel: "OK",
        dismissOnly: true,
      });
      return;
    }
    // Asked here, at the moment it matters, rather than listed on the screen
    // above the button, where it pushed the button out of sight.
    if (health?.status === "needs_attention") {
      const publishAnyway = await confirm({
        title: "Before you publish",
        message: [
          ...health.issues.map((issue) => `• ${issue.label}`),
          "",
          "None of this stops you publishing — it's what a visitor would notice first.",
        ].join("\n"),
        confirmLabel: "Publish anyway",
        cancelLabel: "Keep editing",
      });
      if (!publishAnyway) return;
    }
    doPublish();
  }

  return (
    <Screen>
      <ScreenScroll contentClassName="pt-2 gap-4">
        <View className="flex-row items-center justify-between">
          <BackButton />
          <Badge label={isLive ? "Published" : "Draft"} tone={isLive ? "live" : "draft"} />
        </View>

        {/* full_name is NOT NULL and saved as "" when cleared, so ?? would never fall back. */}
        <H1>{row.full_name || "Your page"}</H1>

        <Card className="gap-2">
          <H3>What's on your page</H3>
          <GlanceRow label="Headline" status={addedOrNot(row.headline)} />
          <GlanceRow label="Bio" status={addedOrNot(row.bio)} />
          <GlanceRow label="Portrait" status={addedOrNot(row.portrait_url)} />
          <GlanceRow label="Intro video" status={addedOrNot(row.video_url)} />
          <GlanceRow
            label="Sections"
            status={sectionCount === 0 ? "None yet" : `${sectionCount} with content`}
          />
        </Card>

        {isLive ? (
          <View className="gap-3">
            <Button
              title="Share your page"
              haptic
              onPress={() =>
                router.push({ pathname: "/(app)/share/[id]", params: { id: row.id } })
              }
            />
            <Button
              title="See it live"
              variant="secondary"
              onPress={() =>
                router.push({ pathname: "/(app)/live/[id]", params: { id: row.id } })
              }
            />
          </View>
        ) : (
          <Card className="gap-3">
            <H3>Ready to publish</H3>
            <Muted>
              {`Publishing from the app is free for up to ${FREE_LIVE_PAGES} live pages at a time.`}
            </Muted>
            <Button
              title="Publish now"
              loading={publish.isPending}
              haptic
              onPress={() => void attemptPublish()}
            />
          </Card>
        )}
      </ScreenScroll>
    </Screen>
  );
}

function addedOrNot(value: string | null | undefined): string {
  return value && value.trim() ? "Added" : "Not added yet";
}

/** One line of the glance, read by VoiceOver as one item: "Bio, Added". */
function GlanceRow({ label, status }: { label: string; status: string }) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${status}`}
      className="flex-row items-center justify-between gap-3"
    >
      <Body className="shrink-0">{label}</Body>
      <Muted className="min-w-0 flex-1 text-right">{status}</Muted>
    </View>
  );
}
