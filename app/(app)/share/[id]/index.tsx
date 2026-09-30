import { Linking, Pressable, Share, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";
import { QrCode } from "lucide-react-native";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { ErrorState, Loading } from "@/components/States";
import { Body, H1, H3, Muted } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { useMyPage } from "@/api/queries";
import {
  buildShareText,
  mailto,
  publicPageUrl,
  shareUrl,
  withShareChannel,
  type ShareNetwork,
} from "@/lib/share";
import { useColors } from "@/theme/ThemeProvider";

/**
 * Share (S76).
 *
 * Every button stamps its own `?via=` channel, because 87% of views arrive with
 * no referrer at all — a pitch page gets shared in a DM or an email, not linked
 * from a web page — so this is the only way the owner learns how someone came
 * to open it.
 */
export default function ShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const toast = useToast();
  const page = useMyPage(id);

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
  const isLive = row.published_at != null;

  if (!isLive || !row.slug) {
    return (
      <Screen>
        <ScreenScroll contentClassName="pt-4 gap-4">
          <BackRow />
          <H1>Not live yet</H1>
          <Body className="text-muted-foreground">
            Publish this page and you'll get a link to share.
          </Body>
          <Button
            title="Go to publish"
            onPress={() => router.replace({ pathname: "/(app)/preview/[id]", params: { id: row.id } })}
          />
        </ScreenScroll>
      </Screen>
    );
  }

  const url = publicPageUrl(row.slug);
  const person = { name: row.full_name, headline: row.headline };

  async function copy() {
    await Clipboard.setStringAsync(withShareChannel(url, "copy"));
    toast.success("Link copied");
  }

  async function nativeShare() {
    const shareLink = withShareChannel(url, "share");
    try {
      await Share.share({ message: buildShareText(person, shareLink), url: shareLink });
    } catch (error) {
      toast.error(error);
    }
  }

  async function openNetwork(network: ShareNetwork) {
    const link = withShareChannel(url, network);
    await WebBrowser.openBrowserAsync(shareUrl(network, link, buildShareText(person, link)));
  }

  async function openEmail() {
    const link = withShareChannel(url, "email");
    const target = mailto(person, link);
    const supported = await Linking.canOpenURL(target);
    if (!supported) {
      await Clipboard.setStringAsync(link);
      toast.success("No mail app — link copied instead");
      return;
    }
    await Linking.openURL(target);
  }

  return (
    <Screen>
      <ScreenScroll contentClassName="pt-2 gap-4">
        <View className="flex-row items-center justify-between">
          <BackRow />
          <Badge label="Live" tone="live" />
        </View>

        <H1>Share your page</H1>

        <Card className="gap-3">
          <Muted numberOfLines={1}>{url}</Muted>
          <Button title="Copy link" onPress={() => void copy()} haptic />
          <Button title="Share…" variant="secondary" onPress={() => void nativeShare()} />
        </Card>

        <View className="gap-2">
          <H3>Send it somewhere</H3>
          <Card className="gap-2">
            <ShareRow label="LinkedIn" onPress={() => void openNetwork("linkedin")} />
            <ShareRow label="X" onPress={() => void openNetwork("x")} />
            <ShareRow label="WhatsApp" onPress={() => void openNetwork("whatsapp")} />
            <ShareRow label="Facebook" onPress={() => void openNetwork("facebook")} />
            <ShareRow label="Email" onPress={() => void openEmail()} last />
          </Card>
        </View>

        <Button
          title="Show a QR code"
          variant="secondary"
          icon={<QrCode size={18} color={colors.foreground} />}
          onPress={() => router.push({ pathname: "/(app)/share/[id]/qr", params: { id: row.id } })}
        />

        <Button
          title="Tracked links"
          variant="ghost"
          onPress={() =>
            router.push({ pathname: "/(app)/(tabs)/pages/[id]/links", params: { id: row.id } })
          }
        />

        <Button
          title="See it live"
          variant="ghost"
          onPress={() => router.push({ pathname: "/(app)/live/[id]", params: { id: row.id } })}
        />
      </ScreenScroll>
    </Screen>
  );
}

function BackRow() {
  return (
    <BackButton />
  );
}

function ShareRow({
  label,
  onPress,
  last = false,
}: {
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Share on ${label}`}
      className={[
        "min-h-[44px] justify-center",
        last ? "" : "border-b border-border",
      ].join(" ")}
    >
      <Body>{label}</Body>
    </Pressable>
  );
}
