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
import { useMyPage, usePublishEligibility, usePublishPage } from "@/api/queries";
import { sectionsForLayout } from "@/page/page-sections";
import { toPageModel } from "@/page/page-model";
import { checkPageHealth, pageIsEmpty, EMPTY_PAGE_MESSAGE } from "@/page/page-health";
import { userFacingErrorMessage } from "@/lib/errors";
import { creditCount } from "@/lib/format";

/**
 * Review and publish (S74/S75/S68).
 *
 * A glance at the page, then the one button that moves it on: Publish, or Get
 * a credit when publishing needs one. This screen used to show each part's
 * text and then every section by name above that button, so on a real page the
 * button sat below the fold and the screen read as a form with no way out
 * (2026-10-08). The glance is one line per part, added or not, and a section
 * count, short enough that the button is always in view; the page itself is
 * checked in the builder, where it can be fixed. What a visitor would notice
 * first still comes up, as a question, when Publish is tapped. Once published,
 * "See it live" opens the real page.
 */
export default function PreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const confirm = useConfirm();

  const page = useMyPage(id);
  const isLive = page.data?.published_at != null;
  // Only meaningful for a draft; a live page has already been paid for.
  const eligibility = usePublishEligibility(id, !isLive);
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
      onSuccess: (result) => {
        if (result.published) {
          toast.success("Your page is live");
          router.replace({ pathname: "/(app)/share/[id]", params: { id } });
          return;
        }
        // The RPC ran and found no credit to spend. Everything about why lives
        // in the database, so the app states the outcome rather than guessing.
        void confirm({
          title: "You need a credit",
          message:
            "Publishing a page costs one credit. Everything you have built is saved, so nothing is lost while you sort one out.",
          confirmLabel: "OK",
          dismissOnly: true,
        });
      },
      onError: (error) => toast.error(error),
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
          <PublishCard
            eligibility={eligibility.data}
            loading={eligibility.isPending}
            loadError={eligibility.isError ? eligibility.error : null}
            retrying={eligibility.isFetching}
            onRetry={() => void eligibility.refetch()}
            publishing={publish.isPending}
            onPublish={() => void attemptPublish()}
            onBuyCredits={() => router.push("/(app)/(tabs)/credits/buy")}
          />
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

/**
 * The publish states, matching the web's (§6.8). What the button says is
 * decided by `get_publish_eligibility`, so a company-sponsored page reads the
 * same here as it does on the website.
 */
function PublishCard({
  eligibility,
  loading,
  loadError,
  retrying,
  onRetry,
  publishing,
  onPublish,
  onBuyCredits,
}: {
  eligibility:
    | { mode: "sponsored" | "awaiting_credit" | "paid"; org_name: string | null; credits_remaining: number }
    | undefined;
  loading: boolean;
  loadError: unknown;
  retrying: boolean;
  onRetry: () => void;
  publishing: boolean;
  onPublish: () => void;
  onBuyCredits: () => void;
}) {
  // Only when there is nothing to show: a background refetch that fails keeps
  // the answer already on screen. Without this, a failed check left "Checking
  // your balance…" spinning for good, with no way forward.
  if (!eligibility && loadError) {
    return (
      <Card className="gap-3">
        <H3>We couldn't check your balance</H3>
        <Muted>{userFacingErrorMessage(loadError)}</Muted>
        <Button title="Try again" variant="secondary" loading={retrying} onPress={onRetry} />
      </Card>
    );
  }

  if (loading || !eligibility) {
    return (
      <Card>
        <Button title="Checking your balance…" loading />
      </Card>
    );
  }

  const org = eligibility.org_name ?? "your company";

  if (eligibility.mode === "sponsored") {
    return (
      <Card className="gap-3">
        <H3>Ready to publish</H3>
        <Muted>{org} covers your pages, so this one is free.</Muted>
        <Button title={`Publish — free via ${org}`} loading={publishing} haptic onPress={onPublish} />
      </Card>
    );
  }

  if (eligibility.mode === "awaiting_credit") {
    return (
      <Card className="gap-3">
        <H3>Waiting on a credit</H3>
        <Muted>
          {org} hasn't assigned you a credit yet. Ask them, or use one of your
          own.
        </Muted>
        {eligibility.credits_remaining > 0 ? (
          <Button title="Publish with my own credit" loading={publishing} haptic onPress={onPublish} />
        ) : (
          <Button title="Get a credit" variant="secondary" onPress={onBuyCredits} />
        )}
      </Card>
    );
  }

  const hasCredit = eligibility.credits_remaining > 0;

  return (
    <Card className="gap-3">
      <H3>{hasCredit ? "Ready to publish" : "You need a credit"}</H3>
      <Muted>
        {hasCredit
          ? `Publishing uses one credit. You have ${creditCount(eligibility.credits_remaining)}.`
          : "Publishing a page costs one credit. Everything you've built is saved either way."}
      </Muted>
      {hasCredit ? (
        <Button title="Publish now" loading={publishing} haptic onPress={onPublish} />
      ) : (
        /*
          With no credit this card used to end here — a heading, a sentence,
          and nothing to press. Getting to the end of building a page and
          finding no way forward reads as a broken screen rather than a
          price, so the way forward is a button.
        */
        <Button title="Get a credit" onPress={onBuyCredits} />
      )}
    </Card>
  );
}
