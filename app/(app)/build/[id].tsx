import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { BriefcaseBusiness, FileText, Globe2, Trash2, Upload } from "lucide-react-native";

import { ActionBar } from "@/components/ActionBar";
import { BackButton } from "@/components/BackButton";
import { fileSize } from "@/features/media/local-file";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H3, Muted } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { ErrorState, Loading } from "@/components/States";
import { useConfirm } from "@/components/Confirm";
import { useToast } from "@/components/Toast";
import { keys, useMyPage } from "@/api/queries";
import { savePage } from "@/api/supabase-direct";
import { MEDIA_LIMITS, removeMedia, tooLargeMessage, uploadMedia } from "@/features/media/upload";
import { useColors } from "@/theme/ThemeProvider";

/**
 * The last step before the builder: what the page is made from.
 *
 * The website's wizard takes a resume, has AI read it, and composes a first
 * draft — so the person edits something rather than facing empty fields. This
 * step is the app's version of that: the CV, the links worth carrying over,
 * and a direct path into the working manual builder. AI composition is not
 * offered until its server endpoint and consent flow are ready.
 */

const RESUME_EXTENSIONS = ["pdf", "doc", "docx"];

export default function BuildScreen() {
  const colors = useColors();
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const page = useMyPage(id);

  const [linkedin, setLinkedin] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<string | null>(null);
  const [busy, setBusy] = useState<"resume" | "save" | null>(null);

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
  // Null means "not edited on this screen yet", so the field shows what is
  // already saved without overwriting it with a stale empty string.
  const linkedinValue = linkedin ?? row.linkedin_url ?? "";
  const portfolioValue = portfolio ?? row.primary_cta_url ?? "";

  async function pickResume() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      copyToCacheDirectory: true,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;

    const ext = (asset.name.split(".").pop() ?? "pdf").toLowerCase();
    if (!RESUME_EXTENSIONS.includes(ext)) {
      toast.error(new Error("A CV needs to be a PDF or a Word document."));
      return;
    }

    setBusy("resume");
    try {
      const size = asset.size ?? (await fileSize(asset.uri));
      if (size > MEDIA_LIMITS.documentBytes) {
        toast.error(new Error(tooLargeMessage("document")));
        return;
      }
      const { url } = await uploadMedia({
        kind: "resume",
        pageId: row.id,
        uri: asset.uri,
        ext,
        contentType: asset.mimeType ?? "application/pdf",
        replaces: row.resume_url,
      });
      await savePage(row.id, { resume_url: url }, row.updated_at);
      await queryClient.invalidateQueries({ queryKey: keys.page(row.id) });
      toast.success("CV added");
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(null);
    }
  }

  async function removeResume() {
    const ok = await confirm({
      title: "Remove your CV?",
      message: "You can upload another one any time.",
      confirmLabel: "Remove",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (!ok) return;
    const previous = row.resume_url;
    await savePage(row.id, { resume_url: null }, row.updated_at);
    await queryClient.invalidateQueries({ queryKey: keys.page(row.id) });
    if (previous) await removeMedia("resume", [previous]);
  }

  /** Save what is on this screen, then open the builder. */
  async function saveAndBuild() {
    setBusy("save");
    try {
      await savePage(
        row.id,
        {
          linkedin_url: linkedinValue.trim() || null,
          primary_cta_url: portfolioValue.trim() || null,
        },
        row.updated_at,
      );
      await queryClient.invalidateQueries({ queryKey: keys.page(row.id) });
      await queryClient.invalidateQueries({ queryKey: keys.pages });
      router.replace({ pathname: "/(app)/builder/[id]", params: { id: row.id } });
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScreenScroll contentClassName="pt-2 gap-5">
          <View className="flex-row items-center justify-between gap-3">
            <BackButton />
            <Muted className="min-w-0 flex-1 text-right font-body-bold text-[12px]" style={{ color: colors.link }}>
              SET UP YOUR PAGE · 3 OF 3
            </Muted>
          </View>

          <View className="gap-3">
            <View className="flex-row gap-1.5" accessibilityRole="progressbar"
              accessibilityLabel="Content. Step 3 of 3: page type, design, content."
              accessibilityValue={{ min: 1, max: 3, now: 3 }}>
              {[0, 1, 2].map((step) => <View key={step} className="h-1 flex-1 rounded-full"
                style={{ backgroundColor: colors.primary }} />)}
            </View>
            <H1>Add the essentials</H1>
            <Muted>Add your CV and useful links. Everything here is optional and can be changed later.</Muted>
          </View>

          <Card flat className="gap-4">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-control bg-secondary">
                <FileText size={20} color={colors.link} strokeWidth={1.8} />
              </View>
              <View className="min-w-0 flex-1">
                <H3>Your CV</H3>
                <Muted className="text-[12px]">Optional</Muted>
              </View>
            </View>
            <Muted>PDF or Word. It becomes the resume people can download from your page.</Muted>

            {row.resume_url ? (
              <View className="flex-row items-center gap-3">
                <FileText size={20} color={colors.primary} />
                <Body className="min-w-0 flex-1">CV added</Body>
                <Button
                  title="Remove"
                  variant="secondary"
                  fullWidth={false}
                  icon={<Trash2 size={16} color={colors.destructive} />}
                  onPress={() => void removeResume()}
                />
              </View>
            ) : (
              <Button
                title="Upload your CV"
                variant="secondary"
                loading={busy === "resume"}
                icon={<Upload size={17} color={colors.foreground} />}
                onPress={() => void pickResume()}
              />
            )}
          </Card>

          <Card flat className="gap-4">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-control bg-secondary">
                <Globe2 size={20} color={colors.link} strokeWidth={1.8} />
              </View>
              <View className="min-w-0 flex-1">
                <H3>Your links</H3>
                <Muted className="text-[12px]">Where people can find more</Muted>
              </View>
            </View>
            <TextField
              label="LinkedIn"
              icon={<BriefcaseBusiness size={18} color={colors.mutedForeground} />}
              value={linkedinValue}
              onChangeText={setLinkedin}
              placeholder="linkedin.com/in/you"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TextField
              label="Portfolio or website"
              icon={<Globe2 size={18} color={colors.mutedForeground} />}
              value={portfolioValue}
              onChangeText={setPortfolio}
              placeholder="yoursite.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </Card>
        </ScreenScroll>

        <ActionBar safeBottom className="gap-2">
          <Button
            title="Continue to builder"
            loading={busy === "save"}
            disabled={busy === "resume"}
            onPress={() => void saveAndBuild()}
          />
        </ActionBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
