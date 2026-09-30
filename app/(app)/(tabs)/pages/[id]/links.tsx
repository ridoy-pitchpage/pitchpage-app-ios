import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { ChevronLeft } from "lucide-react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { EmptyState, ErrorState, Loading } from "@/components/States";
import { Body, H1, H3, Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { useCreatePageLink, useDeletePageLink, useMyPage, usePageLinks } from "@/api/queries";
import type { PageLinkRow } from "@/api/supabase-direct";
import { publicPageUrl } from "@/lib/share";
import { relativeTime } from "@/lib/format";
import { useColors } from "@/theme/ThemeProvider";

/**
 * Tracked links (S24).
 *
 * One labelled link per recipient, so the owner can tell who opened the page
 * even though almost nothing arrives with a referrer. Per-link view counts come
 * with analytics in M6; this is creating, copying and removing them.
 *
 * Published only, as on the web: a labelled link exists to be sent out, and a
 * draft has no public URL to label.
 */
export default function TrackedLinksScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const toast = useToast();

  const page = useMyPage(id);
  const links = usePageLinks(id);
  const createLink = useCreatePageLink(id ?? "");
  const deleteLink = useDeletePageLink(id ?? "");

  const [label, setLabel] = useState("");

  if (page.isPending || links.isPending) {
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
  const isLive = row.published_at != null && row.slug != null;

  async function create() {
    const trimmed = label.trim();
    if (!trimmed) {
      toast.error(new Error("Give the link a label (e.g. the company name)."));
      return;
    }
    try {
      const link = await createLink.mutateAsync(trimmed);
      setLabel("");
      if (row.slug) {
        await Clipboard.setStringAsync(publicPageUrl(row.slug, link.ref_slug));
        toast.success("Link created and copied");
      }
    } catch (error) {
      toast.error(error);
    }
  }

  return (
    <Screen>
      <ScreenScroll contentClassName="pt-2 gap-4">
        <BackButton />

        <H1>Tracked links</H1>
        <Body className="text-muted-foreground">
          Make a link for each place you send your page, and you'll be able to
          tell who opened it.
        </Body>

        {!isLive ? (
          <Card className="gap-3">
            <H3>Publish first</H3>
            <Muted>Tracked links point at the live page, so there's nothing to track yet.</Muted>
            <Button
              title="Go to publish"
              onPress={() =>
                router.push({ pathname: "/(app)/preview/[id]", params: { id: row.id } })
              }
            />
          </Card>
        ) : (
          <>
            <Card className="gap-3">
              <H3>New link</H3>
              <TextField
                value={label}
                onChangeText={setLabel}
                accessibilityLabel="Who this link is for"
                placeholder="e.g. Acme Corp"
                maxLength={80}
                returnKeyType="go"
                onSubmitEditing={() => void create()}
              />
              <Button title="Create and copy" loading={createLink.isPending} onPress={() => void create()} />
            </Card>

            {links.isError ? (
              <ErrorState error={links.error} onRetry={() => void links.refetch()} />
            ) : (links.data ?? []).length === 0 ? (
              <EmptyState
                title="No tracked links yet"
                body="Make one for each company or person you send the page to."
              />
            ) : (
              (links.data ?? []).map((link) => (
                <LinkRow
                  key={link.id}
                  link={link}
                  slug={row.slug as string}
                  onDelete={() =>
                    Alert.alert("Remove this link?", `"${link.label}" will stop working.`, [
                      { text: "Keep it", style: "cancel" },
                      {
                        text: "Remove",
                        style: "destructive",
                        onPress: () =>
                          deleteLink.mutate(link.id, {
                            onSuccess: () => toast.success("Link removed"),
                            onError: (error) => toast.error(error),
                          }),
                      },
                    ])
                  }
                />
              ))
            )}
          </>
        )}
      </ScreenScroll>
    </Screen>
  );
}

function LinkRow({
  link,
  slug,
  onDelete,
}: {
  link: PageLinkRow;
  slug: string;
  onDelete: () => void;
}) {
  const toast = useToast();
  const url = publicPageUrl(slug, link.ref_slug);

  return (
    <Card className="gap-2">
      <H3 numberOfLines={1}>{link.label}</H3>
      <Muted numberOfLines={1}>{url}</Muted>
      <Muted>Created {relativeTime(link.created_at)}</Muted>
      <View className="flex-row gap-2 pt-1">
        <Pressable
          onPress={async () => {
            await Clipboard.setStringAsync(url);
            toast.success("Link copied");
          }}
          accessibilityRole="button"
          accessibilityLabel={`Copy the link for ${link.label}`}
          className="min-h-[44px] justify-center rounded-control border border-border px-3"
        >
          <Body>Copy</Body>
        </Pressable>
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Remove the link for ${link.label}`}
          className="min-h-[44px] justify-center rounded-control border border-border px-3"
        >
          <Body className="text-destructive">Remove</Body>
        </Pressable>
      </View>
    </Card>
  );
}
