import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { ChevronLeft } from "lucide-react-native";

import { Button } from "@/components/Button";
import { BackButton } from "@/components/BackButton";
import { Screen, ScreenScroll } from "@/components/Screen";
import { ErrorState, Loading } from "@/components/States";
import { Body, H1, Muted } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { useMyPage } from "@/api/queries";
import { publicPageUrl, withShareChannel } from "@/lib/share";
import { useColors } from "@/theme/ThemeProvider";

/**
 * The QR code (S77), for showing someone in person — a careers fair, the end of
 * an interview. It carries `?via=qr` so those scans are distinguishable in
 * analytics from a link that was copied.
 *
 * The code is drawn on white whatever the app's appearance: scanners want a
 * light quiet zone, and an inverted code fails on many of them.
 */
export default function QrScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const toast = useToast();
  const page = useMyPage(id);
  const svgRef = useRef<{ toDataURL: (callback: (data: string) => void) => void } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Nothing to clean up yet, but a future brightness boost belongs here.
  }, []);

  if (page.isPending) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (page.isError || !page.data?.slug) {
    return (
      <Screen>
        <ErrorState error={page.error} onRetry={() => void page.refetch()} />
      </Screen>
    );
  }

  const url = withShareChannel(publicPageUrl(page.data.slug), "qr");

  async function shareImage() {
    const node = svgRef.current;
    if (!node) return;

    setSaving(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        // react-native-qrcode-svg hands back raw base64 through a callback and
        // has no failure path, so the timeout is what stops a hang.
        const timer = setTimeout(() => reject(new Error("Couldn't build the image.")), 5000);
        node.toDataURL((data) => {
          clearTimeout(timer);
          resolve(data);
        });
      });

      if (!(await Sharing.isAvailableAsync())) {
        toast.error(new Error("Sharing isn't available on this device."));
        return;
      }

      // The cache directory, because this file only has to survive long enough
      // to reach the share sheet; the system may reclaim it afterwards.
      const file = new File(Paths.cache, "pitchpage-qr.png");
      file.create({ overwrite: true });
      file.write(base64, { encoding: "base64" });
      await Sharing.shareAsync(file.uri, { mimeType: "image/png", UTI: "public.png" });
    } catch (error) {
      toast.error(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScreenScroll contentClassName="pt-2 gap-5">
        <BackButton />

        <H1>Scan to open</H1>
        <Body className="text-muted-foreground">
          Turn your screen brightness up and let them point a camera at it.
        </Body>

        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel="QR code for your pitch page"
          className="items-center self-center rounded-card bg-white p-6"
        >
          <QRCode
            value={url}
            size={240}
            backgroundColor="#FFFFFF"
            color="#000000"
            getRef={(ref) => {
              svgRef.current = ref as never;
            }}
          />
        </View>

        <Muted className="text-center">{url}</Muted>

        {Platform.OS === "web" ? null : (
          <Button
            title="Share the image"
            variant="secondary"
            loading={saving}
            onPress={() => void shareImage()}
          />
        )}
      </ScreenScroll>
    </Screen>
  );
}
