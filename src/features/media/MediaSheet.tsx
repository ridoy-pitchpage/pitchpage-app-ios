import { useState } from "react";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Camera, ImageIcon, Trash2, Video } from "lucide-react-native";

import { Button } from "@/components/Button";
import { useConfirm } from "@/components/Confirm";
import { Sheet } from "@/components/Sheet";
import { Body, Muted } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { fileSize } from "./local-file";
import { useDraft } from "@/state/draft-store";
import { MEDIA_LIMITS, removeMedia, tooLargeMessage, uploadMedia } from "./upload";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP } from "@/theme/tokens";
import { SITE_URL } from "@/lib/config";

/**
 * Portrait and intro video.
 *
 * The picker's own `allowsEditing` gives the native crop, which is better than
 * a hand-built one: it is the control people already know, it handles zoom and
 * rotation, and it is fully accessible without us reimplementing any of that.
 *
 * A portrait is resized before upload. Phone cameras produce 4000px files, and
 * a page shows the portrait at around 400px, so the full-size original is
 * several seconds of somebody's data for no visible gain.
 */

const PORTRAIT_MAX_EDGE = 1600;

export function MediaSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const toast = useToast();
  const confirm = useConfirm();
  const page = useDraft((s) => s.page);
  const patchNow = useDraft((s) => s.patchNow);
  const [busy, setBusy] = useState<"portrait" | "video" | null>(null);

  if (!page) return null;

  const portrait = page.portrait_url
    ? page.portrait_url.startsWith("http")
      ? page.portrait_url
      : `${SITE_URL}${page.portrait_url}`
    : null;

  async function pickPortrait(source: "camera" | "library") {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      void confirm({
        title: source === "camera" ? "Camera access is off" : "Photo access is off",
        message: "You can turn it back on in Settings if you change your mind.",
        confirmLabel: "OK",
        dismissOnly: true,
      });
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      // The native crop, rather than a hand-built one.
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    };

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ ...options, cameraType: ImagePicker.CameraType.front })
        : await ImagePicker.launchImageLibraryAsync(options);

    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;

    setBusy("portrait");
    try {
      const context = ImageManipulator.ImageManipulator.manipulate(asset.uri);
      context.resize({ width: PORTRAIT_MAX_EDGE });
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const size = await fileSize(saved.uri);
      if (size > MEDIA_LIMITS.imageBytes) {
        toast.error(new Error(tooLargeMessage("image")));
        return;
      }

      const { url } = await uploadMedia({
        kind: "portrait",
        pageId: page!.id,
        uri: saved.uri,
        ext: "jpg",
        contentType: "image/jpeg",
        replaces: page!.portrait_url,
      });

      // Saved at once, not on a debounce: a photo somebody just took is worth
      // more than a round trip.
      await patchNow({ portrait_url: url });
      toast.success("Portrait added");
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(null);
    }
  }

  async function pickVideo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      void confirm({
        title: "Photo access is off",
        message: "You can turn it back on in Settings.",
        confirmLabel: "OK",
        dismissOnly: true,
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: MEDIA_LIMITS.videoSeconds,
      quality: 1,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;

    setBusy("video");
    try {
      const size = await fileSize(asset.uri);
      if (size > MEDIA_LIMITS.videoBytes) {
        toast.error(new Error(tooLargeMessage("video")));
        return;
      }

      // iPhones record HEVC .mov by default, which several desktop browsers
      // will not play. Until the app exports H.264 itself, an uploaded file
      // keeps its own container and the extension is preserved so the bucket's
      // MIME check passes.
      const ext = (asset.uri.split(".").pop() ?? "mp4").toLowerCase();
      const contentType =
        ext === "mov" ? "video/quicktime" : ext === "webm" ? "video/webm" : "video/mp4";

      const { url } = await uploadMedia({
        kind: "video",
        pageId: page!.id,
        uri: asset.uri,
        ext,
        contentType,
        replaces: page!.video_url,
      });

      await patchNow({ video_url: url, video_trim_start: null, video_trim_end: null });
      toast.success("Video added");
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(null);
    }
  }

  async function removePortrait() {
    const ok = await confirm({
      title: "Remove your portrait?",
      message: "You can add another one any time.",
      confirmLabel: "Remove",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (!ok) return;
    const previous = page!.portrait_url;
    await patchNow({ portrait_url: null });
    if (previous) await removeMedia("portrait", [previous]);
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Photo and video">
      <View className="gap-5 pb-2">
        <View className="gap-3">
          <Body className="font-body-bold">Portrait</Body>
          <Muted>
            A clear photo of your face. It's the first thing anyone opening your
            page will look at.
          </Muted>

          {portrait ? (
            <View className="flex-row items-center gap-3">
              <Image
                source={{ uri: portrait }}
                style={{ width: 72, height: 72, borderRadius: 8, backgroundColor: colors.muted }}
                contentFit="cover"
                accessibilityLabel="Your portrait"
              />
              <Pressable
                onPress={removePortrait}
                accessibilityRole="button"
                accessibilityLabel="Remove your portrait"
                style={{ minHeight: MIN_TAP, minWidth: MIN_TAP }}
                className="items-center justify-center"
              >
                <Trash2 size={20} color={colors.destructive} />
              </Pressable>
            </View>
          ) : null}

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                title="Take a photo"
                variant="secondary"
                loading={busy === "portrait"}
                icon={<Camera size={17} color={colors.foreground} />}
                onPress={() => void pickPortrait("camera")}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Choose one"
                variant="secondary"
                disabled={busy != null}
                icon={<ImageIcon size={17} color={colors.foreground} />}
                onPress={() => void pickPortrait("library")}
              />
            </View>
          </View>
        </View>

        <View className="gap-3 border-t border-border pt-4">
          <Body className="font-body-bold">Intro video</Body>
          <Muted>
            Up to two minutes. A short hello does more than another paragraph.
          </Muted>

          {page.video_url ? <Muted className="text-link">Video added</Muted> : null}

          <Button
            title={page.video_url ? "Choose a different video" : "Choose a video"}
            variant="secondary"
            loading={busy === "video"}
            icon={<Video size={17} color={colors.foreground} />}
            onPress={() => void pickVideo()}
          />
          <Muted>
            Recording in the app, trimming and background effects are coming.
          </Muted>
        </View>
      </View>
    </Sheet>
  );
}
