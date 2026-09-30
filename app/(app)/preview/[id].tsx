import { useMemo, useState } from "react";
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
import { sectionsForLayout, type PageSection } from "@/page/page-sections";
import { toPageModel } from "@/page/page-model";
import { checkPageHealth, pageIsEmpty, EMPTY_PAGE_MESSAGE } from "@/page/page-health";
import { creditCount } from "@/lib/format";

/**
 * Review and publish (S74/S75/S68).
 *
 * Rows rather than a rendered page: a draft has no public URL, and drawing the
 * real thing needs a render surface on the website that does not exist yet
 * (master plan §14). The web's own Review step is a row per part too, so this
 * is the same check, not a lesser one. Once published, "See it live" opens the
 * real page.
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

  const [healthAcknowledged, setHealthAcknowledged] = useState(false);

  // `sections` is jsonb, so the row has to go through the model — which runs
  // the web's clampSections — before any of the page logic can read it.
  const model = useMemo(() => (page.data ? toPageModel(page.data) : null), [page.data]);
  const health = useMemo(() => (model ? checkPageHealth(model) : null), [model]);
  const empty = useMemo(() => (model ? pageIsEmpty(model) : false), [model]);
  const sections = useMemo<PageSection[]>(
    () => (model ? sectionsForLayout(model) : []),
    [model],
  );

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

  function attemptPublish() {
    if (empty) {
      void confirm({
        title: "Nothing to publish yet",
        message: EMPTY_PAGE_MESSAGE,
        confirmLabel: "OK",
        dismissOnly: true,
      });
      return;
    }
    if (health?.status === "needs_attention" && !healthAcknowledged) {
      setHealthAcknowledged(true);
      return;
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

        <H1>{row.full_name ?? "Your page"}</H1>

        <Card className="gap-3">
          <H3>What's on your page</H3>
          <ReviewRow label="Headline" value={row.headline} />
          <ReviewRow label="Bio" value={row.bio} />
          <ReviewRow label="Portrait" value={row.portrait_url ? "Added" : null} />
          <ReviewRow label="Intro video" value={row.video_url ? "Added" : null} />
          <ReviewRow label="Contact email" value={row.email} />
          <ReviewRow
            label="Sections"
            value={sections.length > 0 ? `${sections.length} with content` : null}
          />
        </Card>

        {sections.length > 0 ? (
          <Card className="gap-2">
            <H3>Sections</H3>
            {sections.map((section) => (
              <View key={section.id} className="flex-row items-center justify-between gap-3">
                <Body numberOfLines={1} className="min-w-0 flex-1">
                  {section.title || "Untitled section"}
                </Body>
                <Muted>{BLOCK_LABEL[section.blockType] ?? section.blockType}</Muted>
              </View>
            ))}
          </Card>
        ) : null}

        {!isLive && health?.status === "needs_attention" ? (
          <Card className="gap-2 border-accent">
            <H3>Before you publish</H3>
            {health.issues.map((issue) => (
              <Body key={issue.id} className="text-muted-foreground">
                • {issue.label}
              </Body>
            ))}
            <Muted>
              None of this stops you publishing — it's what a visitor would
              notice first.
            </Muted>
          </Card>
        ) : null}

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
            publishing={publish.isPending}
            acknowledged={healthAcknowledged}
            onPublish={attemptPublish}
            onBuyCredits={() => router.push("/(app)/(tabs)/credits/buy")}
            onKeepEditing={() => setHealthAcknowledged(false)}
          />
        )}
      </ScreenScroll>
    </Screen>
  );
}

const BLOCK_LABEL: Record<string, string> = {
  metric_grid: "Numbers",
  text_block: "Text",
  timeline: "Timeline",
  cards: "Cards",
  quote_list: "Quotes",
  logo_row: "Logos",
  tag_list: "Tags",
  chart: "Chart",
  cta: "Contact",
};

function ReviewRow({ label, value }: { label: string; value: string | null | undefined }) {
  const filled = Boolean(value && value.trim());
  return (
    <View className="flex-row items-start justify-between gap-3">
      <Body className="shrink-0">{label}</Body>
      <Muted numberOfLines={1} className="min-w-0 flex-1 text-right">
        {filled ? value : "Not added yet"}
      </Muted>
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
  publishing,
  acknowledged,
  onPublish,
  onKeepEditing,
  onBuyCredits,
}: {
  eligibility:
    | { mode: "sponsored" | "awaiting_credit" | "paid"; org_name: string | null; credits_remaining: number }
    | undefined;
  loading: boolean;
  publishing: boolean;
  acknowledged: boolean;
  onPublish: () => void;
  onKeepEditing: () => void;
  onBuyCredits: () => void;
}) {
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
        <Button
          title={acknowledged ? "Publish anyway" : `Publish — free via ${org}`}
          loading={publishing}
          haptic
          onPress={onPublish}
        />
        {acknowledged ? (
          <Button title="Keep editing" variant="ghost" onPress={onKeepEditing} />
        ) : null}
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
          <Button
            title={acknowledged ? "Publish anyway" : "Publish with my own credit"}
            loading={publishing}
            haptic
            onPress={onPublish}
          />
        ) : (
          <Button title="Get a credit" variant="secondary" onPress={onBuyCredits} />
        )}
        {acknowledged ? (
          <Button title="Keep editing" variant="ghost" onPress={onKeepEditing} />
        ) : null}
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
        <>
          <Button
            title={acknowledged ? "Publish anyway" : "Publish now"}
            loading={publishing}
            haptic
            onPress={onPublish}
          />
          {acknowledged ? (
            <Button title="Keep editing" variant="ghost" onPress={onKeepEditing} />
          ) : null}
        </>
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
